const CACHE_NAME = 'sol-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/sol.html',
  '/sol-logo.png',
  '/favicon.ico',
  '/favicon-192x192.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
  'https://unpkg.com/mapbox-gl@1.13.0/dist/mapbox-gl.css',
  'https://unpkg.com/mapbox-gl@1.13.0/dist/mapbox-gl.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function() {});
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;

  // Skip non-GET requests
  if (req.method !== 'GET') return;

  // Skip Firebase and Mapbox API requests (always need fresh data)
  var url = new URL(req.url);
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('mapbox.com') ||
      url.hostname.includes('api.mapbox.com') ||
      url.hostname.includes('nominatim.openstreetmap.org') ||
      url.hostname.includes('router.project-osrm.org') ||
      url.hostname.includes('rork-dj-booking-payment-app.onrender.com') ||
      url.hostname.includes('cloudfunctions.net')) {
    return;
  }

  // Network-first for HTML, cache-first for static assets
  if (req.destination === 'document' || req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match('/sol.html');
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          if (res && res.status === 200 && res.type === 'basic') {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
          }
          return res;
        }).catch(function() {
          return cached;
        });
      })
    );
  }
});

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) { data = { title: 'SOL', body: e.data ? e.data.text() : 'New notification' }; }

  var title = data.title || 'SOL Booking';
  var options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon-192x192.png',
    badge: '/favicon-48x48.png',
    tag: data.tag || 'sol-notification',
    data: data.data || { url: '/sol.html' },
    vibrate: [200, 100, 200]
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var targetUrl = (e.notification.data && e.notification.data.url) || '/sol.html';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('sol.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
