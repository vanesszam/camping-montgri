// ══ FIREBASE MESSAGING SERVICE WORKER ════════════════════════════════════════
// This file MUST be at the root of your GitHub repo

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAmENrZWTJgjNII3d2gLuLY43wZtnnkugM",
  authDomain: "camping-montgri.firebaseapp.com",
  projectId: "camping-montgri",
  storageBucket: "camping-montgri.firebasestorage.app",
  messagingSenderId: "748547768758",
  appId: "1:748547768758:web:4d17085aa68500531ac117",
  databaseURL: "https://camping-montgri-default-rtdb.europe-west1.firebasedatabase.app"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message:', payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Camping Montgri', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [{ action: 'open', title: 'Open App' }]
  });
});

// Click on notification → open app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://vanesszam.github.io/camping-montgri/')
  );
});