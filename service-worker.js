const CACHE_NAME = 'egzebiurko-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './calendar.css',
  './js/main.js',
  './js/config.js',
  './js/state.js',
  './js/utils.js',
  './js/db.js',
  './js/views_bundle.js',
  './js/loader.js',
  './js/notifications.js',
  './js/ui.js',
  './js/modules/ai.js',
  './js/modules/cars.js',
  './js/modules/finance.js',
  './js/modules/generator.js',
  './js/modules/links.js',
  './js/modules/notes.js',
  './js/modules/registry.js',
  './js/modules/tracker.js',
  './js/modules/terrain.js',
  './poborca.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });