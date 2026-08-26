import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hashPassword, passwordsMatch } from '../auth/crypto'
import { useAuth } from '../auth/AuthContext'
import {
  HISTORY_LIMIT,
  PROFILE_AVATARS,
  STORAGE_KEY,
  type LikedTitle,
  type Profile,
  type ProfileStore,
  type WatchHistoryItem,
} from './types'

function emptyStore(): ProfileStore {
  return { profiles: [], activeProfileId: null }
}

function hydrateProfile(raw: Profile): Profile {
  return {
    ...raw,
    history: Array.isArray(raw.history) ? raw.history : [],
    favoriteGenres: Array.isArray(raw.favoriteGenres) ? raw.favoriteGenres : [],
    liked: Array.isArray(raw.liked) ? raw.liked : [],
    dislikedIds: Array.isArray(raw.dislikedIds) ? raw.dislikedIds : [],
    myList: Array.isArray(raw.myList) ? raw.myList : [],
    hiddenContinueIds: Array.isArray(raw.hiddenContinueIds) ? raw.hiddenContinueIds : [],
    kids: Boolean(raw.kids),
    avatarId: raw.avatarId || (raw.kids ? 'kids' : 'red'),
    pinSalt: raw.pinSalt ?? null,
    pinHash: raw.pinHash ?? null,
    color: raw.color || PROFILE_AVATARS[0].color,
  }
}

function keyFor(userId: string) {
  return `${STORAGE_KEY}.${userId}`
}

function loadStore(userId: string | null): ProfileStore {
  if (!userId) return emptyStore()
  try {
    const scoped = localStorage.getItem(keyFor(userId))
    const raw = scoped ?? localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as ProfileStore
    if (!Array.isArray(parsed.profiles)) return emptyStore()
    const store = {
      profiles: parsed.profiles.map(hydrateProfile),
      activeProfileId: parsed.activeProfileId ?? null,
    }
    if (!scoped) localStorage.setItem(keyFor(userId), JSON.stringify(store))
    return store
  } catch {
    return emptyStore()
  }
}

function persist(userId: string, store: ProfileStore) {
  localStorage.setItem(keyFor(userId), JSON.stringify(store))
}

function nextAvatar(profiles: Profile[], kids: boolean) {
  if (kids) return PROFILE_AVATARS.find((avatar) => avatar.id === 'kids') ?? PROFILE_AVATARS[0]
  return PROFILE_AVATARS[profiles.length % PROFILE_AVATARS.length]
}

export type CreateProfileOpts = {
  kids?: boolean
  avatarId?: string
  pin?: string
}

type ProfileContextValue = {
  profiles: Profile[]
  activeProfile: Profile | null
  selectProfile: (id: string) => void
  createProfile: (name: string, opts?: CreateProfileOpts) => Promise<Profile>
  renameProfile: (id: string, name: string) => void
  deleteProfile: (id: string) => void
  recordWatch: (item: Omit<WatchHistoryItem, 'watchedAt'>) => void
  hideContinue: (id: string) => void
  setFavoriteGenres: (genres: string[]) => void
  rateTitle: (item: LikedTitle, direction: 'up' | 'down' | null) => void
  toggleMyList: (item: LikedTitle) => void
  unlockProfile: (id: string, pin: string) => Promise<boolean>
  clearActive: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [store, setStore] = useState<ProfileStore>(() => loadStore(userId))

  useEffect(() => {
    setStore(loadStore(userId))
  }, [userId])

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
      const kids = Boolean(opts.kids)
      const avatar =
        PROFILE_AVATARS.find((entry) => entry.id === opts.avatarId) ?? nextAvatar([], kids)
      let pinSalt: string | null = null
      let pinHash: string | null = null
      if (opts.pin && /^\d{4}$/.test(opts.pin) && !kids) {
        const hashed = await hashPassword(opts.pin)
        pinSalt = hashed.salt
        pinHash = hashed.hash
      }
      const profile: Profile = {
        id: crypto.randomUUID(),
        name: name.trim() || (kids ? 'Kids' : 'Profile'),
        color: avatar.color,
        avatarId: avatar.id,
        kids,
        pinSalt,
        pinHash,
        createdAt: Date.now(),
        history: [],
        favoriteGenres: kids ? ['Family', 'Animation'] : [],
        liked: [],
        dislikedIds: [],
        myList: [],
        hiddenContinueIds: [],
      }
      updateStore((prev) => {
        const chosen =
          PROFILE_AVATARS.find((entry) => entry.id === opts.avatarId) ?? nextAvatar(prev.profiles, kids)
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
            const next: WatchHistoryItem = {
              ...previous,
              ...item,
              watchedAt: Date.now(),
              progress: restart ? 0.01 : (item.progress ?? previous?.progress ?? 0.08),
              runtime: item.runtime ?? previous?.runtime ?? null,
              seasonNumber: item.seasonNumber ?? previous?.seasonNumber ?? null,
              episodeNumber: item.episodeNumber ?? previous?.episodeNumber ?? null,
              episodeId: item.episodeId ?? previous?.episodeId ?? null,
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
    (item: LikedTitle, direction: 'up' | 'down' | null) => {
      updateStore((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) => {
          if (profile.id !== prev.activeProfileId) return profile
          const liked = profile.liked.filter((entry) => entry.id !== item.id)
          const dislikedIds = profile.dislikedIds.filter((entryId) => entryId !== item.id)
          if (direction === 'up') liked.unshift(item)
          if (direction === 'down') dislikedIds.unshift(item.id)
          return { ...profile, liked: liked.slice(0, HISTORY_LIMIT), dislikedIds: dislikedIds.slice(0, HISTORY_LIMIT) }
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
      deleteProfile,
      recordWatch,
      hideContinue,
      setFavoriteGenres,
      rateTitle,
      toggleMyList,
      unlockProfile,
      clearActive,
    }),
    [
      store.profiles,
      activeProfile,
      selectProfile,
      createProfile,
      renameProfile,
      deleteProfile,
      recordWatch,
      hideContinue,
      setFavoriteGenres,
      rateTitle,
      toggleMyList,
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
