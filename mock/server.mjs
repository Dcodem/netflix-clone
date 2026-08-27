#!/usr/bin/env node
/**
 * Local catalog API mock for UI work when the real :8090 service is not running.
 * Implements the contract in API.md. Does not scrape or proxy a real catalog site.
 */
import { request as httpsRequest } from 'node:https'
import { createServer } from 'node:http'
import { parse } from 'node:url'
import {
  COUNTS,
  catalogPage,
  getDetail,
  getItem,
  homepageRows,
  listMovies,
  searchItems,
} from './catalog.mjs'

const PORT = Number(process.env.MOCK_PORT ?? 8090)
const HOST = process.env.MOCK_HOST ?? '127.0.0.1'

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function hue(seed) {
  let hash = 0
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  return hash % 360
}

function svgArt({ id, kind, title, year, variant, season, episode }) {
  const h = hue(id)
  const color = `hsl(${h} 48% 24%)`
  const accent = `hsl(${(h + 38) % 360} 62% 48%)`
  const wash = `hsl(${(h + 190) % 360} 30% 14%)`
  const subtitle =
    variant === 'thumb' && season && episode
      ? `S${season} · E${episode}`
      : String(year ?? '')
  const width = variant === 'poster' ? 500 : 1280
  const height = variant === 'poster' ? 750 : variant === 'thumb' ? 270 : 720
  const showType = kind === 'show'
  if (variant === 'poster') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="${wash}"/>
    </linearGradient>
    <radialGradient id="spot" cx="70%" cy="20%" r="55%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#spot)"/>
  <circle cx="${showType ? 360 : 140}" cy="${showType ? 220 : 520}" r="${showType ? 180 : 120}" fill="${accent}" opacity="0.35"/>
  <rect x="0" y="${height - 140}" width="100%" height="140" fill="#000" opacity="0.18"/>
</svg>`
  }
  const titleSize = variant === 'thumb' ? 28 : 52
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="#0b0b0b"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="78%" cy="30%" r="180" fill="${accent}" opacity="0.4"/>
  <text x="48" y="${Math.round(height * 0.78)}" fill="#fff" font-family="system-ui,sans-serif" font-size="${titleSize}" font-weight="800">${escapeXml(title)}</text>
  <text x="48" y="${Math.round(height * 0.78) + 40}" fill="#ddd" font-family="system-ui,sans-serif" font-size="22">${escapeXml(subtitle)}</text>
</svg>`
}

function send(res, status, body, headers = {}) {
  const payload = Buffer.from(body)
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Content-Length': payload.length,
    ...headers,
  })
  res.end(payload)
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' })
}

