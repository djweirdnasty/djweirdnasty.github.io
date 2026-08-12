import os
from resend import Emails as ResendEmails

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
FROM_NAME = os.getenv("FROM_NAME", "DJWEIRDNASTY")


def _send_via_resend(to_email: str, subject: str, html_content: str) -> bool:
    if not RESEND_API_KEY:
        print(f"[email] No RESEND_API_KEY set — would send to {to_email}: {subject}")
        return False

    try:
        ResendEmails.send({
            "from": f"{FROM_NAME} <{FROM_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        })
        return True
    except Exception as e:
        print(f"[email] Resend error sending to {to_email}: {e}")
        return False


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    return _send_via_resend(to_email, subject, html_content)


def send_email_async(to_email: str, subject: str, html_content: str):
    import threading
    threading.Thread(target=_send_via_resend, args=(to_email, subject, html_content), daemon=True).start()


def send_batch_emails(recipients: list[dict], subject: str, base_url: str) -> dict:
    results = {"sent": 0, "failed": 0}
    for r in recipients:
        ok = _send_via_resend(r["email"], subject, r["html"])
        if ok:
            results["sent"] += 1
        else:
            results["failed"] += 1
    return results
