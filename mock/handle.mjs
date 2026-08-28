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

function playerPage(item, season, episode, query = {}) {
  const heading = season && episode ? `${item.title} · S${season}E${episode}` : item.title
  const runtime = Math.max(60, Number(first(query.runtime)) || (item.runtime ? Number(item.runtime) * 60 : 48 * 60))
  const start = Math.max(0, Number(first(query.t)) || 0)
  const ytRaw = String(first(query.yt) || '')
  const ytId = /^[\w-]{6,20}$/.test(ytRaw) ? ytRaw : ''
  const h = hue(item.id)
  const color = `hsl(${h} 48% 14%)`
  const accent = `hsl(${(h + 38) % 360} 58% 42%)`
  const backdrop = item.backdrop_url || `/art/backdrop/${encodeURIComponent(item.id)}`
  const poster = item.poster_url || `/art/poster/${encodeURIComponent(item.id)}`
  const thumb =
    season && episode
      ? `/art/thumb/${encodeURIComponent(item.id)}?s=${encodeURIComponent(season)}&e=${encodeURIComponent(episode)}`
      : backdrop
  const gallery = String(first(query.g) || '')
    .split(',')
    .map((file) => file.trim())
    .filter((file) => /^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(file))
    .map((file) => `/img?u=${encodeURIComponent(`https://image.tmdb.org/t/p/w1280/${file}`)}`)
  const sources = gallery.length ? gallery : [backdrop, thumb, poster]
  const plates = sources.map((src) => escapeXml(src))
  const plateMarkup = plates
    .map((src, index) => `<div class="plate${index === 0 ? ' is-on' : ''}" style="background-image:url('${src}')"></div>`)
    .join('')
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>${escapeXml(heading)}</title>
    <style>
      html,body{margin:0;height:100%;background:#000;overflow:hidden}
      .stage{position:absolute;inset:0;background:#050505;transition:opacity .55s ease}
      .plate{position:absolute;inset:-18%;background-size:cover;background-position:center;opacity:0;transition:opacity .32s ease;transform-origin:center;filter:saturate(1.08) contrast(1.08)}
      .plate.is-on{opacity:1}
      .stage.is-playing .plate.is-on{animation:ken 6.2s ease-in-out alternate infinite}
      .stage.is-playing .plate.is-on:nth-child(3n+2){animation-name:ken-b}
      .stage.is-playing .plate.is-on:nth-child(3n){animation-name:ken-c}
      .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.42),transparent 22%,transparent 62%,rgba(0,0,0,.58))}
      .grain{position:absolute;inset:-20%;pointer-events:none;opacity:.16;mix-blend-mode:overlay;background-image:repeating-radial-gradient(circle at 18% 22%, rgba(255,255,255,.55) 0 1px, transparent 1px 3px);animation:grain .28s steps(2) infinite}
      .flicker{position:absolute;inset:0;pointer-events:none;background:rgba(255,255,255,.025);animation:flicker 6s ease-in-out infinite}
      .letter{position:absolute;left:0;right:0;height:0;background:#000;z-index:3}
      .letter.top{top:0}
      .letter.bot{bottom:0}
      .wash{position:absolute;inset:0;background:radial-gradient(circle at 72% 28%, ${accent} 0%, transparent 36%), radial-gradient(circle at 18% 82%, ${color} 0%, transparent 52%);opacity:.28;mix-blend-mode:soft-light}
      #ytwrap{position:absolute;inset:0;overflow:hidden;z-index:20;opacity:0;pointer-events:none;background:#000}
      #ytwrap.is-on{opacity:1}
      #yt{position:absolute;inset:0;width:100%!important;height:100%!important}
      #ytwrap iframe{position:absolute;left:50%;top:50%;width:177.78%;height:100%;min-width:100%;min-height:56.25%;transform:translate(-50%,-50%);border:0;pointer-events:none}
      body.is-video .stage,body.is-video .veil,body.is-video .grain,body.is-video .flicker,body.is-video .letter{opacity:0;animation:none}
      @keyframes ken{from{transform:scale(1.04) translate3d(0,0,0)}to{transform:scale(1.16) translate3d(-2.4%,1.2%,0)}}
      @keyframes ken-b{from{transform:scale(1.1) translate3d(1.6%,-1%,0)}to{transform:scale(1.2) translate3d(-1.2%,1.8%,0)}}
      @keyframes ken-c{from{transform:scale(1.06) translate3d(-1.8%,1%,0)}to{transform:scale(1.18) translate3d(1.8%,-1.6%,0)}}
      @keyframes grain{to{transform:translate3d(-3%,4%,0)}}
      @keyframes flicker{0%,100%{opacity:.2}40%{opacity:.05}72%{opacity:.28}}
      .stage.is-paused .grain,.stage.is-paused .flicker{animation-play-state:paused}
    </style>
  </head>
  <body>
    <div class="stage is-playing">
      ${plateMarkup}
      <div class="wash"></div>
    </div>
    <div class="veil"></div>
    <div class="grain"></div>
    <div class="flicker"></div>
    <div class="letter top"></div>
    <div class="letter bot"></div>
    <div id="ytwrap" aria-hidden="true"><div id="yt"></div></div>
    <script>
      const SOURCE = 'flix-player'
      const YT_ID = ${JSON.stringify(ytId)}
      let duration = ${runtime}
      let current = ${start}
      let paused = false
      let shot = 0
      let ytPlayer = null
      let usingYt = false
      let wantMute = false
      let wantVolume = 1
      let wantRate = 1
      const PLAYING = 1
      const stage = document.querySelector('.stage')
      const wrap = document.getElementById('ytwrap')
      const plates = [...document.querySelectorAll('.plate')]
      function showShot(next) {
        if (!plates.length) return
        shot = (next + plates.length) % plates.length
        plates.forEach((plate, index) => plate.classList.toggle('is-on', index === shot))
      }
      function sizeYt() {
        const iframe = wrap && wrap.querySelector('iframe')
        if (!iframe) return
        iframe.style.cssText = 'position:absolute;left:50%;top:50%;width:177.78%;height:100%;min-width:100%;min-height:56.25%;transform:translate(-50%,-50%);border:0;pointer-events:none'
      }
      function applyAudio() {
        if (!ytPlayer) return
        try {
          ytPlayer.setVolume(Math.round(Math.max(0, Math.min(1, wantVolume)) * 100))
          if (wantMute || wantVolume <= 0.01) ytPlayer.mute()
          else ytPlayer.unMute()
        } catch (err) {}
      }
      function applyTransport() {
        if (!ytPlayer) return
        try {
          if (typeof ytPlayer.setPlaybackRate === 'function') ytPlayer.setPlaybackRate(wantRate)
          if (paused) ytPlayer.pauseVideo()
          else ytPlayer.playVideo()
        } catch (err) {}
      }
      function seekTo(seconds) {
        current = Math.max(0, Math.min(duration, seconds))
        if (usingYt && ytPlayer && typeof ytPlayer.seekTo === 'function') {
          try { ytPlayer.seekTo(current, true) } catch (err) {}
        } else showShot(shot + 1)
        if (duration > 0 && current >= duration - 0.05) {
          current = duration
          paused = true
          parent.postMessage({ source: SOURCE, type: 'ended', current: current, duration: duration, paused: true }, '*')
        }
      }
      function revealYt() {
        if (!wrap) return
        sizeYt()
        wrap.classList.add('is-on')
        wrap.style.opacity = '1'
        document.body.classList.add('is-video')
      }
      function readYt() {
        if (!ytPlayer) return
        try {
          const ytDur = ytPlayer.getDuration()
          if (ytDur && ytDur > 1) {
            duration = ytDur
            usingYt = true
          }
          const ytCur = ytPlayer.getCurrentTime()
          if (typeof ytCur === 'number') current = ytCur
          const state = ytPlayer.getPlayerState()
          if (state === 2 || state === 0) paused = true
          else if (state === PLAYING) paused = false
          if (state === PLAYING) revealYt()
        } catch (err) {}
      }
      function tick(dt) {
        if (usingYt) readYt()
        else if (!paused) {
          const next = Math.min(duration, current + dt * wantRate)
          if (duration > 0 && next >= duration - 0.05 && current < duration - 0.05) {
            current = duration
            paused = true
            parent.postMessage({ source: SOURCE, type: 'ended', current: current, duration: duration, paused: true }, '*')
          } else current = next
        }
        parent.postMessage({ source: SOURCE, type: 'time', current: current, duration: duration, paused: paused }, '*')
      }
      let last = performance.now()
      function loop(now) {
        tick((now - last) / 1000)
        last = now
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
      setInterval(function () { if (!paused && !usingYt) showShot(shot + 1) }, 2600)
      function startYt() {
        if (!window.YT || !window.YT.Player) return
        ytPlayer = new window.YT.Player('yt', {
          videoId: YT_ID,
          width: '100%',
          height: '100%',
          host: 'https://www.youtube.com',
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: function (event) {
              sizeYt()
              try { event.target.mute(); event.target.playVideo() } catch (err) {}
              applyAudio()
              applyTransport()
            },
            onError: function () {
              usingYt = false
            },
            onStateChange: function (event) {
              if (event.data === PLAYING) {
                usingYt = true
                paused = false
                revealYt()
                parent.postMessage({ source: SOURCE, type: 'media', kind: 'youtube' }, '*')
              }
              if (event.data === 2) paused = true
              if (event.data === 0) {
                paused = true
                current = duration
                parent.postMessage({ source: SOURCE, type: 'ended', current: current, duration: duration, paused: true }, '*')
              }
            }
          }
        })
        sizeYt()
      }
      function bootYt() {
        if (!YT_ID) return
        if (window.YT && window.YT.Player) {
          startYt()
          return
        }
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const previous = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = function () {
          if (typeof previous === 'function') previous()
          startYt()
        }
        document.head.appendChild(tag)
      }
      bootYt()
      window.addEventListener('message', function (event) {
        const data = event.data || {}
        if (data.source !== SOURCE) return
        if (data.cmd === 'play') {
          paused = false
          stage.classList.add('is-playing')
          stage.classList.remove('is-paused')
          applyTransport()
        }
        if (data.cmd === 'pause') {
          paused = true
          stage.classList.remove('is-playing')
          stage.classList.add('is-paused')
          applyTransport()
        }
        if (data.cmd === 'seek' && typeof data.seconds === 'number') seekTo(data.seconds)
        if (data.cmd === 'skip' && typeof data.delta === 'number') seekTo(current + data.delta)
        if (data.cmd === 'mute') {
          wantMute = Boolean(data.value)
          applyAudio()
        }
        if (data.cmd === 'volume' && typeof data.value === 'number') {
          wantVolume = data.value
          wantMute = data.value <= 0.01
          applyAudio()
        }
        if (data.cmd === 'rate' && typeof data.value === 'number') {
          wantRate = Math.max(0.25, Math.min(2, data.value))
          applyTransport()
        }
      })
    </script>
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
    return send(res, 200, playerPage(item, first(query.s), first(query.e), query), {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
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
