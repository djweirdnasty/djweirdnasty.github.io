import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
FROM_EMAIL = os.getenv("FROM_EMAIL", "djweirdnasty@gmail.com")
FROM_NAME = os.getenv("FROM_NAME", "DJWEIRDNASTY")


def _send_smtp(to_email: str, subject: str, html_content: str) -> bool:
    if not SMTP_HOST:
        print(f"[email] No SMTP_HOST set — would send to {to_email}: {subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_content, "html"))

    try:
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[email] SMTP error sending to {to_email}: {e}")
        return False


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    return _send_smtp(to_email, subject, html_content)


def send_email_async(to_email: str, subject: str, html_content: str):
    Thread(target=_send_smtp, args=(to_email, subject, html_content), daemon=True).start()


def send_batch_emails(recipients: list[dict], subject: str, base_url: str) -> dict:
    results = {"sent": 0, "failed": 0}
    for r in recipients:
        ok = _send_smtp(r["email"], subject, r["html"])
        if ok:
            results["sent"] += 1
        else:
            results["failed"] += 1
    return results
