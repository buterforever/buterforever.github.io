'use strict';


let version_cache = 'vers1';
let cacheName = version_cache+'_cache';

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
  function onInstall (event, con) {
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

self.addEventListener('fetch', (event) => {
  function shouldHandleFetch (event, opts) {
    if (event.request.url.startsWith(self.location.origin)) return true;
    return false;
  }

  function onFetch (event, opts) {
    console.log('Обрабатываем запрос на наш сервис и кешируем данные');
    return caches.open('v1').then(function(cache) {
      cache.put(event.request, response.clone());
      return response;
    });
  }

  if (shouldHandleFetch(event, config)) {
    onFetch(event, config);
  } else{
    console.log('А тут мы отправляем запрос как обычно, потому что это другой сервер');
    console.log(event.request.url);
  }

  /*event.respondWith(
    caches.match(event.request).then(function(resp) {
      return resp || fetch(event.request).then(function(response) {
        if (event.request.url.startsWith(self.location.origin)) {
          console.log('если мы обращаемся к своему серверу, то добавляем запрос в кеш');
          return caches.open('v1').then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });
        } else{
          console.log('иначе, если это чужой сервер, то просто возвращаем запрос');
          console.log(response);
          return response;
        }
      });
    })
  );*/
});
