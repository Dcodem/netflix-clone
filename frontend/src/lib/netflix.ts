import type { MovieListItem } from '../api/types'
import { genresOf, isShow } from './media'
import { genreWeights } from '../profiles/taste'
import type { Profile } from '../profiles/types'

export function maturityLabel(item: { kind?: string; genres?: string[] }): string {
  const genres = genresOf(item)
  if (genres.includes('Family') || genres.includes('Animation')) return 'PG'
  if (genres.includes('Horror')) return '18+'
  if (genres.includes('Thriller') || genres.includes('Crime') || genres.includes('War')) return '16+'
  return isShow(item) ? 'TV-14' : '13+'
}

export function isKidsSafe(item: { kind?: string; genres?: string[] }): boolean {
  return maturityLabel(item) === 'PG'
}

export function filterForProfile<T extends { kind?: string; genres?: string[] }>(
  items: T[],
  profile: { kids?: boolean } | null,
): T[] {
  if (!profile?.kids) return items
  return items.filter(isKidsSafe)
}

export function needsPlaceholderArt(url?: string | null): boolean {
  if (!url) return true
  return url.startsWith('/art/')
}

export function matchPercent(item: MovieListItem, profile: Profile | null): number {
  if (!profile) return 72
  const weights = genreWeights(profile.history, profile.favoriteGenres)
  const genres = genresOf(item)
  const likedGenres = new Set(profile.liked.flatMap((entry) => entry.genres))
  const overlap = genres.reduce((sum, genre) => sum + (weights[genre] ?? 0), 0)
  const likeBoost = genres.some((genre) => likedGenres.has(genre)) ? 8 : 0
  const peak = Math.max(1, ...Object.values(weights), 1)
  const raw = 58 + (overlap / peak) * 22 + likeBoost + Math.min(8, item.rating ?? 0)
  return Math.max(51, Math.min(99, Math.round(raw)))
}

export function toLiked(item: {
  id: string
  kind?: string
  title: string
  poster_url?: string | null
  genres?: string[]
}) {
  return {
    id: item.id,
    kind: item.kind ?? 'movie',
    title: item.title,
    poster_url: item.poster_url ?? null,
    genres: item.genres ?? [],
  }
}
