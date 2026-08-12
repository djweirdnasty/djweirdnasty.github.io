import os
import brevo_python
from brevo_python.rest import ApiException

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "djweirdnasty@gmail.com")
FROM_NAME = os.getenv("FROM_NAME", "DJWEIRDNASTY")


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    if not BREVO_API_KEY:
        print(f"[email] No BREVO_API_KEY set — would send to {to_email}: {subject}")
        return False

    configuration = brevo_python.Configuration()
    configuration.api_key["api-key"] = BREVO_API_KEY

    api_instance = brevo_python.TransactionalEmailsApi(brevo_python.ApiClient(configuration))
    sender = brevo_python.Sender(name=FROM_NAME, email=FROM_EMAIL)
    to = [brevo_python.SendSmtpMailTo(email=to_email)]
    send_smtp_mail = brevo_python.SendSmtpMail(
        sender=sender,
        to=to,
        subject=subject,
        html_content=html_content,
    )

    try:
        api_instance.send_transac_email(send_smtp_mail)
        return True
    except ApiException as e:
        print(f"[email] Brevo error: {e}")
        return False


def send_batch_emails(recipients: list[dict], subject: str, base_url: str) -> dict:
    results = {"sent": 0, "failed": 0}
    for r in recipients:
        html = r["html"]
        ok = send_email(r["email"], subject, html)
        if ok:
            results["sent"] += 1
        else:
            results["failed"] += 1
    return results
