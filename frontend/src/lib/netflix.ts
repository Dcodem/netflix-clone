import type { MovieListItem } from '../api/types'
import { comingLineFor, isComingSoon } from './comingSoon'
import { genresOf, isShow } from './media'
import { genreWeights } from '../profiles/taste'
import type { LikedTitle, Profile, ProfileLanguage, ProfileMaturity } from '../profiles/types'

export function maturityLabel(item: { kind?: string; genres?: string[] }): string {
  const genres = genresOf(item)
  if (genres.includes('Family') || genres.includes('Animation')) return 'PG'
  if (genres.includes('Horror')) return '18+'
  if (genres.includes('Thriller') || genres.includes('Crime') || genres.includes('War')) return '16+'
  return isShow(item) ? 'TV-14' : '13+'
}

export function allowedByMaturity(
  item: { kind?: string; genres?: string[] },
  profile: Profile | null,
): boolean {
  const level: ProfileMaturity = profile?.maturity ?? 'All Maturity Ratings'
  if (level === 'All Maturity Ratings') return true
  const label = maturityLabel(item)
  if (level === 'Kids') return label === 'PG'
  return label !== '18+' && label !== 'TV-MA'
}

export function filterByMaturity<T extends { kind?: string; genres?: string[] }>(
  items: T[],
  profile: Profile | null,
): T[] {
  if (!profile || profile.maturity === 'All Maturity Ratings') return items
  return items.filter((item) => allowedByMaturity(item, profile))
}

export function profileLanguageCode(language?: ProfileLanguage | null): 'en' | 'es' | 'fr' {
  if (language === 'Español') return 'es'
  if (language === 'Français') return 'fr'
  return 'en'
}

/** Netflix About copy under the boxed rating. */
export function maturityBlurb(label: string): string {
  if (label === '18+' || label === 'TV-MA') return 'graphic violence, language, smoking, substance use'
  if (label === '16+') return 'violence, language, mature themes, smoking'
  if (label === 'TV-14') return 'language, mature themes, violence'
  if (label === 'PG') return 'mild thematic elements, some language'
  return 'some thematic elements, language'
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

export function noticeGroup(stamp: string): 'Today' | 'Yesterday' | 'Earlier' {
  if (stamp === 'Yesterday') return 'Yesterday'
  if (stamp === 'Just now' || stamp === 'Today' || /h ago$/.test(stamp)) return 'Today'
  return 'Earlier'
}

export function activityStamp(watchedAt: number) {
  const watched = new Date(watchedAt)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(watched)
  day.setHours(0, 0, 0, 0)
  const days = Math.round((today.getTime() - day.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return watched.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export type CatalogNotice = {
  item: MovieListItem
  kicker: string
  stamp: string
  unread?: boolean
}

/** Bell + My Netflix cards — Netflix never uses Continue Watching as a notification. */
export function catalogNotices(
  catalog: MovieListItem[],
  profile: Profile | null = null,
  limit = 8,
): CatalogNotice[] {
  const out: CatalogNotice[] = []
  const seen = new Set<string>()
  const byId = new Map(catalog.map((item) => [item.id, item]))

  for (const liked of profile?.myList ?? []) {
    const item = byId.get(liked.id)
    if (!item || !isComingSoon(item) || seen.has(item.id)) continue
    seen.add(item.id)
    out.push({
      item,
      kicker: 'Remind Me',
      stamp: comingLineFor(item) ?? 'Just now',
      unread: true,
    })
    if (out.length >= limit) return out
  }

  const newEps: MovieListItem[] = []
  const soon: MovieListItem[] = []
  const now: MovieListItem[] = []
  for (const item of catalog) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    if (isComingSoon(item)) soon.push(item)
    else if (isShow(item) && isNewEpisodes(item.id, item.kind)) newEps.push(item)
    else now.push(item)
  }

  let n = 0
  let s = 0
  let r = 0
  while (out.length < limit && (n < newEps.length || s < soon.length || r < now.length)) {
    if (n < newEps.length) {
      const item = newEps[n++]
      out.push({ item, kicker: 'New Episodes', stamp: noticeStamp(item.id), unread: true })
    }
    if (out.length >= limit) break
    if (s < soon.length) {
      const item = soon[s++]
      out.push({
        item,
        kicker: 'Coming Soon',
        stamp: comingLineFor(item) ?? noticeStamp(item.id),
        unread: true,
      })
    }
    if (out.length >= limit) break
    if (r < now.length) {
      const item = now[r++]
      out.push({ item, kicker: 'New Arrival', stamp: noticeStamp(item.id) })
    }
  }
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
  year?: number | null
  poster_url?: string | null
  genres?: string[]
  tmdb_id?: number | string | null
}) {
  return {
    id: item.id,
    kind: item.kind ?? 'movie',
    title: item.title,
    year: item.year ?? null,
    poster_url: item.poster_url ?? null,
    genres: item.genres ?? [],
    tmdb_id: item.tmdb_id ?? null,
  }
}

export type TitleRating = 'up' | 'love' | 'down'

export function profileRatingRows(profile: Profile): { item: LikedTitle; rating: TitleRating }[] {
  const loved = new Set(profile.lovedIds ?? [])
  const seen = new Set<string>()
  const rows: { item: LikedTitle; rating: TitleRating }[] = []
  for (const item of profile.liked ?? []) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    rows.push({ item, rating: loved.has(item.id) ? 'love' : 'up' })
  }
  for (const item of profile.disliked ?? []) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    rows.push({ item, rating: 'down' })
  }
  const fallback = [...(profile.history ?? []), ...(profile.myList ?? [])]
  for (const id of profile.dislikedIds ?? []) {
    if (seen.has(id)) continue
    const hit = fallback.find((entry) => entry.id === id)
    if (!hit) continue
    seen.add(id)
    rows.push({ item: toLiked(hit), rating: 'down' })
  }
  return rows
}
