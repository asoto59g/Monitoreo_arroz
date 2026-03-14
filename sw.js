const CACHE_NAME = 'abc-rice-v3';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Forzar actualización inmediata
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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
    // Si la solicitud es para un recurso externo como fuentes o iconos (Google Fonts, unpkg, etc.)
    if (event.request.url.startsWith('http') && !event.request.url.includes(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse; // Retorna desde caché local inmediatamente
                }
                return fetch(event.request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => {
                    // Ignora silenciosamente si falla la red para el recurso externo
                    console.warn('Network fetch failed for external asset:', event.request.url);
                });
            })
        );
        return;
    }

    // Para archivos de la propia app (index.html, style.css, app.js, iconos)
    event.respondWith(
        caches.match(event.request).then(response => {
            // Estrategia Stale-While-Revalidate para la propia app: devuelve caché y actualiza en background
            const fetchPromise = fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Return fallback if applicable, or just let it fail silently as handled by response ||
            });

            return response || fetchPromise;
        })
    );
});
