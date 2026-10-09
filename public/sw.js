// Service worker do CaronaCampus. Só cuida das notificações push:
// não guarda páginas para uso offline (o app depende da API para tudo).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (evento) => evento.waitUntil(self.clients.claim()));

// Chegou uma notificação da API: { titulo, corpo, url }.
self.addEventListener("push", (evento) => {
  let n = { titulo: "CaronaCampus", corpo: "", url: "/" };
  try { n = { ...n, ...evento.data.json() }; } catch { /* carga vazia ou inválida: usa o padrão */ }
  evento.waitUntil(self.registration.showNotification(n.titulo, {
    body: n.corpo,
    icon: "/icone-192.png",
    badge: "/icone-192.png",
    lang: "pt-BR",
    data: { url: n.url },
  }));
});

// Toque na notificação: reaproveita uma janela do app já aberta ou abre uma nova, na tela certa.
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const url = new URL(evento.notification.data?.url ?? "/", self.location.origin).href;
  evento.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const janela of janelas) {
      if (new URL(janela.url).origin !== self.location.origin) continue;
      await janela.focus();
      return janela.navigate(url);
    }
    return self.clients.openWindow(url);
  })());
});
