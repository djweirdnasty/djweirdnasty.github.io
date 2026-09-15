// DJWEIRDNASTY Service Worker - PWA offline caching
var CACHE_NAME = 'djweirdnasty-v3';
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/site.js',
  '/news.html',
  '/mixtapes.html',
  '/djweirdnasty-banner.webp'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function() {});
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // Never intercept Firebase/auth or third-party API calls (this SW should
  // only ever run on the main site; SOL's own /sw.js handles sol.html).
  var url = new URL(req.url);
  if (url.hostname !== self.location.hostname) return;

  // Network-first for HTML documents so page edits show up without a hard refresh
  if (req.destination === 'document' || req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return response;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Cache-first for static assets (css/js/images)
  e.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(req, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });
    })
  );
});
