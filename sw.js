/**
 * Toma el Rasol - Service Worker for Native Mobile & Browser Popup Notifications
 */

const CACHE_NAME = 'toma-el-rasol-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for Push / Background Messages
self.addEventListener('push', (event) => {
  let data = { title: 'Toma el Rasol Birthday Alert', body: 'A child has an upcoming birthday!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './assets/logo/logo.jpeg',
    badge: './assets/logo/logo.jpeg',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || './admin/index.html' },
    actions: [
      { action: 'open', title: 'Open App 📱' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Click on Phone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './admin/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('admin/index.html') || client.url.includes('Toma_elrasol.html')) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
