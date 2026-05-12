// Service Worker — Push Notification Handler
// This file is merged with the Vite PWA service worker

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'Vally 💙',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || 'Someone is thinking of you 💙',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    vibrate: [100, 50, 100, 50, 200],
    data: { url: data.data?.url || '/' },
    actions: [
      { action: 'open', title: 'Open Vally 💙' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: 'vally-presence',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Vally 💙', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
