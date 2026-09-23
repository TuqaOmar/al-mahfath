// Firebase Cloud Messaging Background Service Worker
// Automatically loaded by Firebase Web SDK when app is in the background or closed
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "gen-lang-client-0651186360",
  appId: "1:161493869659:web:2d29c4073befc353fecb7e",
  apiKey: "AIzaSyB50XNDQd5sfoA9fb1ldUbwM_jgB-5Ue00",
  authDomain: "gen-lang-client-0651186360.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-almahfath-42ad60aa-c35f-40ec-bc85-8951d12bf9da",
  storageBucket: "gen-lang-client-0651186360.firebasestorage.app",
  messagingSenderId: "161493869659"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'تذكير الورد القرآني 📖';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'حان وقت مراجعة وردك اليومي وأهداف الحفظ في منصة المحفظ ✨',
      icon: payload.notification?.icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: payload.data?.tag || 'quran-study-reminder',
      vibrate: [200, 100, 200],
      data: {
        url: payload.data?.url || '/dashboard'
      },
      actions: [
        { action: 'open', title: 'فتح المصحف 📖' },
        { action: 'dismiss', title: 'لاحقاً' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Init notice:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

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
