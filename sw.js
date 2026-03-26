const CACHE_NAME = 'abc-rice-v50';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=50',
    './app.js?v=50',
    './rice_field_bg.jpg',
    './manifest.json',
    './icon-512.png',
    './logo.png'
];

const EXTERNAL_ASSETS = [
    'https://unpkg.com/lucide@0.577.0',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            const allAssets = [...ASSETS, ...EXTERNAL_ASSETS];
            return Promise.allSettled(
                allAssets.map(url => cache.add(url).catch(err => console.error('Fallo cacheo inicial:', url, err)))
            );
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // 1. Estrategia para Navegación (Página principal)
    // Cache-First para arranque instantáneo siempre
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html', { ignoreSearch: true }).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
                    }
                    return networkResponse;
                }).catch(() => null);
                
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 2. Estrategia para Assets (Imágenes, CSS, JS)
    // Cache-First con actualización silenciosa en fondo
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
            if (cachedResponse) {
                // Si tenemos el archivo, lo entregamos ya y actualizamos el cache para la próxima vez
                fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            // Si no está en caché, vamos a la red directamente
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                }
                return networkResponse;
            }).catch(() => {
                // Fallback para imágenes si fallan todas
                if (event.request.destination === 'image') {
                    return caches.match('./icon-512.png');
                }
            });
        })
    );
});
