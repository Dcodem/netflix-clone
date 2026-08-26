import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  HISTORY_LIMIT,
  PROFILE_COLORS,
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

function nextColor(profiles: Profile[]): string {
  return PROFILE_COLORS[profiles.length % PROFILE_COLORS.length]
}

type ProfileContextValue = {
  profiles: Profile[]
  activeProfile: Profile | null
  selectProfile: (id: string) => void
  createProfile: (name: string) => Profile
  renameProfile: (id: string, name: string) => void
  deleteProfile: (id: string) => void
  recordWatch: (item: Omit<WatchHistoryItem, 'watchedAt'>) => void
  setFavoriteGenres: (genres: string[]) => void
  rateTitle: (item: LikedTitle, direction: 'up' | 'down' | null) => void
  toggleMyList: (item: LikedTitle) => void
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
    (name: string) => {
      const profile: Profile = {
        id: crypto.randomUUID(),
        name: name.trim() || 'Profile',
        color: PROFILE_COLORS[0],
        createdAt: Date.now(),
        history: [],
        favoriteGenres: [],
        liked: [],
        dislikedIds: [],
        myList: [],
      }
      updateStore((prev) => ({
        profiles: [...prev.profiles, { ...profile, color: nextColor(prev.profiles) }],
        activeProfileId: prev.activeProfileId,
      }))
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
            const next: WatchHistoryItem = {
              ...previous,
              ...item,
              watchedAt: Date.now(),
              progress: item.progress ?? previous?.progress ?? 0.08,
              runtime: item.runtime ?? previous?.runtime ?? null,
            }
            return { ...profile, history: [next, ...rest].slice(0, HISTORY_LIMIT) }
          }),
        }
      })
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
          const dislikedIds = profile.dislikedIds.filter((id) => id !== item.id)
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
      setFavoriteGenres,
      rateTitle,
      toggleMyList,
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
      setFavoriteGenres,
      rateTitle,
      toggleMyList,
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