function playerPage(item, season, episode, query = {}) {
  const heading = season && episode ? `${item.title} · S${season}E${episode}` : item.title
  const runtime = Math.max(60, Number(query.runtime) || (item.runtime ? Number(item.runtime) * 60 : 48 * 60))
  const start = Math.max(0, Number(query.t) || 0)
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>${escapeXml(heading)}</title>
    <style>
      html,body{margin:0;height:100%;background:#000;overflow:hidden}
      .art{position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;transform-origin:center}
      .art.is-playing{animation:ken 42s ease-in-out alternate infinite}
      .veil{position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,transparent 20%,rgba(0,0,0,.35) 100%)}
      @keyframes ken{from{transform:scale(1)}to{transform:scale(1.12)}}
    </style>
  </head>
  <body>
    <img class="art is-playing" src="/art/backdrop/${escapeXml(item.id)}" alt=""/>
    <div class="veil"></div>
    <script>
      const SOURCE = 'flix-player'
      let duration = ${runtime}
      let current = ${start}
      let paused = false
      const art = document.querySelector('.art')
      function tick(dt) {
        if (!paused) current = Math.min(duration, current + dt)
        parent.postMessage({ source: SOURCE, type: 'time', current, duration, paused }, '*')
      }
      let last = performance.now()
      function loop(now) {
        tick((now - last) / 1000)
        last = now
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
      window.addEventListener('message', (event) => {
        const data = event.data || {}
        if (data.source !== SOURCE) return
        if (data.cmd === 'play') { paused = false; art.classList.add('is-playing') }
        if (data.cmd === 'pause') { paused = true; art.classList.remove('is-playing') }
        if (data.cmd === 'seek' && typeof data.seconds === 'number') current = Math.max(0, Math.min(duration, data.seconds))
        if (data.cmd === 'skip' && typeof data.delta === 'number') current = Math.max(0, Math.min(duration, current + data.delta))
      })
    </script>
  </body>
</html>`
}

function notFound(res, detail = 'not found') {
  sendJson(res, 404, { detail })
}

function proxyTmdbImage(res, target, hops = 0) {
  let parsed
  try {
    parsed = new URL(target)
  } catch {
    return notFound(res, 'no image')
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'image.tmdb.org' || hops > 3) {
    return notFound(res, 'no image')
  }
  const req = httpsRequest(
    parsed,
    { method: 'GET', headers: { Accept: 'image/*', 'User-Agent': 'flix-mock' } },
    (up) => {
      if (up.statusCode && up.statusCode >= 300 && up.statusCode < 400 && up.headers.location) {
        up.resume()
        return proxyTmdbImage(res, up.headers.location, hops + 1)
      }
      if (up.statusCode !== 200) {
        up.resume()
        return notFound(res, 'no image')
      }
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': up.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      })
      up.pipe(res)
    },
  )
  req.on('error', () => notFound(res, 'no image'))
  req.end()
}

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    })
    res.end()
    return
  }

  const parsed = parse(req.url ?? '/', true)
  const path = decodeURIComponent(parsed.pathname ?? '/')
  const query = parsed.query ?? {}

  if (path === '/health') {
    return sendJson(res, 200, { ok: true, mock: true, ...COUNTS })
  }

  if (path === '/movies') {
    return sendJson(res, 200, homepageRows())
  }

  if (path.startsWith('/movies/')) {
    const id = path.slice('/movies/'.length)
    const detail = getDetail('movie', id)
    return detail ? sendJson(res, 200, detail) : notFound(res)
  }

  if (path.startsWith('/shows/')) {
    const id = path.slice('/shows/'.length)
    const detail = getDetail('show', id)
    return detail ? sendJson(res, 200, detail) : notFound(res)
  }

  if (path === '/search') {
    const q = String(query.q ?? '')
    return sendJson(res, 200, searchItems(q))
  }

  if (path.startsWith('/catalog/')) {
    const kind = path.slice('/catalog/'.length)
    if (kind !== 'movies' && kind !== 'shows') {
      return sendJson(res, 400, { detail: 'kind must be movies or shows' })
    }
    return sendJson(
      res,
      200,
      catalogPage(kind, { genre: query.genre ? String(query.genre) : undefined, page: query.page }),
    )
  }

  if (path.startsWith('/watch/play/')) {
    const id = path.slice('/watch/play/'.length)
    const item = getItem(id)
    if (!item) return notFound(res)
    return send(res, 200, playerPage(item, query.s, query.e, query), { 'Content-Type': 'text/html; charset=utf-8' })
  }

  if (path.startsWith('/watch/')) {
    const id = path.slice('/watch/'.length)
    const item = getItem(id)
    if (!item) return notFound(res)
    res.writeHead(302, {
      Location: `/watch/play/${encodeURIComponent(id)}`,
      'Access-Control-Allow-Origin': '*',
    })
    res.end()
    return
  }

  if (path.startsWith('/art/')) {
    const [, , variant, id] = path.split('/')
    if (!['poster', 'backdrop', 'thumb'].includes(variant) || !id) return notFound(res)
    const item = getItem(id)
    if (!item) return notFound(res)
    const svg = svgArt({
      id,
      kind: item.kind,
      title: item.title,
      year: item.year,
      variant,
      season: query.s,
      episode: query.e,
    })
    return send(res, 200, svg, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' })
  }

  if (path === '/img') {
    const target = String(query.u ?? '')
    if (target.startsWith('/art/')) {
      res.writeHead(302, { Location: target, 'Access-Control-Allow-Origin': '*' })
      res.end()
      return
    }
    return proxyTmdbImage(res, target)
  }

  if (path === '/') {
    return sendJson(res, 200, {
      mock: true,
      movies: listMovies().length,
      ...COUNTS,
      hint: 'GET /movies /shows/{id} /catalog/movies /catalog/shows /search?q=',
    })
  }

  notFound(res)
})

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other API, or set MOCK_PORT.`)
    process.exit(1)
  }
  throw error
})

server.listen(PORT, HOST, () => {
  console.log(`Mock catalog API on http://${HOST}:${PORT} (${COUNTS.movies} movies, ${COUNTS.shows} shows)`)
})
