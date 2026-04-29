const CACHE_NAME = 'fit21-cache-v3';
const ASSETS = [
  'index.html',
  'css/style-variables.css',
  'css/base-layout.css',
  'css/style.css',
  'css/forms.css',
  'css/cards.css',
  'css/utilities.css',
  'js/firebase.js',
  'components/general/ui-helper.js',
  'components/general/header/header.css',
  'components/general/footer/footer.css',
  'components/index/index.css'
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
