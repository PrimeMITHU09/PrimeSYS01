const CACHE_NAME = 'primesys-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app_v3.js',
  '/icon.svg'
];

// Install Event
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      cache.addAll(ASSETS);
    })
  );
});

// Activate Event
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (evt) => {
  // Try network first, then fallback to cache for standard assets
  evt.respondWith(
    fetch(evt.request).catch(() => {
      return caches.match(evt.request);
    })
  );
});
