import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'logo/favicon.ico',
        'logo/apple-touch-icon.png',
        'logo/favicon-16x16.png',
        'logo/favicon-32x32.png',
        'logo/sally.jpg'
      ],
      manifest: {
        name: 'Sally',
        short_name: 'Sally',
        description: 'Sally — A social media PWA with a circular concept',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'logo/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: Number(process.env.PORT || 5173),
    proxy: {
      '/api': {
        target: process.env.API_BASE || 'https://api.quarkshub.com',
        changeOrigin: true
      }
    }
  }
})
