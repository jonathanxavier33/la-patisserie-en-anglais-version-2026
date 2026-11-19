/* Pastry English Pro — service worker (mode hors ligne). © 2025 Tous droits réservés. */
const CACHE = 'pep-v5.0.0';
const SHELL = [
    './', './index.html', './style.css', './data.js', './data-extra.js', './app.js',
    './manifest.webmanifest', './manifest-toque.webmanifest',
    './icons/cupcake-192.png', './icons/cupcake-512.png',
    './icons/cupcake-apple-180.png', './icons/cupcake-apple-167.png', './icons/cupcake-apple-152.png', './icons/cupcake-apple-120.png',
    './icons/cupcake-maskable-192.png', './icons/cupcake-maskable-512.png',
    './icons/cupcake-favicon-32.png', './icons/cupcake-favicon-16.png',
    './icons/toque-192.png', './icons/toque-512.png',
    './icons/toque-apple-180.png', './icons/toque-apple-167.png', './icons/toque-apple-152.png', './icons/toque-apple-120.png',
    './icons/toque-maskable-192.png', './icons/toque-maskable-512.png',
    './icons/toque-favicon-32.png', './icons/toque-favicon-16.png'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

/* Réponse immédiate depuis le cache, mise à jour en arrière-plan (polices Google comprises). */
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    e.respondWith(
        caches.open(CACHE).then(cache =>
            cache.match(req).then(hit => {
                const net = fetch(req).then(res => {
                    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
                    return res;
                }).catch(() => hit || (req.mode === 'navigate' ? cache.match('./index.html') : undefined));
                return hit || net;
            })
        )
    );
});
