/**
 * BusEye · Service Worker
 * Cache offline — Institut Universitaire du Golfe de Guinée
 */

const CACHE_NAME = 'buseye-v1';

// Fichiers à mettre en cache au premier chargement
const PRECACHE_ASSETS = [
    '/iug-bus-map/',
    '/iug-bus-map/index.html',
    '/iug-bus-map/style.css',
    '/iug-bus-map/script.js',
    '/iug-bus-map/manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
];

// ── Installation : mise en cache des assets ──────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ── Activation : nettoyage des anciens caches ────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch : stratégie Cache First pour les assets,
//            Network First pour les données GPS ─────────────────
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Ne pas intercepter les requêtes GPS / relay / OSRM
    if (
        url.hostname === 'router.project-osrm.org' ||
        url.pathname.includes('/api/positions')
    ) {
        return; // Laisser passer sans cache
    }

    // Pour les tuiles OpenStreetMap : cache puis réseau
    if (url.hostname.includes('tile.openstreetmap.org') ||
        url.hostname.includes('arcgisonline.com')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(event.request).then(cached => {
                    const networkFetch = fetch(event.request).then(response => {
                        cache.put(event.request, response.clone());
                        return response;
                    }).catch(() => cached);
                    return cached || networkFetch;
                })
            )
        );
        return;
    }

    // Pour tout le reste : cache d'abord, réseau en fallback
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // Mettre en cache les nouvelles ressources valides
                if (
                    response.status === 200 &&
                    event.request.method === 'GET'
                ) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache =>
                        cache.put(event.request, clone)
                    );
                }
                return response;
            }).catch(() => {
                // Page offline de secours si tout échoue
                if (event.request.destination === 'document') {
                    return caches.match('/iug-bus-map/index.html');
                }
            });
        })
    );
});

// ── Push Notifications ───────────────────────────────────────────
self.addEventListener('push', event => {
    const data = event.data?.json() || {};
    const title = data.title || 'BusEye';
    const options = {
        body:    data.body || 'Mise à jour disponible',
        icon:    '/iug-bus-map/icons/icon-192.png',
        badge:   '/iug-bus-map/icons/icon-72.png',
        tag:     'buseye-notif',
        renotify: true,
        data:    { url: data.url || '/iug-bus-map/' },
        actions: [
            { action: 'open',    title: 'Ouvrir' },
            { action: 'dismiss', title: 'Ignorer' },
        ],
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'dismiss') return;
    const url = event.notification.data?.url || '/iug-bus-map/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                const existing = clientList.find(c => c.url.includes('/iug-bus-map/'));
                if (existing) return existing.focus();
                return clients.openWindow(url);
            })
    );
});
