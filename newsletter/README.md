# DJWEIRDNASTY Newsletter System

A self-hosted newsletter platform built with FastAPI + SQLite + pure SMTP.

**No third-party email API.** Uses Python's built-in `smtplib` to connect directly to your SMTP server.

## Features
- Subscriber signup with email confirmation (double opt-in)
- Unsubscribe links in every email
- Admin dashboard at `/admin`
- Campaign editor with pre-built email templates
- Scheduled campaign sending
- Open/click tracking
- Subscriber management

## Phase 1 — $0 Development

### 1. Install dependencies
```bash
cd newsletter
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

To receive an email alert for every new newsletter signup, set `ADMIN_EMAIL` in your `.env` file.

### 3. Configure SMTP

**Honest note:** Running a mail server from home is not practical. You need a static IP, reverse DNS (PTR), SPF/DKIM/DMARC records, port 25 access (many ISPs block it), and good IP reputation. Without these, your emails will go to spam.

**Recommended options:**

| Option | Limit | Cost | Difficulty |
|---------|-------|------|------------|
| Gmail SMTP | 500/day | $0 | Easy — good for testing |
| Amazon SES | Unlimited* | $0.10/1K emails | Medium — best value |
| Self-hosted (Mail-in-a-Box) | Unlimited | $4/mo VPS | Hard — full control |

*SES has soft limits you can raise by request.

**Gmail** (free, 500/day — start here):
- Enable 2FA → generate an App Password at myaccount.google.com/apppasswords
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=djweirdnasty@gmail.com`
- `SMTP_PASSWORD=your-app-password`
- `SMTP_USE_TLS=true`

**Amazon SES** ($0.10 per 1,000 emails — scale here):
1. Sign up at [aws.amazon.com/ses](https://aws.amazon.com/ses/)
2. Verify your sending domain (add SPF/DKIM/DMARC records)
3. Create SMTP credentials in SES console
4. Request production access (out of sandbox)
5. Set in `.env`:
   - `SMTP_HOST=email-smtp.us-east-1.amazonaws.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-ses-username`
   - `SMTP_PASSWORD=your-ses-password`
   - `SMTP_USE_TLS=true`

**Self-hosted mail server** (full control, more work):
- Requires a VPS ($4/mo DigitalOcean), domain with DNS control
- Install Mail-in-a-Box: `curl -s https://mailinabox.email/setup.sh | bash -s`
- Must configure: reverse DNS/PTR, SPF, DKIM, DMARC, TLS
- `SMTP_HOST=mail.yourdomain.com`
- `SMTP_PORT=587`
- `SMTP_USE_TLS=true`

### 4. Run locally
```bash
python main.py
```
- API runs at `http://localhost:8000`
- Admin dashboard at `http://localhost:8000/admin`

## Phase 2 — $0 Deployment

### Deploy to Render (free tier)
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `newsletter`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
5. Add environment variables from your `.env` file
6. Deploy

**Note:** Render free tier spins down after 15 min of inactivity. First request after sleep takes ~30s to wake. For production, consider the $7/mo paid tier.

### Alternative: Fly.io (free tier)
```bash
npm install -g flyctl
fly launch  # from newsletter/ directory
fly deploy
```

### Wire up your website
Update `NEWSLETTER_API_URL` in `index.html` to your deployed API URL:
```js
const NEWSLETTER_API_URL = 'https://your-api.onrender.com';
```

## Admin Dashboard
Visit `https://your-api.onrender.com/admin` and login with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/subscribe` | Subscribe (sends confirmation email) |
| GET | `/api/confirm/{token}` | Confirm subscription |
| GET | `/api/unsubscribe/{token}` | Unsubscribe |
| GET | `/api/track/open/{token}` | Open tracking pixel |
| GET | `/api/track/click/{token}` | Click tracking |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/subscribers` | List subscribers |
| DELETE | `/api/admin/subscribers/{id}` | Delete subscriber |
| POST | `/api/admin/campaigns` | Create campaign |
| GET | `/api/admin/campaigns` | List campaigns |
| GET | `/api/admin/campaigns/{id}` | Campaign details |
| POST | `/api/admin/campaigns/{id}/send` | Send campaign |
| DELETE | `/api/admin/campaigns/{id}` | Delete campaign |
| GET | `/api/admin/templates` | List email templates |
