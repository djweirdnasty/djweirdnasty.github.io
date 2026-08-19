import os
import secrets
from datetime import datetime
import json
import urllib.request
from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db, SessionLocal, Subscriber, Campaign, CampaignRecipient, DigestState
from auth import create_access_token, decode_access_token, generate_token
from email_service import send_email, send_email_async
from jinja2 import Environment, FileSystemLoader, Template
from apscheduler.schedulers.background import BackgroundScheduler
import uvicorn

app = FastAPI(title="DJWEIRDNASTY Newsletter API")

website_url = os.getenv("WEBSITE_URL", "https://djweirdnasty.com")
admin_user = os.getenv("ADMIN_USERNAME", "admin")
admin_pass = os.getenv("ADMIN_PASSWORD", "change-this-password")
admin_email = os.getenv("ADMIN_EMAIL", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        website_url,
        "https://djweirdnasty.github.io",
        "https://djweirdnasty.com",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jinja_env = Environment(loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "templates")))

# ─── Scheduler ───

scheduler = BackgroundScheduler()
scheduler.start()


def _check_scheduled_campaigns():
    db = SessionLocal()
    try:
        due = db.query(Campaign).filter(
            Campaign.status == "scheduled",
            Campaign.scheduled_at != None,
            Campaign.scheduled_at <= datetime.utcnow(),
        ).all()
        for c in due:
            _send_campaign_emails(c.id, db)
    finally:
        db.close()

scheduler.add_job(_check_scheduled_campaigns, "interval", minutes=5)


EXCLUDED_CONTENT_PAGES = {
    "/news.html",
    "/news-national.html",
    "/news-music.html",
    "/news-entertainment.html",
    "/news-sports.html",
}


def _is_content_item(path: str) -> bool:
    if path in EXCLUDED_CONTENT_PAGES:
        return False
    if path.startswith("/news-") and path.endswith(".html"):
        return True
    if path.startswith("/murrdah-") and path.endswith(".html"):
        return True
    if path.startswith("/mud-music-") and path.endswith(".html"):
        return True
    return False


