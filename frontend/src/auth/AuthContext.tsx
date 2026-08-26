import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { hashPassword, passwordsMatch } from './crypto'
import { AUTH_STORAGE_KEY, type AuthStore, type UserAccount } from './types'

function emptyStore(): AuthStore {
  return { users: [], sessionUserId: null }
}

function loadStore(): AuthStore {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as AuthStore
    if (!Array.isArray(parsed.users)) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function persist(store: AuthStore) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(store))
}

function publicUser(user: UserAccount): UserAccount {
  return user
}

type AuthContextValue = {
  user: UserAccount | null
  signup: (input: { email: string; name: string; password: string }) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateKeys: (keys: { ivaKey?: string; tmdbKey?: string }) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<AuthStore>(loadStore)

  const updateStore = useCallback((updater: (prev: AuthStore) => AuthStore) => {
    setStore((prev) => {
      const next = updater(prev)
      persist(next)
      return next
    })
  }, [])

  const signup = useCallback(
    async ({ email, name, password }: { email: string; name: string; password: string }) => {
      const normalized = email.trim().toLowerCase()
      if (!normalized || !normalized.includes('@')) throw new Error('Enter a valid email')
      if (password.length < 6) throw new Error('Password must be at least 6 characters')
      const existing = loadStore()
      if (existing.users.some((user) => user.email === normalized)) {
        throw new Error('An account with that email already exists')
      }
      const hashed = await hashPassword(password)
      const user: UserAccount = {
        id: crypto.randomUUID(),
        email: normalized,
        name: name.trim() || normalized.split('@')[0],
        passwordSalt: hashed.salt,
        passwordHash: hashed.hash,
        createdAt: Date.now(),
        ivaKey: '',
        tmdbKey: '',
      }
      updateStore((prev) => ({
        users: [...prev.users, user],
        sessionUserId: user.id,
      }))
    },
    [updateStore],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase()
      const current = loadStore()
      const user = current.users.find((entry) => entry.email === normalized)
      if (!user || !(await passwordsMatch(password, user.passwordSalt, user.passwordHash))) {
        throw new Error('Email or password is incorrect')
      }
      updateStore((prev) => ({ ...prev, sessionUserId: user.id }))
    },
    [updateStore],
  )

  const logout = useCallback(() => {
    updateStore((prev) => ({ ...prev, sessionUserId: null }))
  }, [updateStore])

  const updateKeys = useCallback(
    (keys: { ivaKey?: string; tmdbKey?: string }) => {
      updateStore((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user.id === prev.sessionUserId
            ? {
                ...user,
                ivaKey: keys.ivaKey ?? user.ivaKey,
                tmdbKey: keys.tmdbKey ?? user.tmdbKey,
              }
            : user,
        ),
      }))
    },
    [updateStore],
  )

  const user = store.users.find((entry) => entry.id === store.sessionUserId) ?? null

  const value = useMemo(
    () => ({ user: user ? publicUser(user) : null, signup, login, logout, updateKeys }),
    [user, signup, login, logout, updateKeys],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
