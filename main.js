'use strict';

var API_KEY = window.GoogleSamples.Config.gcmAPIKey;
var GCM_ENDPOINT = 'https://android.googleapis.com/gcm/send';

var curlCommandDiv = document.querySelector('.js-curl-command');
var isPushEnabled = false;


function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
 
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
 
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}



// This method handles the removal of subscriptionId
// in Chrome 44 by concatenating the subscription Id
// to the subscription endpoint
function endpointWorkaround(pushSubscription) {
  
  // Make sure we only mess with GCM
  if (pushSubscription.endpoint.indexOf(GCM_ENDPOINT) !== 0) {
    return pushSubscription.endpoint;
  }

  var mergedEndpoint = pushSubscription.endpoint;
  // Chrome 42 + 43 will not have the subscriptionId attached
  // to the endpoint.
  if (pushSubscription.subscriptionId &&
    pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
    // Handle version 42 where you have separate subId and Endpoint
    mergedEndpoint = pushSubscription.endpoint + '/' +
      pushSubscription.subscriptionId;
  }
  return mergedEndpoint;
}

function sendSubscriptionToServer(subscription) {

  // TODO: Send the subscription.endpoint
  // to your server and save it to send a
  // push message at a later date
  //
  // For compatibly of Chrome 43, get the endpoint via
  // endpointWorkaround(subscription)

  var mergedEndpoint = endpointWorkaround(subscription);
  addSubsriptionIdToServer(mergedEndpoint);
}

// Ставим в localStorage отметку о том, что пользователь подписан
function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('sentMessagingToken') == currentToken;
}

function setTokenSentToServer(currentToken) {
    window.localStorage.setItem(
        'sentMessagingToken',
        currentToken ? currentToken : ''
    );
}

function deleteTokenSentToServer() {
    window.localStorage.removeItem('sentMessagingToken');
}


function removeSubsriptionIdFromServer(subscriptionId) {
    console.log('Сейчас удалим кеш');
  /*fetch('/ajax/deleteSubscribe.php', {
      method: 'post', 
      headers: {  
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"  
      },  
      body: 'subscriptionId=' + subscriptionId
    })
    .then(json)
    .then(function (data) {
      console.log('Request succeeded with JSON response', data);
      deleteTokenSentToServer();
    })
    .catch(function (error) {
      console.log('Request failed', error);
    });*/

  $.ajax({
    type: 'POST',
    url: '/ajax/deleteSubscribe.php',
    data: 'subscriptionId='+subscriptionId,
    success: function(res){
      // убираем отметку, что ключ уже установлен
      deleteTokenSentToServer();
      console.log('Ответ после удаления ключа');
      console.log(res);
    }
  });
}

// NOTE: This code is only suitable for GCM endpoints,
// When another browser has a working version, alter
// this to send a PUSH request directly to the endpoint
function addSubsriptionIdToServer(mergedEndpoint) {
  // The curl command to trigger a push message straight from GCM
  if (mergedEndpoint.indexOf(GCM_ENDPOINT) !== 0) {
    window.Demo.debug.log('This browser isn\'t currently ' +
      'supported for this demo');
    return;
  }

  var endpointSections = mergedEndpoint.split('/');
  var subscriptionId = endpointSections[endpointSections.length - 1];

  if (!isTokenSentToServer(subscriptionId)) {

    /*fetch('/ajax/addSubscribe.php', {
      method: 'post', 
      headers: {  
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"  
      },  
      body: 'subscriptionId=' + subscriptionId
    })
    //.then(json)
    .then(function (data) {
      console.log('Request succeeded with JSON response', data);
      setTokenSentToServer(subscriptionId);
    })
    .catch(function (error) {
      console.log('Request failed', error);
    });*/

    $.ajax({
      type: 'POST',
      url: '/ajax/addSubscribe.php',
      data: 'subscriptionId='+subscriptionId,
      success: function(res){
        // ставим отметку, что ключ уже установлен
        setTokenSentToServer(subscriptionId);
      }
    });

  } else {
    console.log('Токен уже отправлен на сервер.');
  }

  /*var curlCommand = 'curl --header "Authorization: key=' + API_KEY +
    '" --header Content-Type:"application/json" ' + GCM_ENDPOINT +
    ' -d "{\\"registration_ids\\":[\\"' + subscriptionId + '\\"]}"';

  curlCommandDiv.textContent = curlCommand;*/
}

function unsubscribe() {
  var pushButton = document.querySelector('.js-push-button');
  pushButton.disabled = true;
  curlCommandDiv.textContent = '';

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // To unsubscribe from push messaging, you need get the
    // subcription object, which you can call unsubscribe() on.
    serviceWorkerRegistration.pushManager.getSubscription().then(
      function(pushSubscription) {
        // Check we have a subscription to unsubscribe
        if (!pushSubscription) {
          // No subscription object, so set the state
          // to allow the user to subscribe to push
          isPushEnabled = false;
          pushButton.disabled = false;
          pushButton.textContent = 'Enable Push Messages';
          return;
        }

        // TODO: Make a request to your server to remove
        // the users data from your data store so you
        // don't attempt to send them push messages anymore

        // We have a subcription, so call unsubscribe on it
        pushSubscription.unsubscribe().then(function() {
          pushButton.disabled = false;
          pushButton.textContent = 'Enable Push Messages';
          isPushEnabled = false;
          
          var endpointSections = pushSubscription.endpoint.split('/');
          var subscriptionId = endpointSections[endpointSections.length - 1];
          console.log('Все готово для удаления кеша subscriptionId');
          removeSubsriptionIdFromServer(subscriptionId);

        }).catch(function(e) {
          // We failed to unsubscribe, this can lead to
          // an unusual state, so may be best to remove
          // the subscription id from your data store and
          // inform the user that you disabled push

          window.Demo.debug.log('Unsubscription error: ', e);
          pushButton.disabled = false;
        });
      }).catch(function(e) {
        window.Demo.debug.log('Error thrown while unsubscribing from ' +
          'push messaging.', e);
      });
  });
}

