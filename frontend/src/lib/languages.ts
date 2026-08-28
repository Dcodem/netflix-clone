import type { MovieListItem } from '../api/types'
import { uniqueById } from './media'
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

const KNOWN_ORIGINALS: Record<string, LanguageCode> = {
  parasite: 'ko',
  'spirited away': 'ja',
  shogun: 'ja',
  tagesschau: 'de',
  'gran hermano': 'es',
  coco: 'es',
  'la la land': 'en',
}

const WEIGHTED: LanguageCode[] = [
  'en',
  'en',
  'en',
  'en',
  'en',
  'en',
  'es',
  'es',
  'fr',
  'ja',
  'ko',
  'hi',
  'de',
  'it',
  'pt',
  'zh',
  'tr',
  'ar',
  'th',
  'pl',
  'sv',
  'nl',
]

function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function originalLanguageOf(item: MovieListItem): LanguageCode {
  const known = KNOWN_ORIGINALS[item.title.trim().toLowerCase()]
  if (known) return known
  return WEIGHTED[hash(item.id) % WEIGHTED.length]
}

export function titlesInLanguage(items: MovieListItem[], code: LanguageCode): MovieListItem[] {
  if (code === 'en') return items
  const exact = items.filter((item) => originalLanguageOf(item) === code)
  if (exact.length >= 12) return exact
  const fill = items
    .filter((item) => originalLanguageOf(item) !== code)
    .filter((item) => hash(`${code}:${item.id}`) % 5 === 0)
  return uniqueById([...exact, ...fill]).slice(0, 24)
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
