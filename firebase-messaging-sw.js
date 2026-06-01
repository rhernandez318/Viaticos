// firebase-messaging-sw.js — Service Worker ÚNICO (caché + FCM push)
// Subir a: rhernandez318.github.io/Viaticos/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD5WCpMWnQkwLJplAtbOXrjU2_5gwSRI2w",
  authDomain: "viaticos-zapata.firebaseapp.com",
  projectId: "viaticos-zapata",
  storageBucket: "viaticos-zapata.firebasestorage.app",
  messagingSenderId: "318139943193",
  appId: "1:318139943193:web:3fade17ff5c1e89a805d88"
});

const messaging = firebase.messaging();

// ── FCM: un solo handler para mostrar la notificación (evita duplicados) ──────
messaging.onBackgroundMessage(payload => {
  const d = payload.data || {};
  const title = d.t || d.title || 'Grupo Zapata';
  const body  = d.b || d.body  || 'Tienes una notificación pendiente';
  self.registration.showNotification(title, {
    body,
    icon:               '/Viaticos/icons/icon-192.png',
    badge:              '/Viaticos/icons/icon-192.png',
    requireInteraction: true,
    vibrate:            [200, 100, 200],
    tag:                d.tag || ('viaticos-' + Date.now()),  // tag único o el que mande el Worker
    renotify:           true,
    data:               { url: d.url || '/Viaticos/' },
  });
});

// ── Click en notificación → abrir app ─────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// CACHÉ (network-first HTML, cache-first librerías)
// ═══════════════════════════════════════════════════════════════════════════
const VERSION = "v2026.05.28-13";
const CACHE_NAME = "viaticos-" + VERSION;
const PRECACHE = [
  "./", "./index.html", "./manifest.json",
  "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE).catch(()=>{})));
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
  if (req.method !== "GET") return;
  if (url.hostname.endsWith("supabase.co")) return;
  if (url.hostname.includes("googleapis") || url.hostname.includes("gstatic")) return;

  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

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

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
