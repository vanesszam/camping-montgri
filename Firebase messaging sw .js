// ══════════════════════════════════════════════════════════════════════════════
// FIREBASE MESSAGING SERVICE WORKER
// Fichier à placer à la RACINE de ton dépôt GitHub (même niveau que index.html)
// ══════════════════════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ── Configuration Firebase ────────────────────────────────────────────────────
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

// ── Gestion des notifications en ARRIÈRE-PLAN ─────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📨 Message reçu en arrière-plan :', payload);

  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  // Icône selon le rôle
  const roleIcons = {
    cleaning:    '🧹',
    maintenance: '🔧',
    inventory:   '📦',
    manager:     '👔'
  };
  const roleEmoji = roleIcons[data.role] || '🏕️';

  const notifTitle = title || `${roleEmoji} Camping Montgri`;
  const notifOptions = {
    body:    body || 'Nouvelle notification',
    icon:    icon || '/camping-montgri/icon-192.png',
    badge:        '/camping-montgri/icon-192.png',
    vibrate: data.priority === 'urgent'
      ? [300, 100, 300, 100, 300]   // Vibration forte si urgent
      : [200, 100, 200],            // Vibration normale
    tag:     data.role || 'general',  // Regroupe les notifs du même rôle
    renotify: true,
    data: {
      url:      'https://vanesszam.github.io/camping-montgri/',
      role:     data.role     || 'general',
      priority: data.priority || 'normal'
    },
    actions: [
      { action: 'open',    title: '📲 Ouvrir' },
      { action: 'dismiss', title: '✖ Ignorer'  }
    ]
  };

  self.registration.showNotification(notifTitle, notifOptions);
});

// ── Clic sur la notification ──────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : 'https://vanesszam.github.io/camping-montgri/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, focus dessus
      for (const client of clientList) {
        if (client.url.includes('camping-montgri') && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Activation du SW ──────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service Worker activé');
  event.waitUntil(clients.claim());
});
