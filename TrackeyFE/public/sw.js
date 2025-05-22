self.addEventListener("push", (event) => {
  const data = event.data.json();
  const { title, message } = data;

  event.waitUntil(
    (async () => {
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

      const clientsList = await self.clients.matchAll();
      for (const client of clientsList) {
        client.postMessage({ message });
      }
    })()
  );
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open") {
    event.waitUntil(clients.openWindow("/"));
  }
});