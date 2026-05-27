// Service Worker — Viáticos Zapata
// Estrategia: network-first para el HTML (siempre la última versión)
//             cache-first para librerías CDN (React, Babel, Supabase)

const VERSION = "v2026.05.25-1";
const CACHE_NAME = "viaticos-" + VERSION;

// Recursos críticos que pre-cacheamos
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejar GET
  if (req.method !== "GET") return;

  // No cachear llamadas a Supabase (siempre debe ir a la red)
  if (url.hostname.endsWith("supabase.co")) return;

  // Network-first para el HTML principal (siempre actualizado)
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first para todo lo demás (librerías, iconos, fuentes)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

// Permite forzar update desde la app
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});


// ── Web Push ─────────────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { title: event.data.text() }; }

  const title   = data.title || 'Viáticos Casa Zapata';
  const options = {
    body:    data.body    || 'Tienes una notificación pendiente.',
    icon:    data.icon    || '/Viaticos/icons/icon-192.png',
    badge:   data.badge   || '/Viaticos/icons/icon-192.png',
    tag:     data.tag     || 'viaticos-notif',
    renotify: true,
    data:    data.data    || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/Viaticos/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('/Viaticos/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