def _check_new_content():
    try:
        req = urllib.request.Request(
            f"{website_url}/contents.json",
            headers={"User-Agent": "DJWEIRDNASTY Newsletter"},
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.load(response)
    except Exception as e:
        print(f"[auto-digest] failed to fetch contents: {e}")
        return

    if not isinstance(data, list):
        return

    db = SessionLocal()
    try:
        state = db.query(DigestState).first()
        if not state:
            state = DigestState(last_published_at=datetime.utcnow())
            db.add(state)
            db.commit()
            return

        new_items = []
        for item in data:
            path = item.get("path", "")
            published_ts = item.get("published")
            if not published_ts or not _is_content_item(path):
                continue
            try:
                item_dt = datetime.utcfromtimestamp(int(published_ts))
            except (TypeError, ValueError):
                continue
            if item_dt > state.last_published_at:
                new_items.append(item)

        if not new_items:
            return

        new_items.sort(key=lambda x: x.get("published", 0))

        cards = []
        for item in new_items:
            title = item.get("title", "")
            img = item.get("img", "")
            path = item.get("path", "")
            url = f"{website_url}{path}"
            img_url = img if img and img.startswith("http") else f"{website_url}{img}" if img else ""
            img_html = f'<a href="{url}"><img src="{img_url}" alt="{title}" style="max-width:100%;border-radius:12px;margin:0.5rem 0;"></a>' if img_url else ""
            cards.append(
                f'<div style="margin-bottom:1.5rem;text-align:center;">'
                f'<a href="{url}" style="text-decoration:none;color:#ff4fd8;"><h3 style="margin:0.5rem 0;">{title}</h3></a>'
                f'{img_html}'
                f'</div>'
            )

        body = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#eee;padding:2rem;border-radius:12px;">
<h1 style="color:#ff4fd8;text-align:center;">What&rsquo;s New</h1>
<p>Hey {{name}},</p>
<p>We just added new content to the site:</p>
{''.join(cards)}
<p style="text-align:center;margin:2rem 0;">
  <a href="{website_url}/news.html" style="display:inline-block;padding:14px 28px;background:linear-gradient(180deg,#4fa8ff,#1a5fd0);color:#ff4fd8;border-radius:999px;text-decoration:none;font-weight:bold;">Read More</a>
</p>
<p style="color:#888;font-size:12px;">DJWEIRDNASTY</p>
</div>"""

        subs = db.query(Subscriber).filter(Subscriber.confirmed == True, Subscriber.unsubscribed == False).all()
        max_published = max(int(item.get("published", 0)) for item in new_items)

        if not subs:
            state.last_published_at = datetime.utcfromtimestamp(max_published)
            db.commit()
            return

        camp = Campaign(subject="New DJWEIRDNASTY Content", body=body, status="sending")
        db.add(camp)
        db.commit()

        for sub in subs:
            open_token = generate_token()
            click_token = generate_token()
            cr = CampaignRecipient(
                campaign_id=camp.id,
                subscriber_id=sub.id,
                open_token=open_token,
                click_token=click_token,
            )
            db.add(cr)
        db.commit()

        _send_campaign_emails(camp.id, db)

        state.last_published_at = datetime.utcfromtimestamp(max_published)
        db.commit()
    finally:
        db.close()


scheduler.add_job(_check_new_content, "interval", minutes=60)


@app.on_event("startup")
def log_email_config():
    import email_service
    print(f"[startup] RESEND_API_KEY set: {bool(email_service.RESEND_API_KEY)}")
    print(f"[startup] FROM_EMAIL={email_service.FROM_EMAIL}")
    print(f"[startup] FROM_NAME={email_service.FROM_NAME}")


# ─── Pydantic models ───

class SubscribeRequest(BaseModel):
    email: EmailStr
    name: str = ""


class LoginRequest(BaseModel):
    username: str
    password: str


class CampaignCreate(BaseModel):
    subject: str
    body: str
    scheduled_at: datetime | None = None


class CampaignSend(BaseModel):
    campaign_id: int


# ─── Auth dependency ───

def require_admin(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload or payload.get("sub") != admin_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return payload


# ─── Public endpoints ───

@app.post("/api/subscribe")
def subscribe(req: SubscribeRequest, db: Session = Depends(get_db)):
    existing = db.query(Subscriber).filter(Subscriber.email == req.email).first()
    if existing:
        if existing.unsubscribed:
            existing.unsubscribed = False
            existing.confirmed = False
            existing.confirm_token = generate_token()
            db.commit()
        return {"ok": True, "message": "You're already subscribed!"}

    token = generate_token()
    sub = Subscriber(email=req.email, name=req.name, confirm_token=token)
    db.add(sub)
    db.commit()

    confirm_link = f"{request_base_url()}/api/confirm/{token}"
    html = f"""
    <h2>Welcome to DJWEIRDNASTY!</h2>
    <p>Hi {req.name or 'there'},</p>
    <p>Confirm your newsletter subscription by clicking the button below:</p>
    <p><a href="{confirm_link}" style="display:inline-block;padding:12px 28px;background:#4fa8ff;color:#ff4fd8;border-radius:999px;text-decoration:none;font-weight:bold;">Confirm Subscription</a></p>
    <p>If you didn't sign up, you can ignore this email.</p>
    """
    send_email(req.email, "Confirm your DJWEIRDNASTY newsletter subscription", html)

    if admin_email:
        admin_html = f"<p>New DJWEIRDNASTY newsletter signup:</p><p><strong>Name:</strong> {req.name or 'Not provided'}<br><strong>Email:</strong> {req.email}</p>"
        send_email_async(admin_email, "New DJWEIRDNASTY newsletter signup", admin_html)

    return {"ok": True, "message": "Check your email to confirm your subscription!"}


@app.get("/api/confirm/{token}")
def confirm_subscription(token: str, db: Session = Depends(get_db)):
    sub = db.query(Subscriber).filter(Subscriber.confirm_token == token).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Invalid confirmation link")
    sub.confirmed = True
    sub.confirm_token = ""
    db.commit()
    return RedirectResponse(f"{website_url}/newsletter-confirmed.html", status_code=302)


@app.get("/api/unsubscribe/{token}")
def unsubscribe(token: str, db: Session = Depends(get_db)):
    sub = db.query(Subscriber).filter(Subscriber.confirm_token == token).first()
    if not sub:
        for cr in db.query(CampaignRecipient).filter(CampaignRecipient.open_token == token).all():
            sub = db.query(Subscriber).filter(Subscriber.id == cr.subscriber_id).first()
            break
    if not sub:
        raise HTTPException(status_code=404, detail="Invalid unsubscribe link")
    sub.unsubscribed = True
    db.commit()
    return HTMLResponse(
        "<h2>Unsubscribed</h2><p>You've been removed from the DJWEIRDNASTY newsletter.</p>"
        f'<p><a href="{website_url}">Back to site</a></p>'
    )


# ─── Admin auth ───

@app.post("/api/admin/login")
def admin_login(req: LoginRequest):
    if req.username == admin_user and req.password == admin_pass:
        token = create_access_token({"sub": admin_user})
        return {"token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")


# ─── Admin: subscribers ───

@app.get("/api/admin/subscribers")
def list_subscribers(db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    subs = db.query(Subscriber).filter(Subscriber.unsubscribed == False).all()
    return {
        "count": len(subs),
        "subscribers": [
            {"id": s.id, "email": s.email, "name": s.name, "confirmed": s.confirmed, "joined": s.created_at.isoformat()}
            for s in subs
        ],
    }


@app.delete("/api/admin/subscribers/{sub_id}")
def delete_subscriber(sub_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    sub = db.query(Subscriber).filter(Subscriber.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    db.delete(sub)
    db.commit()
    return {"ok": True}


# ─── Admin: campaigns ───

@app.post("/api/admin/campaigns")
def create_campaign(req: CampaignCreate, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    camp = Campaign(subject=req.subject, body=req.body, status="scheduled" if req.scheduled_at else "draft", scheduled_at=req.scheduled_at)
    db.add(camp)
    db.commit()
    return {"ok": True, "campaign_id": camp.id}


@app.get("/api/admin/campaigns")
def list_campaigns(db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    camps = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    return {
        "campaigns": [
            {
                "id": c.id,
                "subject": c.subject,
                "status": c.status,
                "created": c.created_at.isoformat(),
                "sent_at": c.sent_at.isoformat() if c.sent_at else None,
                "opens": c.opens,
                "clicks": c.clicks,
                "recipients": len(c.recipients),
            }
            for c in camps
        ]
    }


@app.get("/api/admin/campaigns/{camp_id}")
def get_campaign(camp_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    c = db.query(Campaign).filter(Campaign.id == camp_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {
        "id": c.id,
        "subject": c.subject,
        "body": c.body,
        "status": c.status,
        "opens": c.opens,
        "clicks": c.clicks,
        "recipients": [
            {"email": db.query(Subscriber).filter(Subscriber.id == r.subscriber_id).first().email, "opened": r.opened, "clicked": r.clicked}
            for r in c.recipients
        ],
    }


@app.post("/api/admin/campaigns/{camp_id}/send")
def send_campaign(camp_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    c = db.query(Campaign).filter(Campaign.id == camp_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status == "sent":
        raise HTTPException(status_code=400, detail="Campaign already sent")

    subs = db.query(Subscriber).filter(Subscriber.confirmed == True, Subscriber.unsubscribed == False).all()
    if not subs:
        raise HTTPException(status_code=400, detail="No confirmed subscribers to send to")

    base = request_base_url()
    for sub in subs:
        open_token = generate_token()
        click_token = generate_token()
        cr = CampaignRecipient(
            campaign_id=c.id,
            subscriber_id=sub.id,
            open_token=open_token,
            click_token=click_token,
        )
        db.add(cr)

    c.status = "sending"
    db.commit()

    background_tasks.add_task(_send_campaign_emails, camp_id)
    return {"ok": True, "message": f"Sending campaign to {len(subs)} subscribers..."}


def _send_campaign_emails(camp_id: int, db=None):
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        c = db.query(Campaign).filter(Campaign.id == camp_id).first()
        if not c:
            return
        base = request_base_url()
        for cr in c.recipients:
            sub = db.query(Subscriber).filter(Subscriber.id == cr.subscriber_id).first()
            if not sub:
                continue
            unsub_link = f"{base}/api/unsubscribe/{cr.open_token}"
            open_pixel = f'<img src="{base}/api/track/open/{cr.open_token}" width="1" height="1" alt="">'
            html = c.body.replace("{{name}}", sub.name or "there")
            html = html.replace("{{unsubscribe_url}}", unsub_link)
            html += open_pixel
            html += f'<p style="margin-top:20px;font-size:12px;color:#888;"><a href="{unsub_link}">Unsubscribe</a></p>'
            ok = send_email(sub.email, c.subject, html)
            if ok:
                cr.sent = True
        c.status = "sent"
        c.sent_at = datetime.utcnow()
        db.commit()
    finally:
        if own_session:
            db.close()


@app.delete("/api/admin/campaigns/{camp_id}")
def delete_campaign(camp_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    c = db.query(Campaign).filter(Campaign.id == camp_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(c)
    db.commit()
    return {"ok": True}


# ─── Tracking endpoints ───

@app.get("/api/track/open/{token}")
def track_open(token: str):
    db = SessionLocal()
    try:
        cr = db.query(CampaignRecipient).filter(CampaignRecipient.open_token == token).first()
        if cr and not cr.opened:
            cr.opened = True
            camp = db.query(Campaign).filter(Campaign.id == cr.campaign_id).first()
            if camp:
                camp.opens += 1
            db.commit()
    finally:
        db.close()
    return RedirectResponse(url="https://djweirdnasty.com/favicon.png", status_code=302)


@app.get("/api/track/click/{token}")
def track_click(token: str):
    db = SessionLocal()
    try:
        cr = db.query(CampaignRecipient).filter(CampaignRecipient.click_token == token).first()
        if cr and not cr.clicked:
            cr.clicked = True
            camp = db.query(Campaign).filter(Campaign.id == cr.campaign_id).first()
            if camp:
                camp.clicks += 1
            db.commit()
    finally:
        db.close()
    return RedirectResponse(url=website_url, status_code=302)


# ─── Email templates ───

EMAIL_TEMPLATES = {
    "new_mixtape": {
        "name": "New Mixtape Drop",
        "subject": "🔥 New Mixtape from DJWEIRDNASTY!",
        "body": """<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#eee;padding:2rem;border-radius:12px;">
<h1 style="color:#ff4fd8;text-align:center;">New Mixtape Drop!</h1>
<p>Hey {{name}},</p>
<p>A new mixtape just dropped. Come check it out on the site.</p>
<p style="text-align:center;margin:2rem 0;">
  <a href="https://djweirdnasty.com/mixtapes.html" style="display:inline-block;padding:14px 28px;background:linear-gradient(180deg,#4fa8ff,#1a5fd0);color:#ff4fd8;border-radius:999px;text-decoration:none;font-weight:bold;">Listen Now</a>
</p>
<p style="color:#888;font-size:12px;">DJWEIRDNASTY</p>
</div>""",
    },
    "new_event": {
        "name": "New Event Announcement",
        "subject": "🎤 New Event — Don't Miss Out!",
        "body": """<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#eee;padding:2rem;border-radius:12px;">
<h1 style="color:#ff4fd8;text-align:center;">New Event!</h1>
<p>Hey {{name}},</p>
<p>Got a new event coming up. Check the details on the website.</p>
<p style="text-align:center;margin:2rem 0;">
  <a href="https://djweirdnasty.com/#events" style="display:inline-block;padding:14px 28px;background:linear-gradient(180deg,#4fa8ff,#1a5fd0);color:#ff4fd8;border-radius:999px;text-decoration:none;font-weight:bold;">View Event</a>
</p>
<p style="color:#888;font-size:12px;">DJWEIRDNASTY</p>
</div>""",
    },
    "general": {
        "name": "General Update",
        "subject": "DJWEIRDNASTY Update",
        "body": """<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#eee;padding:2rem;border-radius:12px;">
<h1 style="color:#ff4fd8;text-align:center;">What's Good {{name}}</h1>
<p>Here's what's been going on with DJWEIRDNASTY:</p>
<p style="margin:1.5rem 0;">Write your update here...</p>
<p style="text-align:center;margin:2rem 0;">
  <a href="https://djweirdnasty.com" style="display:inline-block;padding:14px 28px;background:linear-gradient(180deg,#4fa8ff,#1a5fd0);color:#ff4fd8;border-radius:999px;text-decoration:none;font-weight:bold;">Visit Site</a>
</p>
<p style="color:#888;font-size:12px;">DJWEIRDNASTY</p>
</div>""",
    },
}


@app.get("/api/admin/templates")
def list_templates(_: dict = Depends(require_admin)):
    return {
        "templates": [
            {"key": k, "name": v["name"], "subject": v["subject"], "body": v["body"]}
            for k, v in EMAIL_TEMPLATES.items()
        ]
    }


# ─── Admin dashboard ───

@app.get("/admin", response_class=HTMLResponse)
def admin_dashboard():
    template = jinja_env.get_template("admin.html")
    return template.render(website_url=website_url)


# ─── Helpers ───

def request_base_url():
    if os.getenv("RENDER_EXTERNAL_URL"):
        return os.getenv("RENDER_EXTERNAL_URL").rstrip("/")
    return f"http://{os.getenv('HOST', '0.0.0.0')}:{os.getenv('PORT', '8000')}"


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
