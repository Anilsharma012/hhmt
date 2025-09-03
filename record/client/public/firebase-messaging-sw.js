self.addEventListener('push', function(event) {
  try {
    const data = event.data ? event.data.json() : {};
    const title = (data.notification && (data.notification.title || data.notification.body)) ? data.notification.title : (data.data && data.data.title) || 'Notification';
    const body = (data.notification && data.notification.body) || (data.data && data.data.body) || '';
    const image = (data.notification && data.notification.image) || (data.data && data.data.imageUrl) || undefined;
    const deepLink = (data.data && (data.data.deepLink || data.data.url)) || '/';
    const options = { body, icon: image || '/icons/icon-192.png', image, data: { deepLink } };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {}
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.deepLink) || '/';
  event.waitUntil(clients.matchAll({ type: 'window' }).then(windowClients => {
    for (const client of windowClients) {
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
