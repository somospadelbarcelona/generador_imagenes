// Service Worker para PWA - Somospadel BCN
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Inicializar Firebase en el SW (usando la misma config que en la app, pero hardcodeada aquí o importada)
// Nota: Para simplificar, hardcodeamos la config básica requerida para messaging.
// La misma que en firebase-config.js
try {
    firebase.initializeApp({
        apiKey: "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE",
        authDomain: "americanas-somospadel.firebaseapp.com",
        projectId: "americanas-somospadel",
        storageBucket: "americanas-somospadel.firebasestorage.app",
        messagingSenderId: "638578709472",
        appId: "1:638578709472:web:bf99bbb7688a947b4bd185"
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message ', payload);

        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/img/logo_somospadel.png',
            badge: '/img/logo_somospadel.png',
            tag: payload.data?.tag || 'somospadel-general', // Ayuda a agrupar y gestionar borrado
            renotify: true,
            data: payload.data
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) { console.error("[SW] Firebase init error", e); }

// Evento: Click en Notificación (SOLUCIONA que no se borren)
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click Received.');

    // 1. Cerrar la notificación inmediatamente
    event.notification.close();

    // 2. Definir URL de destino
    const urlToOpen = event.notification.data?.url || '/';

    // 3. Abrir o enfocar ventana
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si ya hay una ventana abierta, enfocarla y navegar
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if ('focus' in client) {
                    return client.focus().then(c => {
                        if (urlToOpen !== '/') c.navigate(urlToOpen);
                    });
                }
            }
            // Si no hay ventana, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Evento: Cierre manual por el usuario (swipe)
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification was closed/swiped away', event.notification.tag);
});

// Forzar actualización inmediata si el usuario lo pide desde la UI
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

const CACHE_NAME = 'somospadel-pro-v36';
const STATIC_RESOURCES = [
    './',
    './index.html',
    './manifest.json',
    './css/theme-playtomic.css?v=701',
    './js/app.js?v=2026',
    './js/core/AuthService.js?v=12.1',
    './js/modules/auth/AuthController.js?v=12.1',
    './img/logo_somospadel.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install: Cache Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_RESOURCES))
    );
    self.skipWaiting();
});

// Activate: Cleanup
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
        ))
    );
    return self.clients.claim();
});

// Fetch Strategy: Stale-While-Revalidate for Static, Network-First for others
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip Firebase calls and cross-origin analytics
    if (url.origin.includes('firestore.googleapis.com') || url.origin.includes('firebasestorage')) {
        return;
    }

    // Static Assets: Stale-While-Revalidate
    if (STATIC_RESOURCES.some(res => event.request.url.includes(res)) || event.request.destination === 'image') {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Others (Data): Network First
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
            .then(res => res || caches.match('./index.html'))
    );
});
