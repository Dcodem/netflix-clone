import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'
import { defineConfig } from 'vite'

const API = 'http://localhost:8090'

function spaBypass(req: IncomingMessage) {
  const url = req.url ?? ''
  // Only the search route is also an SPA page. Other HTML requests (player iframe)
  // must reach the API instead of being rewritten to index.html.
  if (url.startsWith('/search') && req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
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
      '/art': apiProxy,
    },
  },
})
