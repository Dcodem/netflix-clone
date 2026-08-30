import type { MovieListItem } from '../api/types'
import { rankByTaste } from '../profiles/taste'
import type { Profile } from '../profiles/types'

export const ORIGINAL_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'pl', label: 'Polish' },
  { code: 'sv', label: 'Swedish' },
  { code: 'th', label: 'Thai' },
  { code: 'nl', label: 'Dutch' },
] as const

export type LanguageCode = (typeof ORIGINAL_LANGUAGES)[number]['code']
export type LanguageSort = 'suggestions' | 'year' | 'az' | 'za'

export const LANGUAGE_SORTS: { id: LanguageSort; label: string }[] = [
  { id: 'suggestions', label: 'Suggestions For You' },
  { id: 'year', label: 'Year Released' },
  { id: 'az', label: 'A-Z' },
  { id: 'za', label: 'Z-A' },
]

/** Named catalog titles that are not originally English. Everything else defaults to English. */
const KNOWN_ORIGINALS: Record<string, LanguageCode> = {
  parasite: 'ko',
  'spirited away': 'ja',
  shogun: 'ja',
  'mourning wife': 'ja',
  tagesschau: 'de',
  'hotel desire': 'de',
  'gran hermano': 'es',
  coco: 'es',
}

export function originalLanguageOf(item: MovieListItem): LanguageCode {
  const known = KNOWN_ORIGINALS[item.title.trim().toLowerCase()]
  if (known) return known
  return 'en'
}

export function languageLabel(code: LanguageCode): string {
  return ORIGINAL_LANGUAGES.find((entry) => entry.code === code)?.label ?? 'English'
}

/** Netflix About-panel audio list: original first, then English + AD. */
export function audioTracksFor(item: MovieListItem): string[] {
  const original = originalLanguageOf(item)
  const tracks = [`${languageLabel(original)} [Original]`]
  if (original !== 'en') tracks.push('English')
  tracks.push('English - Audio Description')
  return tracks
}

/** Netflix About-panel subtitle list. */
export function subtitleTracksFor(item: MovieListItem): string[] {
  const original = originalLanguageOf(item)
  const tracks = ['English', 'English CC']
  if (original !== 'en') tracks.push(languageLabel(original))
  if (original !== 'es') tracks.push('Spanish')
  return tracks
}

export function titlesInLanguage(items: MovieListItem[], code: LanguageCode): MovieListItem[] {
  return items.filter((item) => originalLanguageOf(item) === code)
}

/** Languages that actually have an original-language title. Extra keeps a deep-linked empty pick in the menu. */
export function languageOptionsFor(items: MovieListItem[], extra?: LanguageCode | null) {
  const have = new Set(items.map((item) => originalLanguageOf(item)))
  if (extra) have.add(extra)
  return ORIGINAL_LANGUAGES.filter((entry) => have.has(entry.code))
}

export function sortLanguageTitles(
  items: MovieListItem[],
  sort: LanguageSort,
  profile: Profile | null,
): MovieListItem[] {
  if (sort === 'year') return [...items].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title))
  if (sort === 'az') return [...items].sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'za') return [...items].sort((a, b) => b.title.localeCompare(a.title))
  if (profile) {
    const ranked = rankByTaste(items, profile, { excludeSeen: false })
    return ranked.length ? ranked : items
  }
  return [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
}
