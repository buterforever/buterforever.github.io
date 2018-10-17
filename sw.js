const cacheVersion = '1';
const cache_Name = 'cache-or-network-'+cacheVersion;


self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cache_Name).then(function(cache) {
      return cache.addAll([
        './bmw.jpg'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but remember that caches are shared across
          // the whole origin
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});