// Offline support: the whole songbook works without a network connection.
// - App shell + chords.xml: network-first, so updates land as soon as they're online,
//   with the cache as an offline fallback.
// - Covers, font, icons: cache-first, they practically never change.
const CACHE = 'scherbakkordy-v3';

const APP_SHELL = [
    './',
    './others.html',
    './js.js',
    './style.css',
    './chords.xml',
    './chords-others.xml',
    './FiraCode-VF.woff2',
    './favicon.svg',
    './day-night-icon.svg',
    './chords-view-icon.svg',
];

const CACHE_FIRST = /\/covers\/|FiraCode|\.svg$|\.png$|\.ico$/;

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    // Song permalinks (/songs/…) are client-side routes — every navigation
    // is served by its page's app shell: others.html for the others page,
    // './' for everything else.
    let cacheKey = request;
    if (request.mode === 'navigate') {
        cacheKey = url.pathname.endsWith('/others.html') ? './others.html' : './';
    }

    if (CACHE_FIRST.test(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request, cacheKey));
    }
});

async function cacheFirst(request) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
}

async function networkFirst(request, cacheKey) {
    const cache = await caches.open(CACHE);
    try {
        // 'no-cache' means revalidate, not "skip the cache": the server answers 304
        // when nothing changed, so a deploy always lands on the next reload while
        // an unchanged chords.xml still costs almost nothing.
        const fresh = await fetch(request, { cache: 'no-cache' });
        if (fresh.ok) cache.put(cacheKey, fresh.clone());
        return fresh;
    } catch (err) {
        const cached = await cache.match(cacheKey);
        if (cached) return cached;
        throw err;
    }
}
