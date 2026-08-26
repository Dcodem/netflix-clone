import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { HISTORY_LIMIT, PROFILE_COLORS, STORAGE_KEY, type Profile, type ProfileStore, type WatchHistoryItem } from './types'

function emptyStore(): ProfileStore {
  return { profiles: [], activeProfileId: null }
}

function loadStore(): ProfileStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as ProfileStore
    if (!Array.isArray(parsed.profiles)) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function persist(store: ProfileStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
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
  clearActive: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ProfileStore>(loadStore)

  const commit = useCallback((next: ProfileStore) => {
    persist(next)
    setStore(next)
  }, [])

  const selectProfile = useCallback(
    (id: string) => {
      commit({ ...store, activeProfileId: id })
    },
    [commit, store],
  )

  const createProfile = useCallback(
    (name: string) => {
      const profile: Profile = {
        id: crypto.randomUUID(),
        name: name.trim() || 'Profile',
        color: nextColor(store.profiles),
        createdAt: Date.now(),
        history: [],
      }
      commit({
        profiles: [...store.profiles, profile],
        activeProfileId: profile.id,
      })
      return profile
    },
    [commit, store],
  )

  const renameProfile = useCallback(
    (id: string, name: string) => {
      commit({
        ...store,
        profiles: store.profiles.map((profile) =>
          profile.id === id ? { ...profile, name: name.trim() || profile.name } : profile,
        ),
      })
    },
    [commit, store],
  )

  const deleteProfile = useCallback(
    (id: string) => {
      const profiles = store.profiles.filter((profile) => profile.id !== id)
      const activeProfileId =
        store.activeProfileId === id ? (profiles[0]?.id ?? null) : store.activeProfileId
      commit({ profiles, activeProfileId })
    },
    [commit, store],
  )

  const recordWatch = useCallback(
    (item: Omit<WatchHistoryItem, 'watchedAt'>) => {
      if (!store.activeProfileId) return
      commit({
        ...store,
        profiles: store.profiles.map((profile) => {
          if (profile.id !== store.activeProfileId) return profile
          const rest = profile.history.filter((entry) => entry.id !== item.id)
          const next: WatchHistoryItem = { ...item, watchedAt: Date.now() }
          return { ...profile, history: [next, ...rest].slice(0, HISTORY_LIMIT) }
        }),
      })
    },
    [commit, store],
  )

  const clearActive = useCallback(() => {
    commit({ ...store, activeProfileId: null })
  }, [commit, store])

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
