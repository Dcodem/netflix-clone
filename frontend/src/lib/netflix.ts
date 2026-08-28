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

/** Netflix About copy under the boxed rating. */
export function maturityBlurb(label: string): string {
  if (label === '18+' || label === 'TV-MA') return 'graphic violence, language, smoking'
  if (label === '16+') return 'violence, language, mature themes'
  if (label === 'TV-14') return 'language, mature themes, violence'
  if (label === 'PG') return 'mild thematic elements'
  return 'some thematic elements'
}

export function needsPlaceholderArt(url?: string | null): boolean {
  if (!url) return true
  return url.startsWith('/art/')
}

export function qualityBadge(quality?: string | null): string | null {
  if (!quality) return 'HD'
  const value = quality.toUpperCase()
  if (value.includes('4K') || value.includes('UHD')) return '4K'
  return 'HD'
}

export function matchPercent(item: MovieListItem, profile: Profile | null): number {
  if (!profile) return 72
  const weights = genreWeights(profile.history, profile.favoriteGenres, profile.liked)
  const genres = genresOf(item)
  const likedGenres = new Set(profile.liked.flatMap((entry) => entry.genres))
  const overlap = genres.reduce((sum, genre) => sum + (weights[genre] ?? 0), 0)
  const likeBoost = genres.some((genre) => likedGenres.has(genre)) ? 8 : 0
  const peak = Math.max(1, ...Object.values(weights), 1)
  const raw = 58 + (overlap / peak) * 22 + likeBoost + Math.min(8, item.rating ?? 0)
  return Math.max(51, Math.min(99, Math.round(raw)))
}

const MOOD_BY_GENRE: Record<string, string[]> = {
  Horror: ['Scary', 'Chilling', 'Ominous'],
  Thriller: ['Suspenseful', 'Tense', 'Gritty'],
  Crime: ['Gritty', 'Dark', 'Violent'],
  Action: ['Exciting', 'Visceral', 'Adrenaline-Fueled'],
  Adventure: ['Exciting', 'Epic', 'Feel-Good'],
  'Science Fiction': ['Mind-Bending', 'Cerebral', 'Ominous'],
  'Sci-Fi': ['Mind-Bending', 'Cerebral', 'Ominous'],
  SciFi: ['Mind-Bending', 'Cerebral', 'Ominous'],
  Drama: ['Emotional', 'Heartfelt', 'Intimate'],
  Comedy: ['Witty', 'Irreverent', 'Feel-Good'],
  Romance: ['Romantic', 'Heartfelt', 'Intimate'],
  Fantasy: ['Nostalgic', 'Exciting', 'Epic'],
  Mystery: ['Suspenseful', 'Mind-Bending', 'Ominous'],
  War: ['Gritty', 'Emotional', 'Violent'],
  Documentary: ['Cerebral', 'Intimate', 'Thought-Provoking'],
  Animation: ['Feel-Good', 'Heartfelt', 'Offbeat'],
  Family: ['Feel-Good', 'Heartfelt', 'Nostalgic'],
  History: ['Emotional', 'Gritty', 'Cerebral'],
  Music: ['Feel-Good', 'Emotional', 'Intimate'],
  Western: ['Gritty', 'Ominous', 'Violent'],
}

const FALLBACK_MOODS = [
  'Exciting',
  'Suspenseful',
  'Emotional',
  'Witty',
  'Dark',
  'Heartfelt',
  'Offbeat',
  'Intimate',
  'Nostalgic',
  'Cerebral',
]

export function isNewEpisodes(id?: string, kind?: string): boolean {
  if (kind !== 'show' || !id) return false
  return moodSeed(id) % 4 === 0
}

export function noticeStamp(id: string): string {
  const labels = ['Just now', '3h ago', 'Yesterday', '2 days ago', '4 days ago', '1 week ago']
  return labels[moodSeed(id) % labels.length]
}

/** Bell + My Netflix cards — Netflix never uses Continue Watching as a notification. */
export function catalogNotices(catalog: MovieListItem[], limit = 8) {
  const year = new Date().getFullYear()
  const out: Array<{ item: MovieListItem; kicker: string; stamp: string }> = []
  const seen = new Set<string>()
  const push = (item: MovieListItem, kicker: string) => {
    if (seen.has(item.id) || out.length >= limit) return
    seen.add(item.id)
    out.push({ item, kicker, stamp: noticeStamp(item.id) })
  }
  for (const item of catalog) {
    if (isShow(item) && isNewEpisodes(item.id, item.kind)) push(item, 'New Episodes')
  }
  for (const item of catalog) {
    if ((item.year ?? 0) >= year) push(item, 'Recently Added')
  }
  for (const item of catalog) push(item, 'Now on Flix')
  return out
}

function moodSeed(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Netflix "This show is:" uses mood tags (Scary, Witty), not a second genre list. */
export function moodTags(
  item: { id?: string; title?: string; genres?: string[] },
  count = 3,
): string[] {
  const seen = new Set<string>()
  const tags: string[] = []
  const lists = genresOf(item).map((genre) => MOOD_BY_GENRE[genre] ?? [])
  const depth = Math.max(0, ...lists.map((list) => list.length))
  for (let i = 0; i < depth; i += 1) {
    for (const list of lists) {
      const mood = list[i]
      if (!mood || seen.has(mood)) continue
      seen.add(mood)
      tags.push(mood)
      if (tags.length >= count) return tags
    }
  }
  const fallback = FALLBACK_MOODS.filter((mood) => !seen.has(mood))
  let n = moodSeed(item.id || item.title || 'flix')
  while (tags.length < count && fallback.length) {
    n = Math.imul(n, 1103515245) + 12345
    const next = fallback.splice((n >>> 0) % fallback.length, 1)[0]
    if (next) tags.push(next)
  }
  return tags
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
