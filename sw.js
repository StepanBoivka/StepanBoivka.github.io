const CACHE_NAME = 'agro-prostir-v2.4-mobile-layout-fix';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Встановлення Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Активація Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехоплення запитів
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Повертаємо кешовану версію або завантажуємо з мережі
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push notifications підтримка
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Нові дані доступні!',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Переглянути',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Закрити',
        icon: '/images/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('АГРО-ПРОСТІР', options)
  );
});
