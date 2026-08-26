import type { MovieListItem } from '../api/types'
import { genresOf } from '../lib/media'
import type { LikedTitle, Profile, WatchHistoryItem } from './types'

export function genreWeights(history: WatchHistoryItem[], favoriteGenres: string[] = []): Record<string, number> {
  const now = Date.now()
  const weights: Record<string, number> = {}

  for (const genre of favoriteGenres) {
    weights[genre] = (weights[genre] ?? 0) + 3.5
  }

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

export function becauseYouWatched(
  items: MovieListItem[],
  history: WatchHistoryItem[],
): { title: string; items: MovieListItem[] } | null {
  const seed = history[0]
  if (!seed) return null
  const genres = new Set(seed.genres)
  if (!genres.size) return null
  const watched = new Set(history.map((item) => item.id))
  const related = items
    .filter(
      (item) =>
        item.id !== seed.id &&
        !watched.has(item.id) &&
        genresOf(item).some((genre) => genres.has(genre)),
    )
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 18)
  if (related.length < 4) return null
  return { title: `Because you watched ${seed.title}`, items: related }
}

export function becauseYouLiked(
  items: MovieListItem[],
  liked: LikedTitle[],
): { title: string; items: MovieListItem[] } | null {
  const seed = liked[0]
  if (!seed) return null
  const genres = new Set(seed.genres)
  const skip = new Set(liked.map((item) => item.id))
  const related = items
    .filter((item) => !skip.has(item.id) && genresOf(item).some((genre) => genres.has(genre)))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 18)
  if (related.length < 4) return null
  return { title: `Because you liked ${seed.title}`, items: related }
}

export function rankByTaste(items: MovieListItem[], profile: Profile): MovieListItem[] {
  const weights = genreWeights(profile.history, profile.favoriteGenres)
  const watched = new Set(profile.history.map((item) => item.id))
  const liked = new Set(profile.liked.map((item) => item.id))
  const disliked = new Set(profile.dislikedIds)
  const likedGenres = new Set(profile.liked.flatMap((item) => item.genres))

  return [...items]
    .filter((item) => !watched.has(item.id) && !liked.has(item.id) && !disliked.has(item.id))
    .map((item) => {
      const genres = genresOf(item)
      const overlap = genres.reduce((sum, genre) => sum + (weights[genre] ?? 0), 0)
      const likeBoost = genres.some((genre) => likedGenres.has(genre)) ? 6 : 0
      const score = overlap * 12 + likeBoost + (item.rating ?? 0)
      return { item, overlap, score }
    })
    .filter((entry) => entry.overlap > 0 || entry.score > (entry.item.rating ?? 0))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
}

export function similarByGenres(item: MovieListItem, pool: MovieListItem[], limit = 12): MovieListItem[] {
  const seed = new Set(genresOf(item))
  if (!seed.size) return pool.filter((entry) => entry.id !== item.id).slice(0, limit)
  return [...pool]
    .filter((entry) => entry.id !== item.id)
    .map((entry) => ({
      entry,
      overlap: genresOf(entry).filter((genre) => seed.has(genre)).length,
      rating: entry.rating ?? 0,
    }))
    .filter((row) => row.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.rating - a.rating)
    .map((row) => row.entry)
    .slice(0, limit)
}
