import type { MovieListItem } from '../api/types'
import { genresOf } from '../lib/media'
import type { WatchHistoryItem } from './types'

export function genreWeights(history: WatchHistoryItem[]): Record<string, number> {
  const now = Date.now()
  const weights: Record<string, number> = {}

  for (const item of history) {
    const ageDays = Math.max(0, (now - item.watchedAt) / (1000 * 60 * 60 * 24))
    const recency = Math.max(0.35, 1 - ageDays / 60)
    for (const genre of item.genres) {
      weights[genre] = (weights[genre] ?? 0) + recency
    }
  }

  return weights
}

export function topGenres(weights: Record<string, number>, limit = 3): string[] {
  return Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre)
}

export function rankByTaste(
  items: MovieListItem[],
  history: WatchHistoryItem[],
): MovieListItem[] {
  const weights = genreWeights(history)
  const watched = new Set(history.map((item) => item.id))

  return [...items]
    .filter((item) => !watched.has(item.id))
    .map((item) => {
      const overlap = genresOf(item).reduce((sum, genre) => sum + (weights[genre] ?? 0), 0)
      const score = overlap * 12 + (item.rating ?? 0)
      return { item, overlap, score }
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
}
