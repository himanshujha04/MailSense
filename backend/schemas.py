from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: Optional[str] = None
    password: str


class LoginResponse(BaseModel):
    success: bool
    user: Optional[dict] = None
    message: Optional[str] = None


class EmailCreate(BaseModel):
    sender: str
    subject: str
    body: str

class EmailResponse(BaseModel):
    id: int
    sender: str
    subject: str
    body: str
    scam_label: str
    scam_score: float
    priority: str
    folder: str
    timestamp: datetime

    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    total_emails: int
    scam_count: int
    legitimate_count: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int


class AutomationLogResponse(BaseModel):
    id: int
    email_id: int
    action: str
    timestamp: datetime

    class Config:
        from_attributes = True
