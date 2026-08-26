export type WatchHistoryItem = {
  id: string
  kind: string
  title: string
  poster_url: string | null
  genres: string[]
  watchedAt: number
  watch_href: string | null
  progress?: number
  runtime?: number | null
  seasonNumber?: number | null
  episodeNumber?: number | null
  episodeId?: string | null
}

export type LikedTitle = {
  id: string
  kind: string
  title: string
  poster_url: string | null
  genres: string[]
}

export type ProfileAvatar = {
  id: string
  color: string
  glyph: string
}

export type Profile = {
  id: string
  name: string
  color: string
  avatarId: string
  kids: boolean
  pinSalt: string | null
  pinHash: string | null
  createdAt: number
  history: WatchHistoryItem[]
  favoriteGenres: string[]
  liked: LikedTitle[]
  dislikedIds: string[]
  myList: LikedTitle[]
  hiddenContinueIds: string[]
}

export type ProfileStore = {
  profiles: Profile[]
  activeProfileId: string | null
}

export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: 'red', color: '#E50914', glyph: '▶' },
  { id: 'blue', color: '#0071EB', glyph: '★' },
  { id: 'green', color: '#54B535', glyph: '◆' },
  { id: 'gold', color: '#F5C518', glyph: '●' },
  { id: 'purple', color: '#A855F7', glyph: '▲' },
  { id: 'orange', color: '#F97316', glyph: '◼' },
  { id: 'teal', color: '#14B8A6', glyph: '✦' },
  { id: 'kids', color: '#38BDF8', glyph: '☺' },
]

export const PROFILE_COLORS = PROFILE_AVATARS.map((avatar) => avatar.color)

export const STORAGE_KEY = 'flix.profiles.v1'
export const HISTORY_LIMIT = 50

export const TASTE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
] as const

export function avatarFor(profile: Pick<Profile, 'avatarId' | 'color'>): ProfileAvatar {
  return (
    PROFILE_AVATARS.find((avatar) => avatar.id === profile.avatarId) ?? {
      id: 'custom',
      color: profile.color,
      glyph: '▶',
    }
  )
}
