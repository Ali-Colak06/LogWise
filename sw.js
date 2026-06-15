const CACHE_NAME = 'logwise-v43';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/tr',
  '/tr.html',
  '/tools',
  '/tools.html',
  '/learn',
  '/learn/index.html',
  '/learn/learn.css',
  '/learn/posts.json',
  '/learn/workout-tracker-app-guide',
  '/learn/workout-tracker-app-guide.html',
  '/learn/egzersiz-takip-uygulamasi-ne-kaydetmeli',
  '/learn/egzersiz-takip-uygulamasi-ne-kaydetmeli.html',
  '/learn/why-keep-a-workout-log',
  '/learn/why-keep-a-workout-log.html',
  '/learn/antrenman-gunlugu-neden-tutmalisin',
  '/learn/antrenman-gunlugu-neden-tutmalisin.html',
  '/learn/progressive-overload-explained',
  '/learn/progressive-overload-explained.html',
  '/learn/progressive-overload-nedir',
  '/learn/progressive-overload-nedir.html',
  '/library',
  '/library.html',
  '/library/exercises',
  '/library/exercises.html',
  '/library/programs',
  '/library/programs.html',
  '/one-rep-max-calculator',
  '/one-rep-max-calculator.html',
  '/workout-log-template',
  '/workout-log-template.html',
  '/workout-volume-calculator',
  '/workout-volume-calculator.html',
  '/library/exercises/bench-press',
  '/library/exercises/bench-press.html',
  '/library/exercises/squat',
  '/library/exercises/squat.html',
  '/library/exercises/deadlift',
  '/library/exercises/deadlift.html',
  '/library/programs/push-pull-legs',
  '/library/programs/push-pull-legs.html',
  '/app',
  '/app.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/styles/base.css',
  '/styles/landing.css',
  '/assets/landing/calendar-mockup.png',
  '/assets/landing/program-mockup.png',
  '/assets/landing/workout-logging-phone.jpg',
  '/assets/landing/progress-chart-mockup.png',
  '/data/i18n-tr.js',
  '/data/i18n-en.js',
  '/data/badges.js',
  '/lib/calc.js',
  '/lib/badge-logic.js',
  '/lib/data-schema.js',
  '/lib/profile-utils.js',
  '/lib/db.js',
  '/lib/exercise-utils.js',
  '/components/error-boundary.js',
  '/components/brand-mark.js',
  '/components/dash-chart.js',
  '/components/ex-preview-modal.js',
  '/components/auth-screen.js',
  '/components/comment-section.js',
  '/data/presets-exercises.js',
  '/data/ex-descriptions.js',
  '/data/ex-preview.js',
  '/data/presets-programs.js',
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
          caches.match(e.request).then(cached => cached || caches.match('/app.html'))
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
