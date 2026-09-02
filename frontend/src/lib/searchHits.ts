import type { MovieListItem } from '../api/types'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function titleBare(title: string) {
  return title.replace(/^(the|a|an)\s+/, '')
}

export function searchHitScore(item: MovieListItem, query: string): number {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return 0
  const title = item.title.toLowerCase()
  const bare = titleBare(title)
  if (title === needle || bare === needle) return 400
  if (title.startsWith(needle) || bare.startsWith(needle)) return 300
  const word = new RegExp(`(?:^|\\s)${escapeRegExp(needle)}`)
  if (word.test(title) || word.test(bare)) return 220
  if (title.includes(needle) || bare.includes(needle)) return 180
  const tokens = needle.split(/[^a-z0-9]+/).filter((part) => part.length >= 2)
  if (tokens.length > 1 && tokens.every((part) => title.includes(part) || bare.includes(part))) return 160
  const genres = item.genres ?? []
  if (genres.some((genre) => genre.toLowerCase() === needle)) return 80
  if (genres.some((genre) => genre.toLowerCase().includes(needle))) return 40
  if (item.year && String(item.year) === needle) return 50
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
