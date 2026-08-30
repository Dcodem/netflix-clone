import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hashPassword, passwordsMatch } from './crypto'
import { currentDeviceId, currentDeviceLabel, upsertCurrentDevice } from './device'
import {
  AUTH_STORAGE_KEY,
  commsFor,
  extraMemberSlots,
  extraMembersFor,
  isReferralCode,
  makeReferralCode,
  type AuthStore,
  type CommunicationPrefs,
  type ExtraMember,
  type UserAccount,
} from './types'

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
  updateAccount: (opts: {
    email?: string
    password?: string
    phone?: string | null
    planId?: UserAccount['planId']
    paymentBrand?: string | null
    paymentLast4?: string | null
    comms?: Partial<CommunicationPrefs>
    tests?: boolean
  }) => Promise<void>
  redeemGift: (code: string) => Promise<number>
  addExtraMember: (input: { name: string; email: string }) => Promise<ExtraMember>
  removeExtraMember: (id: string) => void
  ensureReferralCode: () => string
  signOutDevice: (deviceId: string) => void
  signOutOtherDevices: () => void
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

  const updateAccount = useCallback(
    async (opts: {
      email?: string
      password?: string
      phone?: string | null
      planId?: UserAccount['planId']
      paymentBrand?: string | null
      paymentLast4?: string | null
      comms?: Partial<CommunicationPrefs>
      tests?: boolean
    }) => {
      const current = loadStore()
      const sessionId = current.sessionUserId
      if (!sessionId) throw new Error('Sign in to change account details.')
      let email = opts.email?.trim().toLowerCase()
      if (email !== undefined) {
        if (!email || !email.includes('@')) throw new Error('Enter a valid email')
        if (current.users.some((entry) => entry.id !== sessionId && entry.email === email)) {
          throw new Error('An account with that email already exists')
        }
      }
      let passwordSalt: string | undefined
      let passwordHash: string | undefined
      if (opts.password !== undefined) {
        if (opts.password.length < 6) throw new Error('Password must be at least 6 characters')
        const hashed = await hashPassword(opts.password)
        passwordSalt = hashed.salt
        passwordHash = hashed.hash
      }
      updateStore((prev) => ({
        ...prev,
        users: prev.users.map((user) => {
          if (user.id !== prev.sessionUserId) return user
          return {
            ...user,
            email: email ?? user.email,
            phone: opts.phone !== undefined ? opts.phone : user.phone,
            planId: opts.planId ?? user.planId,
            paymentBrand: opts.paymentBrand !== undefined ? opts.paymentBrand : user.paymentBrand,
            paymentLast4: opts.paymentLast4 !== undefined ? opts.paymentLast4 : user.paymentLast4,
            comms: opts.comms ? { ...commsFor(user), ...opts.comms } : user.comms,
            tests: opts.tests !== undefined ? opts.tests : user.tests,
            passwordSalt: passwordSalt ?? user.passwordSalt,
            passwordHash: passwordHash ?? user.passwordHash,
          }
        }),
      }))
    },
    [updateStore],
  )

  const redeemGift = useCallback(
    async (raw: string) => {
      const code = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      if (code.length < 8 || code.length > 16) throw new Error('Enter a valid gift or promo code')
      const current = loadStore()
      const sessionId = current.sessionUserId
      if (!sessionId) throw new Error('Sign in to redeem a gift card.')
      const user = current.users.find((entry) => entry.id === sessionId)
      if (!user) throw new Error('Sign in to redeem a gift card.')
      if ((user.giftCodes ?? []).includes(code)) throw new Error('This code has already been redeemed')
      let hash = 2166136261
      for (let i = 0; i < code.length; i += 1) {
        hash ^= code.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
      }
      const amount = [15, 25, 30, 50][(hash >>> 0) % 4]
      updateStore((prev) => ({
        ...prev,
        users: prev.users.map((entry) => {
          if (entry.id !== prev.sessionUserId) return entry
          const used = entry.giftCodes ?? []
          return {
            ...entry,
            giftBalance: (entry.giftBalance ?? 0) + amount,
            giftCodes: [...used, code].slice(-20),
          }
        }),
      }))
      return amount
    },
    [updateStore],
  )

  const addExtraMember = useCallback(
    async ({ name, email }: { name: string; email: string }) => {
      const trimmedName = name.trim()
      const normalized = email.trim().toLowerCase()
      if (!trimmedName) throw new Error('Enter a name')
      if (trimmedName.length > 40) throw new Error('Use a shorter name')
      if (!normalized || !normalized.includes('@')) throw new Error('Enter a valid email')
      const current = loadStore()
      const sessionId = current.sessionUserId
      if (!sessionId) throw new Error('Sign in to add an extra member.')
      const user = current.users.find((entry) => entry.id === sessionId)
      if (!user) throw new Error('Sign in to add an extra member.')
      if (normalized === user.email) throw new Error('Use an email that is not already on this account')
      const members = extraMembersFor(user)
      if (members.some((member) => member.email === normalized)) {
        throw new Error('That extra member is already on this account')
      }
      const slots = extraMemberSlots(user.planId)
      if (slots < 1) throw new Error('Extra members are not included on this plan')
      if (members.length >= slots) throw new Error('All extra member spots are used on this plan')
      const member: ExtraMember = {
        id: crypto.randomUUID(),
        name: trimmedName,
        email: normalized,
        addedAt: Date.now(),
      }
      updateStore((prev) => ({
        ...prev,
        users: prev.users.map((entry) => {
          if (entry.id !== prev.sessionUserId) return entry
          return { ...entry, extraMembers: [...extraMembersFor(entry), member] }
        }),
      }))
      return member
    },
    [updateStore],
  )

  const removeExtraMember = useCallback(
    (id: string) => {
      updateStore((prev) => ({
        ...prev,
        users: prev.users.map((entry) => {
          if (entry.id !== prev.sessionUserId) return entry
          return { ...entry, extraMembers: extraMembersFor(entry).filter((member) => member.id !== id) }
        }),
      }))
    },
    [updateStore],
  )

  const ensureReferralCode = useCallback(() => {
    const current = loadStore()
    const user = current.users.find((entry) => entry.id === current.sessionUserId)
    if (!user) return ''
    if (isReferralCode(user.referralCode)) return user.referralCode as string
    const next = makeReferralCode()
    updateStore((prev) => ({
      ...prev,
      users: prev.users.map((entry) => {
        if (entry.id !== prev.sessionUserId) return entry
        if (isReferralCode(entry.referralCode)) return entry
        return { ...entry, referralCode: next }
      }),
    }))
    return next
  }, [updateStore])

  const touchDevice = useCallback(() => {
    updateStore((prev) => ({
      ...prev,
      users: prev.users.map((entry) => {
        if (entry.id !== prev.sessionUserId) return entry
        return { ...entry, devices: upsertCurrentDevice(entry.devices) }
      }),
    }))
  }, [updateStore])

  const signOutDevice = useCallback(
    (deviceId: string) => {
      const currentId = currentDeviceId()
      if (deviceId === currentId) return
      updateStore((prev) => ({
        ...prev,
        users: prev.users.map((entry) => {
          if (entry.id !== prev.sessionUserId) return entry
          return { ...entry, devices: (entry.devices ?? []).filter((device) => device.id !== deviceId) }
        }),
      }))
    },
    [updateStore],
  )

  const signOutOtherDevices = useCallback(() => {
    const currentId = currentDeviceId()
    updateStore((prev) => ({
      ...prev,
      users: prev.users.map((entry) => {
        if (entry.id !== prev.sessionUserId) return entry
        return {
          ...entry,
          devices: upsertCurrentDevice((entry.devices ?? []).filter((device) => device.id === currentId)),
        }
      }),
    }))
  }, [updateStore])

  const user = store.users.find((entry) => entry.id === store.sessionUserId) ?? null

  useEffect(() => {
    if (!user) return
    const id = currentDeviceId()
    const label = currentDeviceLabel()
    const existing = user.devices?.find((device) => device.id === id)
    if (existing && existing.label === label && Date.now() - existing.lastUsed < 60_000) return
    touchDevice()
  }, [user, touchDevice])

  const value = useMemo(
    () => ({
      user: user ? publicUser(user) : null,
      signup,
      login,
      logout,
      updateKeys,
      updateAccount,
      redeemGift,
      addExtraMember,
      removeExtraMember,
      ensureReferralCode,
      signOutDevice,
      signOutOtherDevices,
    }),
    [
      user,
      signup,
      login,
      logout,
      updateKeys,
      updateAccount,
      redeemGift,
      addExtraMember,
      removeExtraMember,
      ensureReferralCode,
      signOutDevice,
      signOutOtherDevices,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
