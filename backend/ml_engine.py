import os
import re

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
_priority_model = None
_scam_model = None


def _load_models():
    global _priority_model, _scam_model
    if _priority_model is None:
        try:
            import pickle
            p_path = os.path.join(_MODEL_DIR, "priority_model.pkl")
            if os.path.isfile(p_path):
                with open(p_path, "rb") as f:
                    _priority_model = pickle.load(f)
        except Exception:
            pass
    if _scam_model is None:
        try:
            import pickle
            s_path = os.path.join(_MODEL_DIR, "scam_model.pkl")
            if os.path.isfile(s_path):
                with open(s_path, "rb") as f:
                    _scam_model = pickle.load(f)
        except Exception:
            pass


def preprocess_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"\W+", " ", text)
    return text.strip()

def detect_scam(email_subject: str, email_body: str) -> dict:
    """Detect scam/phishing using subject + body. Uses trained NLP model if available."""
    subject = preprocess_text(email_subject or "")
    body = preprocess_text(email_body or "")
    combined = subject + " " + body
    _load_models()
    if _scam_model is not None and combined.strip():
        try:
            proba = _scam_model.predict_proba([combined])[0]
            scam_idx = list(_scam_model.classes_).index(1) if 1 in _scam_model.classes_ else 0
            score = float(proba[scam_idx])
            label = "Scam" if score > 0.32 else "Legitimate"
            return {"label": label, "score": min(score, 0.99)}
        except Exception:
            pass
    # Strong scam/phishing signals (add 0.18 each)
    strong_keywords = [
        'urgent', 'password', 'bank', 'lottery', 'wire transfer', 'account suspended',
        'verify your account', 'click here', 'claim your prize', 'congratulations you won',
        'bitcoin', 'crypto', 'invest now', 'limited time offer', 'act now', 'free money',
        'suspended', 'verify identity', 'confirm your account', 'unusual activity',
        'phishing', 'urgent action required', 'your account has been', 'reactivate',
        'verify now', 'password reset', 'account locked', 'claim prize', 'you have won'
    ]
    # Softer signals so Legitimate % is not always 100% (reminder, promo, etc.)
    soft_keywords = [
        'earn', 'bonus', 'ytm', 'returns', 'guaranteed returns', 'limited offer',
        'book now', 'offer ends', 'discount', 'free trial', 'act fast',
        'exclusive offer', 'don\'t miss', 'hurry', 'limited time',
        'click below', 'unsubscribe', 'opt in', 'claim your', 'winning', 'reward',
        'reminder', 'newsletter', 'promo', 'promotion', 'offer', 'deal', 'sale',
        'view in browser', 'update your preferences', 'marketing'
    ]
    score = 0.0
    for kw in strong_keywords:
        if kw in combined:
            score += 0.18
    for kw in soft_keywords:
        if kw in combined:
            score += 0.07
    score = min(score, 0.99)
    label = "Scam" if score > 0.32 else "Legitimate"
    return {"label": label, "score": score}

def classify_priority(email_subject: str, email_body: str) -> str:
    """Classify urgency. Uses trained NLP model if available."""
    subject_lower = preprocess_text(email_subject or "")
    _load_models()
    if _priority_model is not None:
        combined = subject_lower + " " + preprocess_text(email_body or "")
        if combined.strip():
            try:
                pred = _priority_model.predict([combined])[0]
                if isinstance(pred, str):
                    return pred.title()
                return str(pred)
            except Exception:
                pass
    body_lower = preprocess_text(email_body or "")
    combined_text = subject_lower + " " + body_lower

    # High: only truly urgent phrases, mainly in subject (avoids promo/reminder as High)
    high_keywords_subject = [
        'urgent', 'asap', 'immediate', 'deadline', 'action required',
        'critical', 'emergency', 'expires today', 'last chance',
        'confirm now', 'verify now', 'final notice', 'respond immediately',
        'time sensitive', 'attention required', 'expiring'
    ]
    for kw in high_keywords_subject:
        if kw in subject_lower:
            return "High"
    for kw in high_keywords_subject:
        if kw in combined_text:
            return "High"

    # Medium: work-related and reminders
    medium_keywords = [
        'invoice', 'meeting', 'project', 'update', 'review', 'reminder',
        'schedule', 'agenda', 'follow up', 'feedback', 'report', 'delivery',
        'subscription', 'order', 'receipt', 'confirmation', 'document',
        'proposal', 'draft', 'approval', 'request', 'deadline approaching'
    ]
    for kw in medium_keywords:
        if kw in subject_lower:
            return "Medium"
    for kw in medium_keywords:
        if kw in combined_text:
            return "Medium"

    return "Low"

def determine_folder(scam_label: str, priority: str) -> str:
    if scam_label == "Scam":
        return "Spam"
    if priority in ["High", "Medium"]:
        return "Inbox"
    return "Archive"
