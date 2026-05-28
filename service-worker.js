// Service Worker — Viáticos Zapata
// Estrategia: network-first para el HTML (siempre la última versión)
//             cache-first para librerías CDN (React, Babel, Supabase)

const VERSION = "v2026.05.28-1";
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


// ── Web Push (FCM) — handler que SÍ recibe el push en este scope ──────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch(e) { return; }

  // FCM v1 envía el contenido en notification y/o data
  const notif = payload.notification || {};
  const data  = payload.data        || {};

  const title = data.title || notif.title || 'Grupo Zapata';
  const body  = data.body  || notif.body  || 'Tienes una notificación pendiente';
  const url   = data.url   || (payload.fcmOptions && payload.fcmOptions.link) || '/Viaticos/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:               '/Viaticos/icons/icon-192.png',
      badge:              '/Viaticos/icons/icon-192.png',
      requireInteraction: true,
      vibrate:            [200, 100, 200],
      tag:                'viaticos-' + Date.now(),
      data:               { url },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/Viaticos/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) {
        if (c.url.includes('/Viaticos/') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
