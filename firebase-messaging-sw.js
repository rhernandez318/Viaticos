// firebase-messaging-sw.js
// Service worker minimalista para FCM Web Push
// Subir a: rhernandez318.github.io/Viaticos/firebase-messaging-sw.js

// Importar Firebase para que getToken() funcione en el app
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

// Inicializar messaging (necesario para que FCM reconozca este SW)
firebase.messaging();

// Activar el SW inmediatamente sin esperar a que cierren las pestañas
self.addEventListener('install', event => {
  console.log('[FCM-SW] install');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[FCM-SW] activate');
  event.waitUntil(clients.claim());
});

// Handler directo del push event - se ejecuta para TODOS los mensajes FCM
self.addEventListener('push', event => {
  console.log('[FCM-SW] push event received');
  if (!event.data) {
    console.warn('[FCM-SW] push sin data');
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
    console.log('[FCM-SW] payload:', JSON.stringify(payload));
  } catch(e) {
    console.warn('[FCM-SW] no JSON, intentando texto');
    payload = { notification: { title: 'Grupo Zapata', body: event.data.text() } };
  }

  // FCM v1 puede enviar en notification, webpush.notification, o data
  const notif = payload.notification || {};
  const data  = payload.data         || {};

  const title = data.title || notif.title || 'Grupo Zapata';
  const body  = data.body  || notif.body  || 'Tienes una notificacion nueva';
  const url   = data.url   || (data.fcmOptions && data.fcmOptions.link) || '/Viaticos/';

  console.log('[FCM-SW] mostrando:', title, '-', body);

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:               '/Viaticos/icons/icon-192.png',
      badge:              '/Viaticos/icons/icon-192.png',
      tag:                data.tag || 'viaticos-' + Date.now(),
      renotify:           true,
      requireInteraction: true,
      vibrate:            [200, 100, 200],
      data:               { url },
    }).then(() => console.log('[FCM-SW] notification shown'))
      .catch(err => console.error('[FCM-SW] showNotification error:', err))
  );
});

// Click en notificacion -> abrir la app
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
