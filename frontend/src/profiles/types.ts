export type WatchHistoryItem = {
  id: string
  kind: string
  title: string
  poster_url: string | null
  genres: string[]
  watchedAt: number
  watch_href: string | null
}

export type Profile = {
  id: string
  name: string
  color: string
  createdAt: number
  history: WatchHistoryItem[]
}

export type ProfileStore = {
  profiles: Profile[]
  activeProfileId: string | null
}

export const PROFILE_COLORS = [
  '#E50914',
  '#0071EB',
  '#54B535',
  '#F5C518',
  '#A855F7',
  '#F97316',
] as const

export const STORAGE_KEY = 'flix.profiles.v1'
export const HISTORY_LIMIT = 50
