const CACHE_NAME = 'fit21-cache-v1';
const ASSETS = [
  'index.html',
  'css/style-variables.css',
  'css/base-layout.css',
  'css/style.css',
  'js/firebase.js',
  'js/ui-helper.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
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
