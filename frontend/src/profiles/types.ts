export type EpisodeWatch = {
  progress: number
  seasonNumber: number
  episodeNumber: number
  watchedAt: number
}

export type WatchHistoryItem = {
  id: string
  kind: string
  title: string
  year?: number | null
  poster_url: string | null
  genres: string[]
  watchedAt: number
  watch_href: string | null
  progress?: number
  runtime?: number | null
  seasonNumber?: number | null
  episodeNumber?: number | null
  episodeId?: string | null
  episodeProgress?: Record<string, EpisodeWatch>
}

export type LikedTitle = {
  id: string
  kind: string
  title: string
  year?: number | null
  poster_url: string | null
  genres: string[]
}

export type ProfileAvatar = {
  id: string
  color: string
  glyph: string
  image: string
  label: string
}

export const PROFILE_LANGUAGES = ['English', 'Español', 'Français'] as const
export const PROFILE_MATURITY = ['All Maturity Ratings', 'Teens and below', 'Kids'] as const
export type ProfileLanguage = (typeof PROFILE_LANGUAGES)[number]
export type ProfileMaturity = (typeof PROFILE_MATURITY)[number]
export const DATA_USAGE = ['auto', 'low', 'medium', 'high'] as const
export type DataUsage = (typeof DATA_USAGE)[number]

export const DATA_USAGE_OPTIONS: { id: DataUsage; label: string; detail: string }[] = [
  { id: 'auto', label: 'Auto', detail: 'Recommended' },
  { id: 'low', label: 'Low', detail: 'Basic' },
  { id: 'medium', label: 'Medium', detail: 'Better' },
  { id: 'high', label: 'High', detail: 'Best' },
]

export const DOWNLOAD_QUALITY = ['standard', 'higher'] as const
export type DownloadQuality = (typeof DOWNLOAD_QUALITY)[number]

export const DOWNLOAD_QUALITY_OPTIONS: { id: DownloadQuality; label: string; detail: string }[] = [
  { id: 'standard', label: 'Standard', detail: 'Faster downloads, uses less storage' },
  { id: 'higher', label: 'Higher', detail: 'Best picture, uses more storage' },
]

export function downloadQualityLabel(quality?: DownloadQuality | null) {
  return quality === 'higher' ? 'Higher' : 'Standard'
}

export type Profile = {
  id: string
  name: string
  color: string
  avatarId: string
  pinSalt: string | null
  pinHash: string | null
  autoplayNext: boolean
  autoplayPreview: boolean
  skipIntros: boolean
  dataUsage: DataUsage
  downloadQuality: DownloadQuality
  smartDownloads: boolean
  personalizedRecs: boolean
  shareActivity: boolean
  language: ProfileLanguage
  maturity: ProfileMaturity
  gameHandle: string
  createdAt: number
  history: WatchHistoryItem[]
  favoriteGenres: string[]
  liked: LikedTitle[]
  lovedIds: string[]
  dislikedIds: string[]
  disliked: LikedTitle[]
  myList: LikedTitle[]
  downloads: LikedTitle[]
  hiddenContinueIds: string[]
}

export type ProfileStore = {
  profiles: Profile[]
  activeProfileId: string | null
}

export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: 'red', color: '#E50914', glyph: '▶', image: '/avatars/red-panda.png', label: 'Red panda' },
  { id: 'blue', color: '#0071EB', glyph: '★', image: '/avatars/blue-robot.png', label: 'Blue robot' },
  { id: 'green', color: '#54B535', glyph: '◆', image: '/avatars/green-frog.png', label: 'Green frog' },
  { id: 'gold', color: '#F5C518', glyph: '●', image: '/avatars/gold-cat.png', label: 'Gold cat' },
  { id: 'purple', color: '#A855F7', glyph: '▲', image: '/avatars/purple-owl.png', label: 'Purple owl' },
  { id: 'orange', color: '#F97316', glyph: '◼', image: '/avatars/orange-tiger.png', label: 'Orange tiger' },
  { id: 'teal', color: '#14B8A6', glyph: '✦', image: '/avatars/teal-narwhal.png', label: 'Teal narwhal' },
  { id: 'kids', color: '#38BDF8', glyph: '☺', image: '/avatars/kids-sun.png', label: 'Sun' },
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

export function usesPersonalizedRecs<T extends Pick<Profile, 'personalizedRecs'>>(
  profile?: T | null,
): profile is T {
  return profile != null && profile.personalizedRecs !== false
}

export function avatarFor(profile: Pick<Profile, 'avatarId' | 'color'>): ProfileAvatar {
  return (
    PROFILE_AVATARS.find((avatar) => avatar.id === profile.avatarId) ?? {
      id: 'custom',
      color: profile.color,
      glyph: '▶',
      image: '',
      label: 'Profile',
    }
  )
}
