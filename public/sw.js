const CACHE_NAME = 'flytelog-cache-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // A simple fetch listener is required for a web app to be installable
  // as a PWA, even if it doesn't do complex offline caching.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    }),
  );
});
