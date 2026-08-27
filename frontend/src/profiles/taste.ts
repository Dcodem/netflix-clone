import type { MovieListItem } from '../api/types'
import { genresOf } from '../lib/media'
import type { LikedTitle, Profile, WatchHistoryItem } from './types'

export function genreWeights(
  history: WatchHistoryItem[],
  favoriteGenres: string[] = [],
  liked: LikedTitle[] = [],
): Record<string, number> {
  const now = Date.now()
  const weights: Record<string, number> = {}

  for (const genre of favoriteGenres) {
    weights[genre] = (weights[genre] ?? 0) + 3.5
  }

  for (const item of liked) {
    for (const genre of item.genres) {
      weights[genre] = (weights[genre] ?? 0) + 2.4
    }
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

function asListItem(seed: { id: string; title: string; kind?: string; poster_url?: string | null; genres?: string[] }): MovieListItem {
  return {
    id: seed.id,
    title: seed.title,
    kind: seed.kind,
    poster_url: seed.poster_url ?? null,
    genres: seed.genres ?? [],
    href: `/${seed.kind === 'show' ? 'shows' : 'movies'}/view/${seed.id}`,
  }
}

export function becauseYouWatched(
  items: MovieListItem[],
  history: WatchHistoryItem[],
): { title: string; items: MovieListItem[] } | null {
  return becauseYouWatchedRows(items, history, 1)[0] ?? null
}

export function becauseYouWatchedRows(
  items: MovieListItem[],
  history: WatchHistoryItem[],
  limit = 3,
): { id: string; title: string; items: MovieListItem[] }[] {
  const rows: { id: string; title: string; items: MovieListItem[] }[] = []
  const seen = new Set<string>()
  for (const seed of history) {
    if (seen.has(seed.id)) continue
    seen.add(seed.id)
    const related = similarByGenres(asListItem(seed), items, 40).filter((item) => item.id !== seed.id)
    if (related.length < 4) continue
    rows.push({
      id: `because-${seed.id}`,
      title: `Because you watched ${seed.title}`,
      items: related,
    })
    if (rows.length >= limit) break
  }
  return rows
}

export function becauseYouLiked(
  items: MovieListItem[],
  liked: LikedTitle[],
): { title: string; items: MovieListItem[] } | null {
  return becauseYouLikedRows(items, liked, 1)[0] ?? null
}

export function becauseYouLikedRows(
  items: MovieListItem[],
  liked: LikedTitle[],
  limit = 2,
): { id: string; title: string; items: MovieListItem[] }[] {
  const rows: { id: string; title: string; items: MovieListItem[] }[] = []
  const seen = new Set<string>()
  for (const seed of liked) {
    if (seen.has(seed.id)) continue
    seen.add(seed.id)
    const related = similarByGenres(asListItem(seed), items, 40).filter((item) => item.id !== seed.id)
    if (related.length < 4) continue
    rows.push({
      id: `liked-${seed.id}`,
      title: `More like ${seed.title}`,
      items: related,
    })
    if (rows.length >= limit) break
  }
  return rows
}

const GENRE_LABELS: Record<string, string> = {
  Action: 'Action',
  Adventure: 'Adventure',
  Animation: 'Animation',
  Comedy: 'Comedies',
  Crime: 'Crime',
  Documentary: 'Documentaries',
  Drama: 'Dramas',
  Family: 'Family',
  Fantasy: 'Fantasy',
  Horror: 'Horror',
  Mystery: 'Mysteries',
  Romance: 'Romance',
  'Sci-Fi': 'Sci-Fi',
  Thriller: 'Thrillers',
}

export function genreRailTitle(genre: string, kind: 'all' | 'movies' | 'shows' = 'all'): string {
  const label = GENRE_LABELS[genre] ?? genre
  if (kind === 'movies') return label === 'Comedies' ? 'Comedy Movies' : `${label} Movies`
  if (kind === 'shows') return `${label} TV Shows`
  return label
}

export function romComItems(items: MovieListItem[]): MovieListItem[] {
  const both = items.filter((item) => {
    const genres = new Set(genresOf(item))
    return genres.has('Romance') && genres.has('Comedy')
  })
  if (both.length >= 6) return both.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  return items
    .filter((item) => {
      const genres = new Set(genresOf(item))
      return genres.has('Romance') || genres.has('Comedy')
    })
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
}

export function tasteGenreRails(
  items: MovieListItem[],
  profile: Profile | null,
  kind: 'all' | 'movies' | 'shows' = 'all',
  limit = 4,
): { id: string; title: string; items: MovieListItem[] }[] {
  const weights = genreWeights(profile?.history ?? [], profile?.favoriteGenres ?? [], profile?.liked ?? [])
  const watchedGenres = new Set((profile?.history ?? []).flatMap((item) => item.genres))
  const likedGenres = new Set((profile?.liked ?? []).flatMap((item) => item.genres))
  const personal = new Set([...watchedGenres, ...likedGenres, ...(profile?.favoriteGenres ?? [])])
  const rows: { id: string; title: string; items: MovieListItem[] }[] = []

  const wantsRomCom =
    personal.has('Romance') || personal.has('Comedy') || (weights.Romance ?? 0) + (weights.Comedy ?? 0) > 0
  if (wantsRomCom || (!personal.size && romComItems(items).length >= 6)) {
    const romCom = romComItems(items)
    if (romCom.length >= 6) {
      rows.push({ id: 'genre-romcom', title: kind === 'shows' ? 'Romantic TV Shows' : 'Rom-Coms', items: romCom })
    }
  }

  const skip = new Set(rows.length ? ['Romance', 'Comedy'] : [])
  const rankedGenres = Object.entries(weights)
    .filter(([genre]) => !skip.has(genre))
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)

  const catalogCounts = new Map<string, number>()
  for (const item of items) {
    for (const genre of genresOf(item)) {
      catalogCounts.set(genre, (catalogCounts.get(genre) ?? 0) + 1)
    }
  }
  const fallbackGenres = [...catalogCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)
    .filter((genre) => !skip.has(genre) && !rankedGenres.includes(genre))

  const source = personal.size ? rankedGenres : [...rankedGenres, ...fallbackGenres]

  for (const genre of source) {
    if (skip.has(genre)) continue
    const list = items
      .filter((item) => genresOf(item).includes(genre))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (list.length < 6) continue
    rows.push({ id: `genre-${genre}`, title: genreRailTitle(genre, kind), items: list })
    if (rows.length >= limit) break
  }

  return rows
}

export function rankByTaste(
  items: MovieListItem[],
  profile: Profile,
  opts: { excludeSeen?: boolean } = {},
): MovieListItem[] {
  const weights = genreWeights(profile.history, profile.favoriteGenres, profile.liked)
  const watched = new Set(profile.history.map((item) => item.id))
  const liked = new Set(profile.liked.map((item) => item.id))
  const disliked = new Set(profile.dislikedIds)
  const likedGenres = new Set(profile.liked.flatMap((item) => item.genres))
  const excludeSeen = opts.excludeSeen !== false

  return [...items]
    .filter((item) => {
      if (disliked.has(item.id)) return false
      if (excludeSeen && (watched.has(item.id) || liked.has(item.id))) return false
      return true
    })
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

/** Client-side similar-title engine. Swap this for a backend rec service later. */
export function recommendSimilar(
  pool: MovieListItem[],
  seeds: Array<{ id: string; title: string; kind?: string; poster_url?: string | null; genres?: string[] }>,
  limit = 24,
): MovieListItem[] {
  const blocked = new Set(seeds.map((seed) => seed.id))
  const scores = new Map<string, { item: MovieListItem; score: number }>()
  for (const seed of seeds) {
    for (const [index, item] of similarByGenres(asListItem(seed), pool, 18).entries()) {
      if (blocked.has(item.id)) continue
      const prev = scores.get(item.id)
      const add = 18 - index
      scores.set(item.id, { item, score: (prev?.score ?? 0) + add })
    }
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item)
    .slice(0, limit)
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
