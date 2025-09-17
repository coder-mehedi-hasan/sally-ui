import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 5173),
    proxy: {
      '/api': {
        target: process.env.API_BASE || 'https://api.quarkshub.com',
        changeOrigin: true,
      }
    }
  }
})

