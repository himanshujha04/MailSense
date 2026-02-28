"""
Train TF-IDF + LogisticRegression models for email priority (High/Medium/Low) and scam (0/1).
Run from backend dir: python train_models.py
Requires: pip install scikit-learn
"""
import os
import re
import pickle

# Synthetic training data: (subject + " " + body_snippet, label)
PRIORITY_DATA = [
    # High
    ("Urgent: Your account will be suspended", "high"),
    ("ASAP: Action required on your payment", "high"),
    ("Immediate: Verify your identity", "high"),
    ("Deadline tomorrow: Submit your report", "high"),
    ("Critical: Security alert on your account", "high"),
    ("Emergency: Server downtime notice", "high"),
    ("Last chance: Confirm your booking now", "high"),
    ("Final notice: Payment overdue", "high"),
    ("Respond immediately: Legal notice", "high"),
    ("Time sensitive: Expires today", "high"),
    ("Attention required: Account locked", "high"),
    ("Confirm now: Your order is pending", "high"),
    ("Verify now: Unusual login detected", "high"),
    ("Action required: Update your password", "high"),
    ("Expiring in 24 hours: Renew now", "high"),
    # Medium
    ("Reminder: Meeting at 3pm tomorrow", "medium"),
    ("Invoice for February", "medium"),
    ("Project update and next steps", "medium"),
    ("Review requested: Document draft", "medium"),
    ("Schedule: Team sync this week", "medium"),
    ("Follow up: Your feedback", "medium"),
    ("Order confirmation", "medium"),
    ("Delivery update for your order", "medium"),
    ("Subscription renewal reminder", "medium"),
    ("Deadline approaching: Internship application", "medium"),
    ("Reminder: Labmentix orientation", "medium"),
    ("Your booking confirmation", "medium"),
    # Low
    ("Weekly newsletter", "low"),
    ("What's new this week", "low"),
    ("Tips and updates", "low"),
    ("Step into Nature's Paradise", "low"),
    ("BENVENUTI ALL'INFERNO", "low"),
    ("A reminder to enjoy your day", "low"),
    ("Marketing: Special offers", "low"),
    ("Newsletter: Monthly digest", "low"),
    ("Promotional content", "low"),
    ("Unsubscribe from this list", "low"),
]

SCAM_DATA = [
    # Scam (1)
    ("Urgent verify your bank password wire transfer", 1),
    ("Claim your prize congratulations you won", 1),
    ("Verify your account suspended unusual activity", 1),
    ("Click here to confirm your identity", 1),
    ("Password reset required immediately", 1),
    ("Your account has been locked reactivate", 1),
    ("Bitcoin investment opportunity act now", 1),
    ("Free money limited time offer", 1),
    ("Claim prize verify now", 1),
    ("Congratulations you have won lottery", 1),
    ("Verify your account bank password", 1),
    ("Account suspended confirm identity", 1),
    ("Phishing urgent action required", 1),
    # Legitimate (0)
    ("Meeting notes for tomorrow", 0),
    ("Invoice for February usage", 0),
    ("Newsletter weekly digest", 0),
    ("Your booking confirmation", 0),
    ("Reminder meeting at 3pm", 0),
    ("Project update and feedback", 0),
    ("Order delivery update", 0),
    ("Unsubscribe from marketing", 0),
    ("Promotional offer newsletter", 0),
    ("Reminder to complete your profile", 0),
]


def preprocess(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"\W+", " ", text)
    return text.strip()


def train_priority():
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
    except ImportError:
        print("Install scikit-learn: pip install scikit-learn")
        return
    X = [preprocess(s) for s, _ in PRIORITY_DATA]
    y = [label.upper() for _, label in PRIORITY_DATA]
    y = ["HIGH" if a == "HIGH" else "MEDIUM" if a == "MEDIUM" else "LOW" for a in y]
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=500, ngram_range=(1, 2))),
        ("clf", LogisticRegression(max_iter=500, random_state=42)),
    ])
    pipe.fit(X, y)
    path = os.path.join(os.path.dirname(__file__), "saved_models", "priority_model.pkl")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(pipe, f)
    print(f"Saved priority model to {path}")


def train_scam():
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
    except ImportError:
        return
    X = [preprocess(s) for s, _ in SCAM_DATA]
    y = [lab for _, lab in SCAM_DATA]
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=300, ngram_range=(1, 2))),
        ("clf", LogisticRegression(max_iter=500, random_state=42)),
    ])
    pipe.fit(X, y)
    path = os.path.join(os.path.dirname(__file__), "saved_models", "scam_model.pkl")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(pipe, f)
    print(f"Saved scam model to {path}")


if __name__ == "__main__":
    train_priority()
    train_scam()
    print("Done. Restart the backend to use the new models.")
