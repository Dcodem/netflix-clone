import type { MovieListItem } from '../api/types'

export function searchHitScore(item: MovieListItem, query: string): number {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return 0
  const title = item.title.toLowerCase()
  if (title === needle) return 400
  if (title.startsWith(needle)) return 300
  if (title.includes(` ${needle}`)) return 220
  if (title.includes(needle)) return 180
  const genres = item.genres ?? []
  if (genres.some((genre) => genre.toLowerCase() === needle)) return 80
  if (genres.some((genre) => genre.toLowerCase().includes(needle))) return 40
  return 0
}

export function catalogHits(query: string, catalog: MovieListItem[]): MovieListItem[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  return catalog
    .map((item) => ({ item, score: searchHitScore(item, needle) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map((row) => row.item)
}

export function rankSearchHits(query: string, items: MovieListItem[]): MovieListItem[] {
  return [...items].sort(
    (a, b) => searchHitScore(b, query) - searchHitScore(a, query) || a.title.localeCompare(b.title),
  )
}
