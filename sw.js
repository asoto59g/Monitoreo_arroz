const CACHE_NAME = 'abc-rice-v49';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=48',
    './app.js?v=48',
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
            // Caching robusto: uno por uno para que un error en un archivo no mate todo el SW
            const allAssets = [...ASSETS, ...EXTERNAL_ASSETS];
            return Promise.allSettled(
                allAssets.map(url => cache.add(url).catch(err => console.error('Fallo cacheo de:', url, err)))
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
    const url = new URL(event.request.url);

    // Estrategia de Navegación (Página principal)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Si tenemos red, actualizamos el caché de index y respondemos
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
                    }
                    return response;
                })
                .catch(async () => {
                    // OFFLINE: Intentamos varias llaves de cache comunes por si acaso
                    const cache = await caches.open(CACHE_NAME);
                    const match = await cache.match('./index.html') || await cache.match('./') || await cache.match('index.html');
                    
                    if (match) return match;
                    
                    // Fallback extremo: si nada coincide, intentamos cualquier cosa que parezca un HTML
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Estrategia para Assets (Imágenes, CSS, JS)
    // Cache-First (Responder rápido) e intentar actualizar en fondo
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => null);

            return cachedResponse || fetchPromise;
        })
    );
});
