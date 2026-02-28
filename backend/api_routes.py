import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from . import database, models, schemas, ml_engine, gmail_service
from typing import List

router = APIRouter()


@router.post("/auth/login", response_model=schemas.LoginResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    pw_hash = hashlib.sha256(data.password.encode()).hexdigest()
    user = db.query(models.User).filter(
        models.User.username == data.username,
        models.User.password_hash == pw_hash
    ).first()
    if not user:
        return schemas.LoginResponse(success=False, message="Invalid username or password")
    return schemas.LoginResponse(success=True, user={"name": user.username})


@router.post("/auth/register", response_model=schemas.LoginResponse)
def register(data: schemas.RegisterRequest, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.username == data.username).first():
        return schemas.LoginResponse(success=False, message="Username already taken")
    if data.email and db.query(models.User).filter(models.User.email == data.email).first():
        return schemas.LoginResponse(success=False, message="Email already registered")
    pw_hash = hashlib.sha256(data.password.encode()).hexdigest()
    user = models.User(username=data.username, password_hash=pw_hash, email=data.email or None)
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.LoginResponse(success=True, user={"name": user.username})

@router.post("/analyze_email", response_model=schemas.EmailResponse)
def analyze_email(email: schemas.EmailCreate, db: Session = Depends(database.get_db)):
    body_clean = gmail_service.strip_html_and_clean(email.body)
    scam_result = ml_engine.detect_scam(email.subject, body_clean)
    scam_label = scam_result["label"]
    scam_score = scam_result["score"]
    priority = ml_engine.classify_priority(email.subject, body_clean)
    folder = ml_engine.determine_folder(scam_label, priority)
    db_email = models.Email(
        sender=email.sender,
        subject=email.subject,
        body=body_clean,
        scam_label=scam_label,
        scam_score=scam_score,
        priority=priority,
        folder=folder
    )
    db.add(db_email)
    db.commit()
    db.refresh(db_email)
    
    # 5. Save Automation Log
    action = f"Moved to {folder}"
    log = models.AutomationLog(email_id=db_email.id, action=action)
    db.add(log)
    db.commit()
    
    return db_email

@router.get("/emails", response_model=List[schemas.EmailResponse])
def get_emails(db: Session = Depends(database.get_db)):
    return db.query(models.Email).order_by(models.Email.timestamp.desc()).all()


@router.delete("/emails/{email_id}")
def delete_email(email_id: int, db: Session = Depends(database.get_db)):
    db_email = db.query(models.Email).filter(models.Email.id == email_id).first()
    if not db_email:
        raise HTTPException(status_code=404, detail="Email not found")
    db.query(models.AutomationLog).filter(models.AutomationLog.email_id == email_id).delete()
    db.delete(db_email)
    db.commit()
    return {"message": "Email deleted"}


@router.patch("/emails/{email_id}/folder")
def update_email_folder(
    email_id: int,
    folder: str = Query(..., description="Spam, Inbox, or Archive"),
    db: Session = Depends(database.get_db),
):
    """Move email to a folder (e.g. Spam)."""
    allowed = {"spam", "inbox", "archive"}
    if folder.lower() not in allowed:
        raise HTTPException(status_code=400, detail="Folder must be Spam, Inbox, or Archive")
    db_email = db.query(models.Email).filter(models.Email.id == email_id).first()
    if not db_email:
        raise HTTPException(status_code=404, detail="Email not found")
    db_email.folder = folder.capitalize()
    if folder.lower() == "spam":
        db_email.scam_label = "Scam"
        db_email.scam_score = min(1.0, (db_email.scam_score or 0) + 0.5)
    db.add(models.AutomationLog(email_id=db_email.id, action=f"Moved to {db_email.folder} (user action)"))
    db.commit()
    db.refresh(db_email)
    return db_email


@router.get("/automation_logs", response_model=List[schemas.AutomationLogResponse])
def get_automation_logs(limit: int = 50, db: Session = Depends(database.get_db)):
    logs = db.query(models.AutomationLog).order_by(models.AutomationLog.timestamp.desc()).limit(limit).all()
    return logs

@router.get("/analytics", response_model=schemas.AnalyticsResponse)
def get_analytics(db: Session = Depends(database.get_db)):
    emails = db.query(models.Email).all()
    
    total = len(emails)
    scam = sum(1 for e in emails if e.scam_label == "Scam")
    legit = total - scam
    high = sum(1 for e in emails if e.priority == "High")
    med = sum(1 for e in emails if e.priority == "Medium")
    low = sum(1 for e in emails if e.priority == "Low")
    
    return schemas.AnalyticsResponse(
        total_emails=total,
        scam_count=scam,
        legitimate_count=legit,
        high_priority_count=high,
        medium_priority_count=med,
        low_priority_count=low
    )

@router.post("/sync_gmail")
def sync_gmail(db: Session = Depends(database.get_db)):
    try:
        new_emails = gmail_service.fetch_gmails(days=3)
        synced_count = 0
        
        for email_data in new_emails:
            # Check if email with same subject and sender exists to avoid simple duplicates
            exists = db.query(models.Email).filter(
                models.Email.subject == email_data.subject,
                models.Email.sender == email_data.sender
            ).first()
            
            if not exists:
                body_clean = gmail_service.strip_html_and_clean(email_data.body)
                scam_result = ml_engine.detect_scam(email_data.subject, body_clean)
                scam_label = scam_result["label"]
                scam_score = scam_result["score"]
                priority = ml_engine.classify_priority(email_data.subject, body_clean)
                folder = ml_engine.determine_folder(scam_label, priority)
                db_email = models.Email(
                    sender=email_data.sender,
                    subject=email_data.subject,
                    body=body_clean,
                    scam_label=scam_label,
                    scam_score=scam_score,
                    priority=priority,
                    folder=folder
                )
                db.add(db_email)
                db.commit()
                db.refresh(db_email)
                
                # 5. Save Automation Log
                action = f"Synced from Gmail. Moved to {folder}"
                log = models.AutomationLog(email_id=db_email.id, action=action)
                db.add(log)
                db.commit()
                
                synced_count += 1
                
        return {"message": f"Successfully synced {synced_count} new emails from Gmail."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
