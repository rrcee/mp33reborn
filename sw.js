const CACHE_NAME = 'mp33-v3-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/jsmediatags@3.9.7/dist/jsmediatags.min.js'
];

// Install Event: Cache Core Assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => console.error('Cache initialization failed:', err))
  );
});

// Activate Event: Cleanup old caches (Caches v1 and v2 will be destroyed automatically)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // Strict bypass: Do not block or cache dynamic API data, YouTube iframes, or local media blobs
  if (
    event.request.url.includes('googleapis.com') || 
    event.request.url.includes('youtube.com') || 
    event.request.url.startsWith('blob:') ||
    event.request.url.startsWith('data:')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(networkResponse => {
      return caches.open(CACHE_NAME).then(cache => {
        // Update the cache dynamically in the background with clean responses
        if (networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback
      return caches.match(event.request);
    })
  );
});
