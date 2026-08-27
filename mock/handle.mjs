/**
 * Shared catalog request handler used by the local mock server and Vercel.
 */
import { request as httpsRequest } from 'node:https'
import {
  COUNTS,
  catalogPage,
  getDetail,
  getItem,
  homepageRows,
  listMovies,
  searchItems,
} from './catalog.mjs'

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

function playerPage(item, season, episode) {
  const heading = season && episode ? `${item.title} · S${season}E${episode}` : item.title
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>${escapeXml(heading)}</title>
    <style>
      html,body{margin:0;height:100%;background:#050505;color:#fff;font-family:system-ui,sans-serif}
      .stage{height:100%;display:grid;place-items:center;background:radial-gradient(circle at 20% 20%,#2a2a2a,#050505)}
      .card{text-align:center;opacity:.9}
      .kicker{letter-spacing:.2em;font-size:12px;color:#bbb}
      h1{font-size:28px;margin:8px 0 0}
    </style>
  </head>
  <body>
    <div class="stage">
      <div class="card">
        <div class="kicker">MOCK PLAYER</div>
        <h1>${escapeXml(heading)}</h1>
        <p>${item.kind === 'show' ? 'Series' : 'Film'} · ${item.year}</p>
      </div>
    </div>
  </body>
</html>`
}

function notFound(res, detail = 'not found') {
  sendJson(res, 404, { detail })
}

function first(value) {
  return Array.isArray(value) ? value[0] : value
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

export function catalogPathFromRequest(req) {
  const host = req.headers.host || 'localhost'
  const url = new URL(req.url || '/', `http://${host}`)
  const rewritten = url.searchParams.get('__p')
  url.searchParams.delete('__p')
  const pathname = rewritten || url.pathname.replace(/^\/api\/catalog\/?/, '/') || '/'
  const query = Object.fromEntries(url.searchParams.entries())
  return { pathname, query, method: req.method || 'GET' }
}

export function handleCatalog(req, res, route = catalogPathFromRequest(req)) {
  const { pathname, query, method } = route

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    })
    res.end()
    return
  }

  if (pathname === '/health') {
    return sendJson(res, 200, { ok: true, mock: true, ...COUNTS })
  }

  if (pathname === '/movies') {
    return sendJson(res, 200, homepageRows())
  }

  if (pathname.startsWith('/movies/')) {
    const id = pathname.slice('/movies/'.length)
    const detail = getDetail('movie', id)
    return detail ? sendJson(res, 200, detail) : notFound(res)
  }

  if (pathname.startsWith('/shows/')) {
    const id = pathname.slice('/shows/'.length)
    const detail = getDetail('show', id)
    return detail ? sendJson(res, 200, detail) : notFound(res)
  }

  if (pathname === '/search') {
    const q = String(first(query.q) ?? '')
    return sendJson(res, 200, searchItems(q))
  }

  if (pathname.startsWith('/catalog/')) {
    const kind = pathname.slice('/catalog/'.length)
    if (kind !== 'movies' && kind !== 'shows') {
      return sendJson(res, 400, { detail: 'kind must be movies or shows' })
    }
    return sendJson(
      res,
      200,
      catalogPage(kind, { genre: query.genre ? String(first(query.genre)) : undefined, page: query.page }),
    )
  }

  if (pathname.startsWith('/watch/play/')) {
    const id = pathname.slice('/watch/play/'.length)
    const item = getItem(id)
    if (!item) return notFound(res)
    return send(res, 200, playerPage(item, first(query.s), first(query.e)), {
      'Content-Type': 'text/html; charset=utf-8',
    })
  }

  if (pathname.startsWith('/watch/')) {
    const id = pathname.slice('/watch/'.length)
    const item = getItem(id)
    if (!item) return notFound(res)
    res.writeHead(302, {
      Location: `/watch/play/${encodeURIComponent(id)}`,
      'Access-Control-Allow-Origin': '*',
    })
    res.end()
    return
  }

  if (pathname.startsWith('/art/')) {
    const [, , variant, id] = pathname.split('/')
    if (!['poster', 'backdrop', 'thumb'].includes(variant) || !id) return notFound(res)
    const item = getItem(id)
    if (!item) return notFound(res)
    const svg = svgArt({
      id,
      kind: item.kind,
      title: item.title,
      year: item.year,
      variant,
      season: first(query.s),
      episode: first(query.e),
    })
    return send(res, 200, svg, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    })
  }

  if (pathname === '/img') {
    const target = String(first(query.u) ?? '')
    if (target.startsWith('/art/')) {
      res.writeHead(302, { Location: target, 'Access-Control-Allow-Origin': '*' })
      res.end()
      return
    }
    return proxyTmdbImage(res, target)
  }

  if (pathname === '/' || pathname === '/api/catalog') {
    return sendJson(res, 200, {
      mock: true,
      movies: listMovies().length,
      ...COUNTS,
      hint: 'GET /movies /shows/{id} /catalog/movies /catalog/shows /search?q=',
    })
  }

  notFound(res)
}
