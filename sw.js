/**
 * TRA-FAI Voting System — Progressive Web App (PWA) Service Worker
 * Provides offline shell caching, instant mobile loading, and background updates.
 */

const CACHE_NAME = 'tracfai-pwa-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/voter-dashboard.html',
  '/voter-vote.html',
  '/voter-results.html',
  '/voter-profile.html',
  '/admin-dashboard.html',
  '/admin-results.html',
  '/admin-elections.html',
  '/admin-candidates.html',
  '/admin-voters.html',
  '/admin-audit.html',
  '/css/main.css',
  '/css/dashboard.css',
  '/css/landing.css',
  '/css/login.css',
  '/js/api.js',
  '/js/main.js',
  '/js/pwa.js',
  '/manifest.json',
  '/img/logo.png',
  '/img/logo-sm.png',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js'
];

// ── Install: Pre-cache app shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use addAll with error resilience so a single 404 font doesn't abort caching
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          fetch(url, { cache: 'no-cache' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: Clean up older caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: Strategy routing ──
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Non-GET requests (POST, PUT, DELETE): always network
  if (req.method !== 'GET') {
    return;
  }

  // 2. API requests (/api/...): Network-First (always fresh data for voting/tallies)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        // If offline and request fails, let ApiClient handle its offline banner
        return caches.match(req);
      })
    );
    return;
  }

  // 3. Navigation requests (HTML pages): Network-First with cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          return caches.match(req).then(cached => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // 4. Static assets (CSS, JS, Images, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(networkRes => {
          if (networkRes.ok && networkRes.type !== 'opaque') {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
