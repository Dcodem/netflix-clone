import type { MovieListItem } from '../api/types'

export function isShow(item: { kind?: string }): boolean {
  return item.kind === 'show'
}

export function isMovie(item: { kind?: string }): boolean {
  return item.kind === 'movie' || item.kind == null || item.kind === ''
}

export function ofKind(
  items: MovieListItem[],
  kind: 'all' | 'movies' | 'shows',
): MovieListItem[] {
  if (kind === 'movies') return items.filter(isMovie)
  if (kind === 'shows') return items.filter(isShow)
  return items
}

export function detailPath(item: { id: string; kind?: string }): string {
  const id = encodeURIComponent(item.id)
  return isShow(item) ? `/show/${id}` : `/movie/${id}`
}

export function formatRating(rating?: number | null): string | null {
  if (rating == null || rating === 0) return null
  return rating.toFixed(1)
}

export function formatRuntime(mins?: number | null): string | null {
  if (!mins) return null
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  if (!hours) return `${rest}m`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function stillFocus(index: number) {
  return `${(index * 29) % 88}% ${(index * 17) % 72}%`
}

const TMDB_FILE = /^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i

export function stillUrl(value?: string | null): string | null {
  if (!value) return null
  if (/^https?:\/\//i.test(value) || value.startsWith('/art/') || value.startsWith('/img')) return value
  const file = value.replace(/^\/+/, '')
  if (TMDB_FILE.test(file)) return `https://image.tmdb.org/t/p/w780/${file}`
  return value
}

export function episodeStill(stills: string[] | undefined, number: number, fallback?: string | null) {
  const pick = stills?.length ? stills[(Math.max(1, number) - 1) % stills.length] : null
  return stillUrl(pick) ?? stillUrl(fallback)
}

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}

export function sortByRating(items: MovieListItem[]): MovieListItem[] {
  return [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
}

export function sortByYear(items: MovieListItem[]): MovieListItem[] {
  return [...items].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
}

export function pickHero(items: MovieListItem[]): MovieListItem | null {
  if (!items.length) return null
  const currentYear = new Date().getFullYear()
  const recent = items.filter((item) => (item.year ?? 0) >= currentYear - 1)
  const pool = recent.length ? recent : items
  return sortByRating(pool)[0] ?? items[0]
}

export function genresOf(item: { genres?: string[] }): string[] {
  return item.genres ?? []
}
