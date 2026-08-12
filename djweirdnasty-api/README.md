# DJWEIRDNASTY API

Custom commenting & likes API for djweirdnasty.com, built on Cloudflare Workers + D1.

## Setup

### 1. Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. Create D1 Database

```bash
wrangler d1 create djweirdnasty-db
```

Copy the `database_id` from the output into `wrangler.toml`.

### 3. Initialize Database

```bash
npm run db:init
```

### 4. Set JWT Secret

```bash
wrangler secret put JWT_SECRET
```

Enter a random string (e.g. generate one with `openssl rand -hex 32`).

### 5. Deploy

```bash
npm run deploy
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/test` | No | Health check |
| POST | `/api/auth/register` | No | Register with email + password |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/comments?slug=...` | No | Get comments for a post |
| POST | `/api/comments` | Yes | Post a comment |
| GET | `/api/likes?slug=...` | Optional | Get like count + liked status |
| POST | `/api/likes` | Yes | Toggle like on a post |

## Frontend

The widget is in `../comments.js` and loaded on all article pages via:

```html
<script src="comments.js"></script>
```

Update `API_BASE` in `comments.js` if the Worker URL changes.
