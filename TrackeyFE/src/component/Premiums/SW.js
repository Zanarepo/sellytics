self.addEventListener("push", (event) => {
  const data = event.data.json();
  const { title, message } = data;

  self.registration.showNotification(title, {
    body: message,
    icon: "/icon.png",
    badge: "/badge.png",
    tag: "general-notification",
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });

  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ message });
    });
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open") {
    event.waitUntil(clients.openWindow("/"));
  }
});