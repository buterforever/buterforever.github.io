'use strict'

const cacheVersion = 'v4';
const CACHE = 'network-or-cache-'+cacheVersion;
const timeout = 400;
// При установке воркера мы должны закешировать часть данных (статику).
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll([
                './bmw.jpg',
            ])
        ));
});

// при событии fetch, мы и делаем запрос, но используем кэш, только после истечения timeout.
self.addEventListener('fetch', (event) => {

    const url = new URL(event.request.url);

    if (url.origin == 'http://localhost')
    {
        event.respondWith(fromNetwork(event.request, timeout)
          .catch((err) => {
              console.log(`Error: ${err.message()}`);
              return fromCache(event.request);
          }));
    } else
    {
        console.log('Возвращаем то, что есть');
    }
});

// Временно-ограниченный запрос.
function fromNetwork(request, timeout) {
    return new Promise((fulfill, reject) => {
        var timeoutId = setTimeout(reject, timeout);
        fetch(request).then((response) => {
            clearTimeout(timeoutId);
            fulfill(response);
        }, reject);
    });
}

function fromCache(request) {
// Открываем наше хранилище кэша (CacheStorage API), выполняем поиск запрошенного ресурса.
// Обратите внимание, что в случае отсутствия соответствия значения Promise выполнится успешно, но со значением `undefined`
    return caches.open(CACHE).then((cache) =>
        cache.match(request).then((matching) =>
            matching || Promise.reject('no-match')
        ));
}