'use strict';


let version_cache = 'vers3';
//let cacheName = version_cache+'_cache';

self.addEventListener('push', function(event) {
  console.log('Received a push message', event);

  var title = 'Всем привет!';
  var body = 'Как дела?';
  var icon = '/images/icon-192x192.png';
  var tag = 'simple-push-demo-notification-tag';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  // Android doesn’t close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});

self.addEventListener('install', function(event) {
  function onInstall (event) {
    return caches.open(cacheName)
      .then(cache => cache.addAll([
        '/',
        '/index.html',
        '/bmw.jpg'
      ])
    );
  }
  event.waitUntil(onInstall(event));
});


self.addEventListener('activate', event => {
  function onActivate (event, version_cache) {
    console.log('Запуск onActivate');
    return caches.keys()
      .then(cacheKeys => {
        var oldCacheKeys = cacheKeys.filter(key =>
          key.indexOf(version_cache) !== 0
        );
        var deletePromises = oldCacheKeys.map(oldKey => caches.delete(oldKey));
        return Promise.all(deletePromises);
      });
  }

  event.waitUntil(
    onActivate(event, version_cache)
     .then( () => self.clients.claim() )
  );
});

var config = {
  version: 'achilles1',
  staticCacheItems: [
    '/index.html',
    '/bmw.jpg',
    '/'
  ],
  cachePathPattern: /^\/(?:(20[0-9]{2}|about|blog|css|images|js)\/(.+)?)?$/,
  offlineImage: '<svg role="img" aria-labelledby="offline-title"'
    + ' viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">'
    + '<title id="offline-title">Offline</title>'
    + '<g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/>'
    + '<text fill="#9B9B9B" font-family="Times New Roman,Times,serif" font-size="72" font-weight="bold">'
    + '<tspan x="93" y="172">offline</tspan></text></g></svg>',
  offlinePage: '/offline/'
};

function cacheName (key, opts) {
  return `${opts.version}-${key}`;
}

function addToCache (cacheKey, request, response) {
  if (response.ok) {
    var copy = response.clone();
    caches.open(cacheKey).then( cache => {
      cache.put(request, copy);
    });
  }
  return response;
}

function fetchFromCache (event) {
    return caches.match(event.request).then(response => {
      if (!response) {
      throw Error(`${event.request.url} not found in cache`);
    }
    return response;
  });
}

function offlineResponse (resourceType, opts) {
  if (resourceType === 'image') {
  return new Response(opts.offlineImage,
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    } else if (resourceType === 'content') {
  return caches.match(opts.offlinePage);
    }
  return undefined;
}

self.addEventListener('fetch', (event) => {
  function shouldHandleFetch (event, opts) {
    if (event.request.url.startsWith(self.location.origin)) return true;
    return false;
  }

  function onFetch (event, opts) {
    console.log('Запустили функцию onFetch');
    var request = event.request;
    var acceptHeader = request.headers.get('Accept');
    var resourceType = 'static';
    var cacheKey;

    if (acceptHeader.indexOf('text/html') !== -1) {
      resourceType = 'content';
    } else if (acceptHeader.indexOf('image') !== -1) {
      resourceType = 'image';
    }
    cacheKey = cacheName(resourceType, opts);

    if (resourceType === 'content') {
      event.respondWith(
      fetch(request)
        .then(response => addToCache(cacheKey, request, response))
        .catch(() => fetchFromCache(event))
        .catch(() => offlineResponse(resourceType, opts))
      );
    } else {
      event.respondWith(
        fetchFromCache(event)
          .catch(() => fetch(request))
          .then(response => addToCache(cacheKey, request, response))
          .catch(() => offlineResponse(resourceType, opts))
      );
    }
  }

  if (shouldHandleFetch(event, config)) {
    onFetch(event, config);
  } else{
    console.log('А тут мы отправляем запрос как обычно, потому что это другой сервер');
    console.log(event.request.url);
  }
});
