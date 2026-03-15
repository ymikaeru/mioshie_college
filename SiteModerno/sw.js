const CACHE_NAME = 'shumei-pwa-v20';
const APP_SHELL = [
  './',
  './index.html',
  './reader.html',
  './css/styles.css',
  './css/styles.min.css',
  './js/toggle.js',
  './js/toggle.min.js',
  './js/reader.js',
  './js/reader.min.js',
  './js/marked.min.js',
  './js/login.js',
  './site_data/global_index_titles.js',
  './site_data/shumeic1_nav.json',
  './site_data/shumeic2_nav.json',
  './site_data/shumeic3_nav.json',
  './site_data/shumeic4_nav.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
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

  // Only cache HTTP/HTTPS requests (prevents NetworkError on chrome-extension:// or file://)
  if (!url.protocol.startsWith('http')) return;

  // Skip cross-origin requests (e.g., Google Fonts) — let browser handle caching
  if (url.origin !== self.location.origin) return;

  // Normalize URL: strip query strings (e.g. ?v=11) for cache matching
  const cleanUrl = new URL(url.pathname, url.origin).href;

  // Strategy: Stale-While-Revalidate for Search Index (large files)
  if (url.pathname.includes('search_index_')) {
    event.respondWith(
      caches.match(cleanUrl).then(cached => {
        const networked = fetch(event.request)
          .then(res => {
            if (!res || res.status !== 200 || res.type !== 'basic') return res;
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(cleanUrl, clone));
            return res;
          })
          .catch(() => cached);
        return cached || networked;
      })
    );
    return;
  }

  // Strategy: Network-First for HTML and JSON (ensures updates)
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname === '/' || url.pathname.includes('/shumeic')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type !== 'basic') return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(cleanUrl, clone).catch(err => console.warn('Cache put error:', err)));
          return res;
        })
        .catch(() => caches.match(cleanUrl).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Strategy: Stale-While-Revalidate for CSS, JS, Images
  event.respondWith(
    caches.match(cleanUrl).then(cached => {
      if (!cached) {
        // Also try matching with the original request (with query string)
        return caches.match(event.request).then(cachedOrig => {
          const doFetch = fetch(event.request)
            .then(res => {
              if (!res || res.status !== 200 || res.type !== 'basic') return res;
              const clone = res.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(cleanUrl, clone).catch(err => console.warn('Cache put error:', err)));
              return res;
            })
            .catch(() => cachedOrig);
          return cachedOrig || doFetch;
        });
      }
      const networked = fetch(event.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type !== 'basic') return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(cleanUrl, clone).catch(err => console.warn('Cache put error:', err)));
          return res;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
