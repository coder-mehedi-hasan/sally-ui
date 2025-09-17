import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 5173),
    proxy: {
      '/api': {
        target: process.env.API_BASE || 'http://localhost:18080',
        changeOrigin: true,
      }
    }
  }
})

