const CACHE_NAME = 'shumei-pwa-v2';
const APP_SHELL = [
  './',
  './index.html',
  './reader.html',
  './css/styles.css',
  './js/toggle.js',
  './js/reader.js',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-1024.png',
  './manifest.json'
];

// Install: Cache App Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Strategy: Network-First for HTML and JSON (ensures updates)
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname === '/' || url.pathname.includes('/shumeic')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy: Stale-While-Revalidate for CSS, JS, Images
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networked = fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
