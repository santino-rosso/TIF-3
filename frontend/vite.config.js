import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['Reseya.png'],
      manifest: {
        name: 'ReceYa',
        short_name: 'ReceYa',
        description: 'Aplicación para generar y descubrir recetas de cocina',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#10b981',
        icons: [
          {
            src: 'Reseya.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
