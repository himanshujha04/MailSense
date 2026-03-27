from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)


class Email(Base):
    __tablename__ = 'emails'

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String, index=True)
    subject = Column(String)
    body = Column(String)
    scam_label = Column(String)
    scam_score = Column(Float)
    priority = Column(String)
    folder = Column(String)
    message_id = Column(String, index=True, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AutomationLog(Base):
    __tablename__ = 'automation_logs'

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, index=True)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
