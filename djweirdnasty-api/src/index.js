/**
 * DJWEIRDNASTY API — Cloudflare Worker
 * Custom commenting & likes system with email/password auth
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://djweirdnasty.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ---------------------------------------------------------------------------
// Password hashing (PBKDF2 via Web Crypto API)
// ---------------------------------------------------------------------------

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr));
}

// ---------------------------------------------------------------------------
// JWT (HMAC-SHA256 via Web Crypto API)
// ---------------------------------------------------------------------------

async function signJWT(payload, secret) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = base64url(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigBytes = Uint8Array.from(atob(base64urlDecode(sigB64)), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
  if (!valid) return null;

  const payload = JSON.parse(atob(base64urlDecode(payloadB64)));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return str;
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

async function getUser(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  return { id: payload.sub, username: payload.username };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // --- Health check ---
      if (path === '/api/test' && method === 'GET') {
        return json({ status: 'ok', timestamp: Date.now() });
      }

      // --- Auth: Register ---
      if (path === '/api/auth/register' && method === 'POST') {
        return await handleRegister(request, env);
      }

      // --- Auth: Login ---
      if (path === '/api/auth/login' && method === 'POST') {
        return await handleLogin(request, env);
      }

      // --- Comments: List ---
      if (path === '/api/comments' && method === 'GET') {
        return await handleGetComments(request, env, url);
      }

      // --- Comments: Create ---
      if (path === '/api/comments' && method === 'POST') {
        return await handleCreateComment(request, env);
      }

      // --- Likes: Get count ---
      if (path === '/api/likes' && method === 'GET') {
        return await handleGetLikes(request, env, url);
      }

      // --- Likes: Toggle ---
      if (path === '/api/likes' && method === 'POST') {
        return await handleToggleLike(request, env);
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: 'Internal server error', detail: err.message }, 500);
    }
  },
};

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleRegister(request, env) {
  const body = await request.json();
  const email = sanitize(body.email, 255).toLowerCase();
  const username = sanitize(body.username, 50);
  const password = body.password || '';

  if (!email || !validateEmail(email)) {
    return json({ error: 'Valid email is required' }, 400);
  }
  if (!username || username.length < 2) {
    return json({ error: 'Username must be at least 2 characters' }, 400);
  }
  if (password.length < 6) {
    return json({ error: 'Password must be at least 6 characters' }, 400);
  }

  // Check if email already exists
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return json({ error: 'An account with this email already exists' }, 409);
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  await env.DB.prepare(
    'INSERT INTO users (email, username, password_hash, salt) VALUES (?, ?, ?, ?)'
  ).bind(email, username, passwordHash, salt).run();

  const user = await env.DB.prepare('SELECT id, username FROM users WHERE email = ?').bind(email).first();

  const token = await signJWT(
    { sub: user.id, username: user.username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    env.JWT_SECRET
  );

  return json({ token, username: user.username });
}

async function handleLogin(request, env) {
  const body = await request.json();
  const email = sanitize(body.email, 255).toLowerCase();
  const password = body.password || '';

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const user = await env.DB.prepare(
    'SELECT id, username, password_hash, salt FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const token = await signJWT(
    { sub: user.id, username: user.username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    env.JWT_SECRET
  );

  return json({ token, username: user.username });
}

async function handleGetComments(request, env, url) {
  const slug = sanitize(url.searchParams.get('slug') || '', 255);
  if (!slug) return json({ error: 'slug parameter is required' }, 400);

  const results = await env.DB.prepare(
    `SELECT id, username, content, created_at FROM comments WHERE post_slug = ? ORDER BY created_at DESC LIMIT 100`
  ).bind(slug).all();

  return json({ comments: results.results || [] });
}

async function handleCreateComment(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ error: 'Authentication required' }, 401);

  const body = await request.json();
  const slug = sanitize(body.slug, 255);
  const content = sanitize(body.content, 2000);

  if (!slug) return json({ error: 'slug is required' }, 400);
  if (!content || content.length < 1) return json({ error: 'Comment cannot be empty' }, 400);

  const result = await env.DB.prepare(
    'INSERT INTO comments (post_slug, user_id, username, content) VALUES (?, ?, ?, ?)'
  ).bind(slug, user.id, user.username, content).run();

  return json({
    id: result.meta.last_row_id,
    username: user.username,
    content,
    created_at: new Date().toISOString(),
  });
}

async function handleGetLikes(request, env, url) {
  const slug = sanitize(url.searchParams.get('slug') || '', 255);
  if (!slug) return json({ error: 'slug parameter is required' }, 400);

  const result = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM likes WHERE post_slug = ?'
  ).bind(slug).first();

  let liked = false;
  const user = await getUser(request, env);
  if (user) {
    const likeResult = await env.DB.prepare(
      'SELECT id FROM likes WHERE post_slug = ? AND user_id = ?'
    ).bind(slug, user.id).first();
    liked = !!likeResult;
  }

  return json({ count: result.count || 0, liked });
}

async function handleToggleLike(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ error: 'Authentication required' }, 401);

  const body = await request.json();
  const slug = sanitize(body.slug, 255);
  if (!slug) return json({ error: 'slug is required' }, 400);

  const existing = await env.DB.prepare(
    'SELECT id FROM likes WHERE post_slug = ? AND user_id = ?'
  ).bind(slug, user.id).first();

  if (existing) {
    await env.DB.prepare('DELETE FROM likes WHERE id = ?').bind(existing.id).run();
    const count = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM likes WHERE post_slug = ?'
    ).bind(slug).first();
    return json({ count: count.count || 0, liked: false });
  } else {
    await env.DB.prepare(
      'INSERT INTO likes (post_slug, user_id) VALUES (?, ?)'
    ).bind(slug, user.id).run();
    const count = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM likes WHERE post_slug = ?'
    ).bind(slug).first();
    return json({ count: count.count || 0, liked: true });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  });
}
