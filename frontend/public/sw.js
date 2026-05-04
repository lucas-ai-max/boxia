// BoxIA service worker — cache estático leve para casca PWA.
const CACHE = 'boxia-v4';
const ASSETS = ['/', '/manifest.webmanifest', '/icon-192.svg', '/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // network-first para HTML/JS, cache-first para assets estáticos
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r ?? caches.match('/'))),
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached ?? fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })),
  );
});
