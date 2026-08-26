import type { CatalogPage, MovieDetail, MovieListItem, ShowDetail } from './types'

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
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status)
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
