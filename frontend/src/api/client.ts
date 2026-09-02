import type { CatalogPage, MovieDetail, MovieListItem, ShowDetail, HomeRails } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new ApiError('Request failed (unexpected response)', response.status)
  }
  return (await response.json()) as T
}

export function getMovies(): Promise<MovieListItem[]> {
  return getJson('/movies')
}

export function getMovie(id: string): Promise<MovieDetail> {
  return getJson(`/movies/${encodeURIComponent(id)}`)
}

export function getShow(id: string): Promise<ShowDetail> {
  return getJson(`/shows/${encodeURIComponent(id)}`)
}

export function searchTitles(q: string): Promise<MovieListItem[]> {
  return getJson(`/search?q=${encodeURIComponent(q)}`)
}

export async function getCatalog(
  kind: 'movies' | 'shows',
  opts: { genre?: string; page?: number } = {},
): Promise<MovieListItem[]> {
  const params = new URLSearchParams()
  if (opts.genre) params.set('genre', opts.genre)
  if (opts.page && opts.page > 1) params.set('page', String(opts.page))
  const query = params.toString()
  const path = `/catalog/${kind}${query ? `?${query}` : ''}`
  const data = await getJson<CatalogPage | MovieListItem[]>(path)
  if (Array.isArray(data)) return data
  return data.items ?? []
}

/** Real-world trending (TMDB weekly), matched to the playable catalog. */
export function getTrending(kind: 'movies' | 'shows' | 'all' = 'all'): Promise<MovieListItem[]> {
  const path = `/trending/${kind}`
  return getJson<CatalogPage | MovieListItem[]>(path).then((data) =>
    Array.isArray(data) ? data : data.items ?? [],
  )
}

/** Our ranking engine's rails (server-side: popularity+recency+region+quality). */
export function getRails(region = 'CA'): Promise<HomeRails> {
  return getJson<HomeRails>(`/rails?region=${encodeURIComponent(region)}`)
}

/** Fetch a few catalog pages so home rails have enough titles to theme. */
export async function getCatalogMany(
  kind: 'movies' | 'shows',
  maxPages = 6,
): Promise<MovieListItem[]> {
  const collected: MovieListItem[] = []
  const seen = new Set<string>()
  for (let page = 1; page <= maxPages; page++) {
    const items = await getCatalog(kind, { page })
    let added = 0
    for (const item of items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      collected.push(item)
      added += 1
    }
    if (!items.length || added === 0) break
  }
  return collected
}

export function proxyImageUrl(url: string): string {
  return `/img?u=${encodeURIComponent(url)}`
}

export function resolveWatchHref(href: string): string {
  if (!href) return ''
  if (/^https?:\/\//i.test(href)) return href
  const origin = String(import.meta.env.VITE_PLAYER_ORIGIN ?? '').replace(/\/$/, '')
  if (!origin) return href
  return `${origin}${href.startsWith('/') ? href : `/${href}`}`
}
