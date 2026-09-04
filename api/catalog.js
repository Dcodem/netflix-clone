// Vercel serverless: proxy catalog/streaming requests to the real backend
// (lookmovie adapter + ranking engine) running on the VPS, exposed via a
// Cloudflare tunnel. Falls back to the bundled mock if the backend is
// unreachable, so the site never hard-fails.
import { handleCatalog } from '../mock/handle.mjs'

const UPSTREAM = (globalThis.process?.env?.CATALOG_UPSTREAM || '').replace(/\/$/, '')
const PROXIED = new Set([
  '/movies', '/shows', '/search', '/catalog', '/trending', '/rails',
  '/stream', '/watch', '/img', '/media', '/similar', '/netflix-top10', '/health',
])

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const rewritten = url.searchParams.get('__p') || url.pathname
  const path = rewritten.split('?')[0]
  const prefix = '/' + (path.split('/')[1] || '')

  if (UPSTREAM && PROXIED.has(prefix)) {
    try {
      const target = UPSTREAM + rewritten + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '')
      const headers = { accept: req.headers.accept || 'application/json' }
      if (prefix === '/img') {
        // image proxy: stream bytes through
        const upstream = await fetch(target, { headers: { 'user-agent': 'flix-vercel' } })
        res.writeHead(upstream.status, {
          'content-type': upstream.headers.get('content-type') || 'image/webp',
          'cache-control': 'public, max-age=86400',
        })
        res.end(Buffer.from(await upstream.arrayBuffer()))
        return
      }
      const upstream = await fetch(target, { headers })
      const body = Buffer.from(await upstream.arrayBuffer())
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-cache',
        'content-length': body.length,
      })
      res.end(body)
      return
    } catch {
      // backend down: fall through to mock so the site still works
    }
  }
  handleCatalog(req, res)
}
