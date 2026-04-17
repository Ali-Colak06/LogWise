const CACHE_NAME = 'logwise-v6';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/data/i18n-tr.js',
  '/data/i18n-en.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'
];

// Install: precache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML and API, cache-first for static assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for Supabase API calls
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // Network-first for HTML navigation — kullanıcı her zaman güncel sürümü görür
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() =>
          // Offline fallback — cache'den sun
          caches.match(e.request).then(cached => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && (response.status === 200 || response.type === 'opaque')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() =>
        new Response('Offline', { status: 503 })
      );
    })
  );
});

// SW güncelleme bildirimi — tüm açık sekmelere mesaj gönder
self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
    })
  );
});
