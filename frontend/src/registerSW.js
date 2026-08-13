// Este archivo registra el service worker generado por vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    console.log('Nueva versión disponible');
    // Aquí puedes mostrar un mensaje al usuario para recargar
  },
  onOfflineReady() {
    console.log('App lista para usar offline');
  },
})
