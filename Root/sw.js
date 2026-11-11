// WCode Service Worker for offline capability
const CACHE_NAME = 'wcode-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/CSS/app.css',
  '/JS/wordlist.js',
  '/JS/wcode-core.js',
  '/JS/app.js',
  '/manifest.json',
  '/resource/logo_small.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
