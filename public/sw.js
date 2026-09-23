// Service Worker for Al-Mahfath AI PWA
const CACHE_NAME = 'almahfath-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache assets warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do not cache backend API requests or non-GET requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first with cache fallback for navigation and core assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Network error and no cache available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// Handle incoming push notifications (FCM & Web Push) even when website is closed
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'تذكير الورد القرآني 📖',
    body: 'حان موعد وردك اليومي ومراجعة الحفظ في منصة المحفظ. اضغط للمتابعة ✨',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'quran-study-reminder',
    vibrate: [200, 100, 200],
    data: { url: '/dashboard' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        notificationData.title = payload.notification.title || notificationData.title;
        notificationData.body = payload.notification.body || notificationData.body;
        notificationData.icon = payload.notification.icon || notificationData.icon;
      } else if (payload.title) {
        notificationData.title = payload.title;
        notificationData.body = payload.body || notificationData.body;
      }
      if (payload.data) {
        notificationData.data = payload.data;
      }
    } catch (err) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/favicon.svg',
    badge: notificationData.badge || '/favicon.svg',
    vibrate: notificationData.vibrate || [200, 100, 200],
    tag: notificationData.tag || 'quran-study-reminder',
    renotify: true,
    data: notificationData.data || { url: '/dashboard' },
    actions: [
      { action: 'open', title: 'فتح المصحف 📖' },
      { action: 'dismiss', title: 'لاحقاً' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle clicking on native notifications (mobile & desktop)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
