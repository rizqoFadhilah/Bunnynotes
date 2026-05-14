self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/icon.png',
      data: {
        url: data.url
      }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// Basic fetch handler to satisfy Chrome's PWA install criteria
self.addEventListener('fetch', function(event) {
  // We can just pipe the request through, but this listener must exist
  event.respondWith(fetch(event.request));
});
