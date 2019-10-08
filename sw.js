var ver = '1570523569';
var cacheName = 'mie-converter-' + ver;
var filesToCache = [
    '.',
    './index.html',
    './css/index.css',
    './js/deflate.js',
    './js/filesaver.js',
    './js/index.js'
];
for (let i = 0; i < filesToCache.length; i++) {
    filesToCache[i] += '?' + ver;
}

self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        })
    );
});

this.addEventListener('activate', function(event) {
    var cacheWhitelist = [cacheName];
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (cacheWhitelist.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(req);
    return cachedResponse || networkFirst(req);
}

async function networkFirst(req) {
    const cache = await caches.open(cacheName);
    try { 
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
    } catch (e) { 
        const cachedResponse = await cache.match(req);
        return cachedResponse;
    }
}

self.addEventListener('fetch', event => {
    const req = event.request;
    if (/.*(json)$/.test(req.url)) {
        event.respondWith(networkFirst(req));
    } else {
        event.respondWith(cacheFirst(req));
    }
});
