// firebase-messaging-sw.js
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

// Notificaciones cuando la app está en background o cerrada
messaging.onBackgroundMessage(payload => {
  const n   = payload.notification || {};
  const d   = payload.data || {};
  const title = d.title || n.title || 'Grupo Zapata';
  const body  = d.body  || n.body  || 'Revisa la app para ver los detalles.';

  self.registration.showNotification(title, {
    body,
    icon:               '/Viaticos/icons/icon-192.png',
    badge:              '/Viaticos/icons/icon-192.png',
    requireInteraction: true,
    vibrate:            [200, 100, 200],
    data:               { url: d.url || '/Viaticos/' },
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/Viaticos/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) {
        if (c.url.includes('/Viaticos/') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
