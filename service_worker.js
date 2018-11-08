'use strict';

const SOME_API_ENDPOINT = '/ajax/notifications.json';
const timeout = 400;
var config = {
  version: 'megera2',
  staticCacheItems: [
    '/index.html',
    '/bmw.jpg',
    '/'
  ],
  cachePathPattern: /^\/(?:(20[0-9]{2}|obshchestvo|politika|biznes|sport|krasota|popular|all|dosug|zdorove|dom|zurkhay|chelovek-goda|tayny-buryatii|css|images|js)\/(.+)?)?$/,
  offlineImage: '<svg role="img" aria-labelledby="offline-title"'
    + ' viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">'
    + '<title id="offline-title">Offline</title>'
    + '<g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/>'
    + '<text fill="#9B9B9B" font-family="Times New Roman,Times,serif" font-size="72" font-weight="bold">'
    + '<tspan x="93" y="172">offline</tspan></text></g></svg>',
  offlinePage: '/offline/'
};

function isNewNotificationSupported() {
    if (!window.Notification || !Notification.requestPermission)
        return false;
    if (Notification.permission == 'granted')
        throw new Error('You must only call this \*before\* calling Notification.requestPermission(), otherwise this feature detect would bug the user with an actual notification!');
    try {
        new Notification('');
    } catch (e) {
        if (e.name == 'TypeError')
            return false;
    }
    return true;
}

function cacheName (key, opts) {
  return opts.version+'-'+key;
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

function fromNetwork(request, timeout) {
    return new Promise((fulfill, reject) => {
        var timeoutId = setTimeout(reject, timeout);
        fetch(request).then((response) => {
            clearTimeout(timeoutId);
            fulfill(response);
        }, reject);
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

/*------------------------------------ PUSH ---------------------------------------------*/
self.addEventListener('push', function(event) {
  /*var options = {
    body: 'This notification was generated from a push!',
    icon: 'images/example.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {action: 'explore', title: 'Explore this new world',
        icon: 'images/checkmark.png'},
      {action: 'close', title: 'Close',
        icon: 'images/xmark.png'},
    ]
  };*/

  event.waitUntil(
    //self.registration.showNotification("Hello world!", options);
    self.registration.pushManager.getSubscription().then(function(subscription) {
      fetch(SOME_API_ENDPOINT, {
        // В данном случае отправляются данные о подписчике, 
        // что позволит проверить или персонифицировать уведомление
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: 'url=' + subscription.endpoint
      })
      .then(function(response) {
        if (response.status !== 200) {
          // TODO: Если сервер отдал неверные данные, 
          // нужно уведомить об этом пользователя или администратора
          console.log('Хьюстон, у нас проблемы с получением уведомлений: ' + response.status);
          throw new Error();
        }

        // Получаем ответ от сервера и проверяем его
        return response.json().then(function(data) {
          if (data.error || !data.notification) {
            console.error('Сервер вернул ошибку: ', data.error);
            throw new Error();
          }

          var title = data.notification.title;
          var message = data.notification.message;
          var icon = data.notification.icon;
          var notificationTag = data.notification.tag;
          var custom_data = data.notification.data;

          return self.registration.showNotification(title, {
            body: message,
            icon: icon,
            tag: notificationTag,
            data: custom_data
          });
        });
      })
      .catch(function(err) {
        // В случае ошибки отображаем уведомление
        // со статичными данными
        console.error('Невозможно получить данные с сервера: ', err);

        var title = 'Ошибочка вышла';
        var message = 'Мы хотели сообщить вам что-то важное, но у нас всё сломалось.';
        var icon = URL_TO_DEFAULT_ICON;
        var notificationTag = 'notification-error';
        return self.registration.showNotification(title, {
            body: message,
            icon: icon,
            tag: notificationTag
          });
      });
    })
  );  
});

/*-----------------------------------NOTIFICATIONCLICK-----------------------------------------------*/

self.addEventListener('notificationclick', function(event) {
  console.log('Пользователь кликнул по уведомлению: ', event.notification.tag);
  // Закрываем уведомление
  event.notification.close();

  // Смотрим, открыта ли вкладка с данной ссылкой
  // и фокусируемся или открываем ссылку в новой вкладке
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then(function(clientList) {
      var url = event.notification.data;
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == url && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/*-----------------------------------INSTALL-----------------------------------------------*/
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
  event.waitUntil(
    onInstall(event)
    .then( () => self.skipWaiting() )
  );
});

/*--------------------------------ACTIVATE-------------------------------------------------*/
self.addEventListener('activate', event => {
  function onActivate (event, opts) {
    return caches.keys()
      .then(cacheKeys => {
        var oldCacheKeys = cacheKeys.filter(key =>
          key.indexOf(opts.version) !== 0
        );
        var deletePromises = oldCacheKeys.map(oldKey => caches.delete(oldKey));
        return Promise.all(deletePromises);
      });
  }
  event.waitUntil(
    onActivate(event, config)
     .then( () => self.clients.claim() )
  );
  console.log('Service Worker has been activated'); 
});

/*--------------------------------FETCH-------------------------------------------------*/
self.addEventListener('fetch', (event) => {
  function shouldHandleFetch (event, opts) {
    if (event.request.url.startsWith(self.location.origin)) return true;
    //if (event.request.method === 'POST') return false;
    return false;
  }

  function onFetch (event, opts) {
    var request = event.request;
    var acceptHeader = request.headers.get('Accept');
    var resourceType = 'static';
    var cacheKey;
    //if (request.method === 'POST') {console.log('Ура починил'); return fetch(request); }
    //console.log(request);
    if (acceptHeader.indexOf('text/html') !== -1) {
      resourceType = 'content';
    } else if (acceptHeader.indexOf('image') !== -1) {
      resourceType = 'image';
    }

    cacheKey = cacheName(resourceType, opts);
    if (resourceType === 'content') {
      event.respondWith(fromNetwork(request, timeout)
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

  if (shouldHandleFetch(event, config) && event.request.method != 'POST') {
    onFetch(event, config);
  }
});