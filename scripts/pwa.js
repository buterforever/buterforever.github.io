if ('serviceWorker' in navigator) {
    // Весь код регистрации у нас асинхронный.
    navigator.serviceWorker.register('./sw.js')
      .then(() => navigator.serviceWorker.ready.then((worker) => {
        console.log('Service worker succesfully installed');
      }))
      .catch((err) => {
      	console.log('Service worker not installed');
      }
}