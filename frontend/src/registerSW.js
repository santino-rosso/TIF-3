// Este archivo registra el service worker generado por vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nueva versión disponible');
    // Aquí puedes mostrar un mensaje al usuario para recargar
  },
  onOfflineReady() {
    console.log('App lista para usar offline');
  },
})

// También registramos manualmente para mayor compatibilidad
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration);
      })
      .catch(error => {
        console.log('Error al registrar el Service Worker:', error);
      });
  });
}
