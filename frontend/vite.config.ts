import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv } from 'vite'

function spaBypass(req: IncomingMessage) {
  const url = req.url ?? ''
  // Only the search route is also an SPA page. Other HTML requests (player iframe)
  // must reach the API instead of being rewritten to index.html.
  if (url.startsWith('/search') && req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API = env.VITE_API_ORIGIN || 'http://localhost:8090'
  const apiProxy = {
    target: API,
    changeOrigin: true,
    bypass: spaBypass,
  }

  return {
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
        '/iva': {
          target: 'https://ee.iva-api.com',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/iva/, ''),
        },
        '/tmdb': {
          target: 'https://api.themoviedb.org',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/tmdb/, ''),
        },
      },
    },
  }
})
