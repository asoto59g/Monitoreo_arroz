const CACHE_NAME = 'abc-rice-v48';
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

// Recursos externos a pre-cachear para funcionamiento offline completo
const EXTERNAL_ASSETS = [
    'https://unpkg.com/lucide@0.577.0',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap'
];

self.addEventListener('install', event => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(ASSETS);
            for (const url of EXTERNAL_ASSETS) {
                try {
                    const response = await fetch(url);
                    if (response.ok) await cache.put(url, response);
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
        }).then(() => self.clients.claim()) 
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Estrategia Especial para la Navegación (Abrir la App)
    // Intentamos red con un timeout de 3 segundos, si no responde, vamos a cache.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            new Promise((resolve) => {
                const timeoutId = setTimeout(() => {
                    caches.match('./index.html').then(resolve);
                }, 3000);

                fetch(event.request).then(response => {
                    clearTimeout(timeoutId);
                    resolve(response);
                }).catch(() => {
                    clearTimeout(timeoutId);
                    caches.match('./index.html').then(resolve);
                });
            })
        );
        return;
    }

    // Recursos Locales (CSS, JS, Imágenes)
    // Estrategia: Cache-First, then Update in Background
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
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
