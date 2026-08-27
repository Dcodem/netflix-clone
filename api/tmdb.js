async function proxy(req, res, origin) {
  const host = req.headers.host || 'localhost'
  const incoming = new URL(req.url || '/', `http://${host}`)
  const rewritten = incoming.searchParams.get('__p')
  incoming.searchParams.delete('__p')
  const path = rewritten || incoming.pathname.replace(/^\/api\/(?:tmdb|iva)/, '') || '/'
  const target = new URL(path.startsWith('/') ? path : `/${path}`, origin)
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value))

  const upstream = await fetch(target, {
    method: req.method || 'GET',
    headers: { Accept: req.headers.accept || '*/*' },
  })
  const body = Buffer.from(await upstream.arrayBuffer())
  res.statusCode = upstream.status
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.end(body)
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    res.end()
    return
  }
  try {
    await proxy(req, res, 'https://api.themoviedb.org')
  } catch {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ detail: 'tmdb proxy failed' }))
  }
}
