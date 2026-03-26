const CACHE_NAME = 'abc-rice-v46';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=46',
    './app.js?v=46',
    './rice_field_bg.jpg',
    './manifest.json',
    './icon-512.png',
    './logo.png'
];

// Recursos externos a pre-cachear para funcionamiento offline completo
const EXTERNAL_ASSETS = [
    'https://unpkg.com/lucide@0.577.0',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Forzar actualización inmediata
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            // Cachear assets locales
            await cache.addAll(ASSETS);
            // Cachear assets externos (no bloquear si fallan)
            for (const url of EXTERNAL_ASSETS) {
                try {
                    await cache.add(url);
                } catch (e) {
                    console.warn('No se pudo pre-cachear recurso externo:', url, e);
                }
            }
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Tomar control inmediatamente
    );
});

self.addEventListener('fetch', event => {
    // Para navegación puramente HTML (cuando se abre la PWA)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('./index.html');
            })
        );
        return;
    }

    // Recursos externos (Iconos, Google Fonts, unpkg)
    if (event.request.url.startsWith('http') && !event.request.url.includes(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => {
                    console.warn('Recurso externo no disponible offline:', event.request.url);
                });
            })
        );
        return;
    }

    // Estrategia Stale-While-Revalidate para el resto (CSS, JS)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                // Ignore fallos de red aquí
            });

            return cachedResponse || fetchPromise;
        })
    );
});
