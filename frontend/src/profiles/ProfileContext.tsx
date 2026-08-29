import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { hashPassword, passwordsMatch } from '../auth/crypto'
import { useAuth } from '../auth/AuthContext'
import {
  HISTORY_LIMIT,
  PROFILE_AVATARS,
  PROFILE_LANGUAGES,
  PROFILE_MATURITY,
  STORAGE_KEY,
  type LikedTitle,
  type Profile,
  type ProfileLanguage,
  type ProfileMaturity,
  type ProfileStore,
  type WatchHistoryItem,
} from './types'

function emptyStore(): ProfileStore {
  return { profiles: [], activeProfileId: null }
}

function hydrateHistoryItem(raw: WatchHistoryItem): WatchHistoryItem {
  return {
    ...raw,
    episodeProgress:
      raw.episodeProgress && typeof raw.episodeProgress === 'object' ? raw.episodeProgress : {},
  }
}

function isLanguage(value: unknown): value is ProfileLanguage {
  return PROFILE_LANGUAGES.includes(value as ProfileLanguage)
}

function isMaturity(value: unknown): value is ProfileMaturity {
  return PROFILE_MATURITY.includes(value as ProfileMaturity)
}

function hydrateProfile(raw: Profile & { kids?: boolean }): Profile {
  const rest = { ...raw }
  delete rest.kids
  return {
    ...rest,
    history: Array.isArray(raw.history) ? raw.history.map(hydrateHistoryItem) : [],
    favoriteGenres: Array.isArray(raw.favoriteGenres) ? raw.favoriteGenres : [],
    liked: Array.isArray(raw.liked) ? raw.liked : [],
    lovedIds: Array.isArray(raw.lovedIds) ? raw.lovedIds : [],
    dislikedIds: Array.isArray(raw.dislikedIds) ? raw.dislikedIds : [],
    myList: Array.isArray(raw.myList) ? raw.myList : [],
    downloads: Array.isArray(raw.downloads) ? raw.downloads : [],
    hiddenContinueIds: Array.isArray(raw.hiddenContinueIds) ? raw.hiddenContinueIds : [],
    avatarId: raw.avatarId || 'red',
    pinSalt: raw.pinSalt ?? null,
    pinHash: raw.pinHash ?? null,
    autoplayNext: raw.autoplayNext !== false,
    autoplayPreview: raw.autoplayPreview !== false,
    language: isLanguage(raw.language) ? raw.language : 'English',
    maturity: isMaturity(raw.maturity) ? raw.maturity : 'All Maturity Ratings',
    color: raw.color || PROFILE_AVATARS[0].color,
  }
}

function parseStore(raw: string): ProfileStore | null {
  try {
    const parsed = JSON.parse(raw) as ProfileStore
    if (!Array.isArray(parsed.profiles)) return null
    return {
      profiles: parsed.profiles.map(hydrateProfile),
      activeProfileId: parsed.activeProfileId ?? null,
    }
  } catch {
    return null
  }
}

function keyFor(userId: string) {
  return `${STORAGE_KEY}.${userId}`
}

function loadStore(userId: string | null): ProfileStore {
  if (!userId) return emptyStore()
  const scoped = localStorage.getItem(keyFor(userId))
  if (!scoped) return emptyStore()
  return parseStore(scoped) ?? emptyStore()
}

function persist(userId: string, store: ProfileStore) {
  localStorage.setItem(keyFor(userId), JSON.stringify(store))
}

function nextAvatar(profiles: Profile[]) {
  return PROFILE_AVATARS[profiles.length % PROFILE_AVATARS.length]
}

export type CreateProfileOpts = {
  avatarId?: string
  pin?: string
}

export type UpdateProfileOpts = {
  name?: string
  avatarId?: string
  pin?: string | null
  autoplayNext?: boolean
  autoplayPreview?: boolean
  language?: ProfileLanguage
  maturity?: ProfileMaturity
}