function subscribe() {
  // Disable the button so it can't be changed while
  // we process the permission request
  var pushButton = document.querySelector('.js-push-button');
  pushButton.disabled = true;

  navigator.serviceWorker.ready
    .then(function(registration) {

      return registration.pushManager.getSubscription()
      .then(async function(subscription) {

        if (subscription) {
          return subscription;
        }

        return registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      });
    }).then(function(subscription) {
        sendSubscriptionToServer(subscription);
      /*fetch('./register', {
        method: 'post',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription
        }),
      });*/

      /*document.getElementById('doIt').onclick = function() {
      const delay = document.getElementById('notification-delay').value;
      const ttl = document.getElementById('notification-ttl').value;*/

        /*fetch('./sendNotification', {
          method: 'post',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            subscription: subscription,
            delay: delay,
            ttl: ttl,
          }),
        });*/

        console.log('Отправили на сервер подписчика');
        isPushEnabled = true;
        pushButton.textContent = 'Disable Push Messages';
        pushButton.disabled = false;
    })
    .catch(function(e) {
        console.log('Не прошли проверку на подписку');
        console.log(e);
    });

  /*navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // sync register workers
    // нужна ли эта строка?
    //serviceWorkerRegistration.sync.register('syncdata');
    console.log('Сейчас будем подписывать пользователя');
    serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(API_KEY)
    })
      .then(function(subscription) {
        console.log('Тест subscription');
        // The subscription was successful
        isPushEnabled = true;
        pushButton.textContent = 'Disable Push Messages';
        pushButton.disabled = false;

        // TODO: Send the subscription subscription.endpoint
        // to your server and save it to send a push message
        // at a later date

        return sendSubscriptionToServer(subscription);
      })
      .catch(function(e) {
        console.log('Не прошли проверку на подписку');
        console.log(Notification);
        if (Notification.permission === 'denied') {
          // The user denied the notification permission which
          // means we failed to subscribe and the user will need
          // to manually change the notification permission to
          // subscribe to push messages
          window.Demo.debug.log('Permission for Notifications was denied');
          pushButton.disabled = true;
        } else {
          // A problem occurred with the subscription, this can
          // often be down to an issue or lack of the gcm_sender_id
          // and / or gcm_user_visible_only
          window.Demo.debug.log('Unable to subscribe to push.', e);
          pushButton.disabled = false;
          pushButton.textContent = 'Enable Push Messages';
        }
      });
  });*/
}

// Once the service worker is registered set the initial state
function initialiseState() {
  // Are Notifications supported in the service worker?
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    window.Demo.debug.log('Notifications aren\'t supported.');
    return;
  }

  // Check the current Notification permission.
  // If its denied, it's a permanent block until the
  // user changes the permission
  if (Notification.permission === 'denied') {
    window.Demo.debug.log('The user has blocked notifications.');
    return;
  }

  // Check if push messaging is supported
  if (!('PushManager' in window)) {
    window.Demo.debug.log('Push messaging isn\'t supported.');
    return;
  }

  // We need the service worker registration to check for a subscription
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // Do we already have a push message subscription?
    serviceWorkerRegistration.pushManager.getSubscription()
      .then(function(subscription) {
        // Enable any UI which subscribes / unsubscribes from
        // push messages.
        var pushButton = document.querySelector('.js-push-button');
        pushButton.disabled = false;

        if (!subscription) {
          // We aren’t subscribed to push, so set UI
          // to allow the user to enable push
          return;
        }

        // Keep your server in sync with the latest subscription
        sendSubscriptionToServer(subscription);

        // Set your UI to show they have subscribed for
        // push messages
        pushButton.textContent = 'Disable Push Messages';
        isPushEnabled = true;
      })
      .catch(function(err) {
        window.Demo.debug.log('Error during getSubscription()', err);
      });
  });
}

window.addEventListener('load', function() { 
  var pushButton = document.querySelector('.js-push-button');
  pushButton.addEventListener('click', function() {    
    if (isPushEnabled) {
      unsubscribe();
    } else {
      subscribe();
    }
  });

  // Check that service workers are supported, if so, progressively
  // enhance and add push messaging support, otherwise continue without it.
    if ('serviceWorker' in navigator) {
      // убираем старые service workers
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
                var sw_path = registration.active.scriptURL.split('/');
                var sw_name = sw_path[sw_path.length - 1];
                if (sw_name != 'service_worker.js')
                  registration.unregister();
        }}).catch(function(err) {
            console.log('Service Worker registration failed: ', err);
        });
        // регистрируем новый
      navigator.serviceWorker.register('./service_worker.js')
        .then(initialiseState);
    } else {
      window.Demo.debug.log('Service workers aren\'t supported in this browser.');
    }
});
