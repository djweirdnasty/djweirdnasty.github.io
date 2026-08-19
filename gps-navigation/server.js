const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const CACHE = new Map();
const TTL = { geocode: 60 * 60 * 1000, reverse: 10 * 60 * 1000, route: 5 * 60 * 1000 };
const RATE_LIMIT = 120; // per minute per IP
const RATE_WINDOW = 60 * 1000;
const RATE = new Map();

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function cacheKey(type, query) {
  const params = { ...query };
  delete params._; // ignore cache-busting
  return type + ':' + JSON.stringify(params);
}

function getCache(key) {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    CACHE.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl) {
  CACHE.set(key, { data, expires: Date.now() + ttl });
}

function isRateLimited(ip) {
  const now = Date.now();
  let r = RATE.get(ip);
  if (!r || now > r.reset) {
    r = { count: 0, reset: now + RATE_WINDOW };
    RATE.set(ip, r);
  }
  r.count++;
  return r.count > RATE_LIMIT;
}

function fetchExternal(targetUrl) {
  return new Promise((resolve, reject) => {
    const req = https.get(targetUrl, { headers: { 'User-Agent': 'MyGPS/1.0' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          reject(new Error('HTTP ' + res.statusCode));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function serveStatic(reqPath, res) {
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);
  if (filePath.endsWith('/')) filePath += 'index.html';
  const ext = path.extname(filePath) || '.html';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(String(err));
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
}

async function handleGeocode(q, query, res) {
  const key = cacheKey('geocode', query);
  const cached = getCache(key);
  if (cached) { jsonResponse(res, 200, cached); return; }

  const viewbox = query.viewbox || '';
  const bounded = query.bounded || '0';
  const countrycodes = query.countrycodes || 'us';
  const limit = query.limit || '5';
  const addressdetails = query.addressdetails || '1';

  const target = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${encodeURIComponent(viewbox)}&bounded=${bounded}&countrycodes=${countrycodes}&addressdetails=${addressdetails}&limit=${limit}`;
  const { body } = await fetchExternal(target);
  const data = JSON.parse(body);
  setCache(key, data, TTL.geocode);
  jsonResponse(res, 200, data);
}

async function handleReverse(lat, lon, query, res) {
  const key = cacheKey('reverse', query);
  const cached = getCache(key);
  if (cached) { jsonResponse(res, 200, cached); return; }

  const zoom = query.zoom || '18';
  const addressdetails = query.addressdetails || '1';

  const target = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=${addressdetails}`;
  const { body } = await fetchExternal(target);
  const data = JSON.parse(body);
  setCache(key, data, TTL.reverse);
  jsonResponse(res, 200, data);
}

async function handleRoute(coords, query, res) {
  const profile = query.profile === 'foot' ? 'foot' : 'driving';
  const key = cacheKey('route', { coords, profile });
  const cached = getCache(key);
  if (cached) { jsonResponse(res, 200, cached); return; }

  const target = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`;
  const { body } = await fetchExternal(target);
  const data = JSON.parse(body);

  // OSRM demo foot profile returns driving times, so override walking duration with 3 mph
  if (profile === 'foot' && data.routes && data.routes.length) {
    const walkDuration = data.routes[0].distance / 1.34;
    data.routes[0].duration = walkDuration;
    if (data.routes[0].legs && data.routes[0].legs.length) {
      data.routes[0].legs[0].duration = walkDuration;
    }
  }

  setCache(key, data, TTL.route);
  jsonResponse(res, 200, data);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (isRateLimited(ip) && pathname.startsWith('/api/')) {
    jsonResponse(res, 429, { error: 'Rate limited' });
    return;
  }

  try {
    if (pathname === '/api/geocode') {
      const q = parsed.query.q;
      if (!q) { jsonResponse(res, 400, { error: 'Missing q' }); return; }
      await handleGeocode(q, parsed.query, res);
      return;
    }

    if (pathname === '/api/reverse') {
      const lat = parsed.query.lat;
      const lon = parsed.query.lon;
      if (!lat || !lon) { jsonResponse(res, 400, { error: 'Missing lat/lon' }); return; }
      await handleReverse(lat, lon, parsed.query, res);
      return;
    }

    if (pathname === '/api/route') {
      const coords = parsed.query.coords;
      if (!coords) { jsonResponse(res, 400, { error: 'Missing coords' }); return; }
      await handleRoute(coords, parsed.query, res);
      return;
    }

    serveStatic(pathname, res);
  } catch (e) {
    jsonResponse(res, 502, { error: e.message });
  }
});

server.listen(PORT, () => console.log('GPS server on http://localhost:' + PORT));