type ProfileContextValue = {
  profiles: Profile[]
  activeProfile: Profile | null
  selectProfile: (id: string) => void
  createProfile: (name: string, opts?: CreateProfileOpts) => Promise<Profile>
  renameProfile: (id: string, name: string) => void
  updateProfile: (id: string, opts: UpdateProfileOpts) => Promise<void>
  deleteProfile: (id: string) => void
  recordWatch: (item: Omit<WatchHistoryItem, 'watchedAt'>) => void
  hideContinue: (id: string) => void
  setFavoriteGenres: (genres: string[]) => void
  rateTitle: (item: LikedTitle, direction: 'up' | 'love' | 'down' | null) => void
  toggleMyList: (item: LikedTitle) => void
  toggleDownload: (item: LikedTitle) => void
  unlockProfile: (id: string, pin: string) => Promise<boolean>
  clearActive: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [store, setStore] = useState<ProfileStore>(() => loadStore(userId))
  const [loadedFor, setLoadedFor] = useState(userId)
  if (loadedFor !== userId) {
    setLoadedFor(userId)
    setStore(loadStore(userId))
  }

  const updateStore = useCallback(
    (updater: (prev: ProfileStore) => ProfileStore) => {
      setStore((prev) => {
        const next = updater(prev)
        if (userId) persist(userId, next)
        return next
      })
    },
    [userId],
  )

  const selectProfile = useCallback(
    (id: string) => {
      updateStore((prev) => ({ ...prev, activeProfileId: id }))
    },
    [updateStore],
  )

  const createProfile = useCallback(
    async (name: string, opts: CreateProfileOpts = {}) => {
      const avatar = PROFILE_AVATARS.find((entry) => entry.id === opts.avatarId) ?? nextAvatar([])
      let pinSalt: string | null = null
      let pinHash: string | null = null
      if (opts.pin && /^\d{4}$/.test(opts.pin)) {
        const hashed = await hashPassword(opts.pin)
        pinSalt = hashed.salt
        pinHash = hashed.hash
      }
      const profile: Profile = {
        id: crypto.randomUUID(),
        name: name.trim() || 'Profile',
        color: avatar.color,
        avatarId: avatar.id,
        pinSalt,
        pinHash,
        autoplayNext: true,
        autoplayPreview: true,
        language: 'English',
        maturity: 'All Maturity Ratings',
        createdAt: Date.now(),
        history: [],
        favoriteGenres: [],
        liked: [],
        lovedIds: [],
        dislikedIds: [],
        myList: [],
        downloads: [],
        hiddenContinueIds: [],
      }
      updateStore((prev) => {
        const chosen =
          PROFILE_AVATARS.find((entry) => entry.id === opts.avatarId) ?? nextAvatar(prev.profiles)
        return {
          profiles: [
            ...prev.profiles,
            { ...profile, color: chosen.color, avatarId: chosen.id },
          ],
          activeProfileId: prev.activeProfileId,
        }
      })
      return profile
    },
    [updateStore],
  )

  const renameProfile = useCallback(
    (id: string, name: string) => {
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) =>
          profile.id === id ? { ...profile, name: name.trim() || profile.name } : profile,
        ),
      }))
    },
    [updateStore],
  )

  const updateProfile = useCallback(
    async (id: string, opts: UpdateProfileOpts) => {
      let pinSalt: string | null | undefined
      let pinHash: string | null | undefined
      if (opts.pin === null || opts.pin === '') {
        pinSalt = null
        pinHash = null
      } else if (opts.pin && /^\d{4}$/.test(opts.pin)) {
        const hashed = await hashPassword(opts.pin)
        pinSalt = hashed.salt
        pinHash = hashed.hash
      }
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) => {
          if (profile.id !== id) return profile
          const avatarId = opts.avatarId ?? profile.avatarId
          const avatar = PROFILE_AVATARS.find((entry) => entry.id === avatarId)
          return {
            ...profile,
            name: opts.name?.trim() || profile.name,
            avatarId: avatar?.id ?? profile.avatarId,
            color: avatar?.color ?? profile.color,
            autoplayNext: opts.autoplayNext ?? profile.autoplayNext,
            autoplayPreview: opts.autoplayPreview ?? profile.autoplayPreview,
            language: opts.language ?? profile.language,
            maturity: opts.maturity ?? profile.maturity,
            pinSalt: pinSalt !== undefined ? pinSalt : profile.pinSalt,
            pinHash: pinHash !== undefined ? pinHash : profile.pinHash,
          }
        }),
      }))
    },
    [updateStore],
  )

  const deleteProfile = useCallback(
    (id: string) => {
      updateStore((prev) => {
        const profiles = prev.profiles.filter((profile) => profile.id !== id)
        const activeProfileId =
          prev.activeProfileId === id ? (profiles[0]?.id ?? null) : prev.activeProfileId
        return { profiles, activeProfileId }
      })
    },
    [updateStore],
  )

  const recordWatch = useCallback(
    (item: Omit<WatchHistoryItem, 'watchedAt'>) => {
      updateStore((prev) => {
        if (!prev.activeProfileId) return prev
        return {
          ...prev,
          profiles: prev.profiles.map((profile) => {
            if (profile.id !== prev.activeProfileId) return profile
            const previous = profile.history.find((entry) => entry.id === item.id)
            const rest = profile.history.filter((entry) => entry.id !== item.id)
            const restart = item.progress === 0
            const episodeId = item.episodeId ?? previous?.episodeId ?? null
            const previousMap = previous?.episodeProgress ?? {}
            const prevEpisode = episodeId ? previousMap[episodeId] : undefined
            const switchedEpisode = Boolean(episodeId && previous?.episodeId && previous.episodeId !== episodeId)
            const progress = restart
              ? 0.01
              : (item.progress ??
                prevEpisode?.progress ??
                (switchedEpisode ? 0.08 : previous?.progress) ??
                0.08)
            const seasonNumber = item.seasonNumber ?? previous?.seasonNumber ?? null
            const episodeNumber = item.episodeNumber ?? previous?.episodeNumber ?? null
            const episodeProgress =
              episodeId && seasonNumber != null && episodeNumber != null
                ? {
                    ...previousMap,
                    [episodeId]: {
                      progress,
                      seasonNumber,
                      episodeNumber,
                      watchedAt: Date.now(),
                    },
                  }
                : previousMap
            const next: WatchHistoryItem = {
              ...previous,
              ...item,
              watchedAt: Date.now(),
              progress,
              runtime: item.runtime ?? previous?.runtime ?? null,
              seasonNumber,
              episodeNumber,
              episodeId,
              episodeProgress,
            }
            return {
              ...profile,
              hiddenContinueIds: profile.hiddenContinueIds.filter((id) => id !== item.id),
              history: [next, ...rest].slice(0, HISTORY_LIMIT),
            }
          }),
        }
      })
    },
    [updateStore],
  )

  const hideContinue = useCallback(
    (id: string) => {
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) =>
          profile.id === prev.activeProfileId
            ? { ...profile, hiddenContinueIds: [...new Set([id, ...profile.hiddenContinueIds])] }
            : profile,
        ),
      }))
    },
    [updateStore],
  )

  const setFavoriteGenres = useCallback(
    (genres: string[]) => {
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) =>
          profile.id === prev.activeProfileId ? { ...profile, favoriteGenres: [...new Set(genres)] } : profile,
        ),
      }))
    },
    [updateStore],
  )

  const rateTitle = useCallback(
    (item: LikedTitle, direction: 'up' | 'love' | 'down' | null) => {
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) => {
          if (profile.id !== prev.activeProfileId) return profile
          const liked = profile.liked.filter((entry) => entry.id !== item.id)
          const lovedIds = (profile.lovedIds ?? []).filter((entryId) => entryId !== item.id)
          const dislikedIds = profile.dislikedIds.filter((entryId) => entryId !== item.id)
          if (direction === 'up' || direction === 'love') liked.unshift(item)
          if (direction === 'love') lovedIds.unshift(item.id)
          if (direction === 'down') dislikedIds.unshift(item.id)
          return {
            ...profile,
            liked: liked.slice(0, HISTORY_LIMIT),
            lovedIds: lovedIds.slice(0, HISTORY_LIMIT),
            dislikedIds: dislikedIds.slice(0, HISTORY_LIMIT),
          }
        }),
      }))
    },
    [updateStore],
  )

  const toggleMyList = useCallback(
    (item: LikedTitle) => {
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) => {
          if (profile.id !== prev.activeProfileId) return profile
          const exists = profile.myList.some((entry) => entry.id === item.id)
          const myList = exists
            ? profile.myList.filter((entry) => entry.id !== item.id)
            : [item, ...profile.myList].slice(0, HISTORY_LIMIT)
          return { ...profile, myList }
        }),
      }))
    },
    [updateStore],
  )

  const toggleDownload = useCallback(
    (item: LikedTitle) => {
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) => {
          if (profile.id !== prev.activeProfileId) return profile
          const downloads = profile.downloads ?? []
          const exists = downloads.some((entry) => entry.id === item.id)
          return {
            ...profile,
            downloads: exists
              ? downloads.filter((entry) => entry.id !== item.id)
              : [item, ...downloads].slice(0, HISTORY_LIMIT),
          }
        }),
      }))
    },
    [updateStore],
  )

  const unlockProfile = useCallback(async (id: string, pin: string) => {
    const profile = store.profiles.find((entry) => entry.id === id)
    if (!profile?.pinHash || !profile.pinSalt) return false
    const ok = await passwordsMatch(pin, profile.pinSalt, profile.pinHash)
    if (ok) selectProfile(id)
    return ok
  }, [selectProfile, store.profiles])

  const clearActive = useCallback(() => {
    updateStore((prev) => ({ ...prev, activeProfileId: null }))
  }, [updateStore])

  const activeProfile = store.profiles.find((profile) => profile.id === store.activeProfileId) ?? null

  const value = useMemo(
    () => ({
      profiles: store.profiles,
      activeProfile,
      selectProfile,
      createProfile,
      renameProfile,
      updateProfile,
      deleteProfile,
      recordWatch,
      hideContinue,
      setFavoriteGenres,
      rateTitle,
      toggleMyList,
      toggleDownload,
      unlockProfile,
      clearActive,
    }),
    [
      store.profiles,
      activeProfile,
      selectProfile,
      createProfile,
      renameProfile,
      updateProfile,
      deleteProfile,
      recordWatch,
      hideContinue,
      setFavoriteGenres,
      rateTitle,
      toggleMyList,
      toggleDownload,
      unlockProfile,
      clearActive,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfiles(): ProfileContextValue {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfiles must be used within ProfileProvider')
  return value
}
