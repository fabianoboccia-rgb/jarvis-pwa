// JARVIS service worker: caches the HUD shell so the home-screen app opens
// instantly and still opens (without voice) if offline. Only handles our own
// static files — ElevenLabs/unpkg requests pass straight through to the network.

const CACHE = 'jarvis-shell-v1';
const SHELL = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.webmanifest',
    './earthhologram.gif',
    './hologram.gif',
    './radar.gif',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return; // let ElevenLabs/unpkg go to the network

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const network = fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
