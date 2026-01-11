const CACHE_NAME = 'agro-prostir-v4.0-optimized';
const GEOJSON_CACHE_NAME = 'agro-prostir-geojson-v1';

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
  // Активувати одразу без очікування
  self.skipWaiting();
});

// Активація Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Видаляємо старі кеші, крім поточних
          if (cacheName !== CACHE_NAME && cacheName !== GEOJSON_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Взяти контроль над сторінками одразу
  self.clients.claim();
});

// Fetch подій (обробка запитів) - оптимізована стратегія
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Для GeoJSON файлів - стратегія "Network First, Cache Fallback"
  // Це забезпечує свіжі дані, але працює офлайн
  if (url.pathname.endsWith('.geojson') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Кешуємо успішну відповідь
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(GEOJSON_CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // При помилці мережі - повертаємо з кешу
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Для статичних ресурсів - стратегія "Cache First, Network Fallback"
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // Кешуємо нові ресурси
          if (networkResponse.ok && event.request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
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

// Обробка кліків по повідомленнях
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Обробка повідомлень від клієнтів
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
