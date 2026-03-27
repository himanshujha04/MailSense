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

@router.get("/auth/user/{username}", response_model=schemas.UserProfile)
def get_user(username: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserProfile(username=user.username, email=user.email)

@router.patch("/auth/user/{username}", response_model=schemas.UserProfile)
def update_user(username: str, data: schemas.UpdateUserRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.new_password:
        if not data.old_password:
            raise HTTPException(status_code=400, detail="Old password is required to change password")
        old_hash = hashlib.sha256((data.old_password or "").encode()).hexdigest()
        if user.password_hash != old_hash:
            raise HTTPException(status_code=401, detail="Invalid old password")
        user.password_hash = hashlib.sha256(data.new_password.encode()).hexdigest()
    if data.email is not None:
        if data.email and db.query(models.User).filter(models.User.email == data.email, models.User.username != username).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email or None
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserProfile(username=user.username, email=user.email)

@router.delete("/auth/user/{username}")
def delete_user(username: str, data: schemas.DeleteUserRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    pw_hash = hashlib.sha256(data.password.encode()).hexdigest()
    if user.password_hash != pw_hash:
        raise HTTPException(status_code=401, detail="Invalid password")
    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}

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
        print("Starting Gmail sync...")
        new_emails = gmail_service.fetch_gmails(days=3)
        print(f"Fetched {len(new_emails)} messages from IMAP.")
        synced_count = 0
        skipped_count = 0
        
        for email_data in new_emails:
            # Check for duplicates using Message-ID if available, else subject+sender
            if email_data.message_id:
                exists = db.query(models.Email).filter(
                    models.Email.message_id == email_data.message_id
                ).first()
            else:
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
                    folder=folder,
                    message_id=email_data.message_id,
                    timestamp=email_data.timestamp or datetime.utcnow()
                )
                db.add(db_email)
                db.commit()
                db.refresh(db_email)
                
                # Save Automation Log
                action = f"Synced from Gmail. Moved to {folder}"
                log = models.AutomationLog(email_id=db_email.id, action=action)
                db.add(log)
                db.commit()
                
                synced_count += 1
            else:
                skipped_count += 1
        
        print(f"Sync complete. New: {synced_count}, Skipped: {skipped_count}")
        return {"message": f"Successfully synced {synced_count} new emails from Gmail. ({skipped_count} duplicates skipped)"}
    except Exception as e:
        msg = str(e)
        # Make Gmail IMAP auth failures actionable
        if "AUTHENTICATIONFAILED" in msg or "Invalid credentials" in msg:
            raise HTTPException(
                status_code=401,
                detail="Gmail IMAP authentication failed. Use a Google App Password (16-char) instead of your normal password, and ensure IMAP is enabled.",
            )
        if "Application-specific password required" in msg:
            raise HTTPException(
                status_code=401,
                detail="Google requires an App Password for IMAP. Create a Gmail App Password and set it as GMAIL_APP_PASSWORD in backend/.env, then restart the backend.",
            )
        raise HTTPException(status_code=500, detail=msg)
