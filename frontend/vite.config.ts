import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API = 'http://localhost:8090'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/movies': { target: API, changeOrigin: true },
      '/shows': { target: API, changeOrigin: true },
      '/search': { target: API, changeOrigin: true },
      '/catalog': { target: API, changeOrigin: true },
      '/health': { target: API, changeOrigin: true },
      '/watch': { target: API, changeOrigin: true },
      '/img': { target: API, changeOrigin: true },
    },
  },
})
