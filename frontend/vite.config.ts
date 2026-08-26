import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'
import { defineConfig } from 'vite'

const API = 'http://localhost:8090'

function spaBypass(req: IncomingMessage) {
  if (req.headers.accept?.includes('text/html')) return '/index.html'
}

const apiProxy = {
  target: API,
  changeOrigin: true,
  bypass: spaBypass,
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/movies': apiProxy,
      '/shows': apiProxy,
      '/search': apiProxy,
      '/catalog': apiProxy,
      '/health': apiProxy,
      '/watch': apiProxy,
      '/img': apiProxy,
    },
  },
})
