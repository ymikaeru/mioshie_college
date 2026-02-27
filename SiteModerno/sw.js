const CACHE_NAME = 'shumei-cache-v1';

// Recursos mínimos da estrutura (App Shell)
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/toggle.js',
  './js/reader.js'
];

// Instalação: Cacheia arquivos fundamentais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches velhos se atualizar a versão
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Tenta buscar rede e salvar no log, caso offline usa cache (ou Stale-While-Revalidate)
self.addEventListener('fetch', event => {
  // Ignora chamadas de extensão ou fora do GET
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Estratégia "Stale-While-Revalidate" modificada: 
      // Retorna do cache instantaneamente e faz request em background para atualizar.
      // Se não tem no cache, aguarda a request da rede.
      const fetchPromise = fetch(event.request).then(networkResponse => {
         if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
         }
         return networkResponse;
      }).catch(() => {
          // Deu erro no fetch de rede (offline)
          // Se for página web avulsa, exibe cache (handled automatically if cachedResponse is valid)
      });
      
      return cachedResponse || fetchPromise;
    })
  );
});
