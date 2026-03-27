import imaplib
import email
import os
import re
from datetime import datetime, timedelta
from . import ml_engine, schemas
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)


def strip_html_and_clean(text: str) -> str:
    """Strip HTML, inline CSS, and clean angle-bracketed URLs for readable plain text."""
    if not text or not isinstance(text, str):
        return text or ""
    # Remove <style>...</style> and their content
    text = re.sub(r"<style[^>]*>[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    # Remove HTML comments
    text = re.sub(r"<!--[\s\S]*?-->", " ", text)
    # Replace angle-bracketed URLs with just the URL
    text = re.sub(r"<(\s*https?://[^>]+)\s*>", r" \1 ", text, flags=re.IGNORECASE)
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Remove inline CSS blocks: *{...}, .class{...}, tag{...} (greedy match up to next })
    n = 0
    while n < 20:  # limit iterations
        prev = text
        text = re.sub(r"[.#*a-zA-Z\[\]\s]+\{[^{}]*\}", " ", text)
        if text == prev:
            break
        n += 1
    # Decode common entities
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
    text = re.sub(r"&\w+;", " ", text)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text

def decode_header(header_value):
    headers = email.header.decode_header(header_value)
    decoded = ""
    for decoded_string, charset in headers:
        if isinstance(decoded_string, bytes):
            decoded += decoded_string.decode(charset or 'utf-8', errors='ignore')
        else:
            decoded += str(decoded_string)
    return decoded

def get_email_body(msg):
    plain = None
    html = None
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type() or ""
            if "text/plain" in ct:
                try:
                    plain = part.get_payload(decode=True).decode(errors="replace")
                    break
                except Exception:
                    pass
            elif "text/html" in ct and html is None:
                try:
                    html = part.get_payload(decode=True).decode(errors="replace")
                except Exception:
                    pass
    else:
        try:
            raw = msg.get_payload(decode=True).decode(errors="replace")
            if "text/html" in (msg.get_content_type() or ""):
                html = raw
            else:
                plain = raw
        except Exception:
            pass
    if plain:
        return plain
    if html:
        return strip_html_and_clean(html)
    return ""

def fetch_gmails(days=3, max_emails=500):
    """Fetch emails from the last `days` days only. Limits to `max_emails` to avoid overload."""
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)
    GMAIL_USER = os.getenv("GMAIL_USER")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise ValueError("Gmail credentials are not configured in .env")

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", timeout=30)
        mail.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        mail.select("inbox")

        # Search for emails since (today - days); IMAP format: DD-Mon-YYYY
        since_date = (datetime.utcnow() - timedelta(days=days)).strftime("%d-%b-%Y")
        status, messages = mail.search(None, "SINCE", since_date)
        if status != "OK":
            return []

        email_ids = messages[0].split()
        # Limit to most recent 50 to avoid timeout
        recent_ids = email_ids[-50:] if len(email_ids) > 50 else email_ids
        fetched_emails = []

        print(f"Found {len(email_ids)} emails since {since_date}. Syncing last {len(recent_ids)}...")

        for e_id in reversed(recent_ids):
            res, msg_data = mail.fetch(e_id, "(RFC822)")
            if res != "OK":
                continue
                
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    
                    subject = decode_header(msg["Subject"] or "")
                    sender = decode_header(msg.get("From", ""))
                    message_id = msg.get("Message-ID", "")
                    
                    # Parse Date
                    date_str = msg.get("Date")
                    timestamp = None
                    if date_str:
                        try:
                            tup = email.utils.parsedate_tz(date_str)
                            if tup:
                                timestamp = datetime.fromtimestamp(email.utils.mktime_tz(tup))
                        except Exception:
                            pass
                    
                    raw_body = get_email_body(msg)
                    body = strip_html_and_clean(raw_body) if raw_body else ""
                    fetched_emails.append(schemas.EmailCreate(
                        sender=sender,
                        subject=subject,
                        body=body or "(No Body Content)",
                        timestamp=timestamp,
                        message_id=message_id
                    ))
                    
        mail.logout()
        return fetched_emails

    except Exception as e:
        print(f"Error fetching Gmail: {e}")
        raise e
