from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base
from . import models, ml_engine

SQLALCHEMY_DATABASE_URL = "sqlite:///./mailsense.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _ensure_schema_updates():
    """Add missing columns to existing DB tables if needed."""
    with engine.connect() as conn:
        try:
            # Check users table for email
            r = conn.execute(__import__("sqlalchemy").text("PRAGMA table_info(users)"))
            cols = [row[1] for row in r.fetchall()]
            if "email" not in cols:
                conn.execute(__import__("sqlalchemy").text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
            
            # Check emails table for message_id
            r = conn.execute(__import__("sqlalchemy").text("PRAGMA table_info(emails)"))
            cols = [row[1] for row in r.fetchall()]
            if "message_id" not in cols:
                conn.execute(__import__("sqlalchemy").text("ALTER TABLE emails ADD COLUMN message_id VARCHAR(255)"))
            
            conn.commit()
        except Exception:
            pass


def init_db():
    Base.metadata.create_all(bind=engine)
    _ensure_schema_updates()
    seed_default_user()
    seed_demo_emails()


def seed_default_user():
    """Create default user if none exist (username: admin, password: admin)."""
    import hashlib
    db = SessionLocal()
    try:
        if db.query(models.User).first():
            return
        pw_hash = hashlib.sha256("admin".encode()).hexdigest()
        db.add(models.User(username="admin", password_hash=pw_hash, email=None))
        db.commit()
    finally:
        db.close()

def seed_demo_emails():
    db = SessionLocal()
    try:
        existing_email = db.query(models.Email).first()
        if existing_email:
            return
        demo_emails = [
            {
                "sender": "alerts@yourbank.com",
                "subject": "Urgent: Verify your account now",
                "body": "We noticed unusual activity. Please verify your bank password immediately."
            },
            {
                "sender": "team@producthub.io",
                "subject": "Project update and meeting notes",
                "body": "Here are the meeting notes and next steps for the product launch."
            },
            {
                "sender": "billing@cloudtools.com",
                "subject": "Invoice for February usage",
                "body": "Your invoice is ready. Please review the attached statement."
            },
            {
                "sender": "newsletter@dailytech.com",
                "subject": "Weekly newsletter: AI trends",
                "body": "Catch up on this week's AI announcements and product releases."
            },
            {
                "sender": "security@paymentdesk.com",
                "subject": "Account suspended notice",
                "body": "Your account has been suspended. Confirm your identity to restore access."
            }
        ]
        for email_data in demo_emails:
            scam_result = ml_engine.detect_scam(email_data["subject"], email_data["body"])
            priority = ml_engine.classify_priority(email_data["subject"], email_data["body"])
            folder = ml_engine.determine_folder(scam_result["label"], priority)
            db_email = models.Email(
                sender=email_data["sender"],
                subject=email_data["subject"],
                body=email_data["body"],
                scam_label=scam_result["label"],
                scam_score=scam_result["score"],
                priority=priority,
                folder=folder
            )
            db.add(db_email)
        db.commit()
    finally:
        db.close()
