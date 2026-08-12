# DJWEIRDNASTY Newsletter System

A self-hosted newsletter platform built with FastAPI + SQLite + Brevo.

## Features
- Subscriber signup with email confirmation (double opt-in)
- Unsubscribe links in every email
- Admin dashboard at `/admin`
- Campaign editor (HTML newsletters)
- Open/click tracking
- Subscriber management

## Setup

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

### 3. Get a free Brevo API key
- Sign up at [brevo.com](https://www.brevo.com) (free: 300 emails/day)
- Go to Settings → API Keys → Generate
- Paste the key into `.env` as `BREVO_API_KEY`

### 4. Run locally
```bash
python main.py
```
- API runs at `http://localhost:8000`
- Admin dashboard at `http://localhost:8000/admin`

### 5. Deploy to Render (free tier)
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `newsletter`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
5. Add environment variables from your `.env` file
6. Deploy

### 6. Wire up your website
Update the newsletter form in `index.html` to point to your API:
```html
<form action="https://your-api.onrender.com/api/subscribe" method="POST">
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
