export type AccountDevice = {
  id: string
  label: string
  lastUsed: number
}

export type CommunicationPrefs = {
  offers: boolean
  news: boolean
  recs: boolean
}

export const DEFAULT_COMMS: CommunicationPrefs = {
  offers: true,
  news: true,
  recs: true,
}

export function commsFor(user: { comms?: Partial<CommunicationPrefs> } | null | undefined): CommunicationPrefs {
  return {
    offers: user?.comms?.offers !== false,
    news: user?.comms?.news !== false,
    recs: user?.comms?.recs !== false,
  }
}

export type UserAccount = {
  id: string
  email: string
  name: string
  passwordSalt: string
  passwordHash: string
  createdAt: number
  ivaKey: string
  tmdbKey: string
  phone?: string | null
  planId?: 'standard' | 'premium' | 'basic'
  paymentBrand?: string | null
  paymentLast4?: string | null
  giftBalance?: number
  giftCodes?: string[]
  devices?: AccountDevice[]
  comms?: CommunicationPrefs
  tests?: boolean
  extraMembers?: ExtraMember[]
  referralCode?: string
}

export type ExtraMember = {
  id: string
  name: string
  email: string
  addedAt: number
}

export function testsOn(user: { tests?: boolean } | null | undefined) {
  return user?.tests !== false
}

export function extraMembersFor(user: { extraMembers?: ExtraMember[] } | null | undefined) {
  return user?.extraMembers ?? []
}

export function extraMemberSlots(planId?: UserAccount['planId'] | null) {
  if (planId === 'premium') return 2
  if (planId === 'standard') return 1
  return 0
}

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeReferralCode() {
  let raw = ''
  for (let i = 0; i < 8; i += 1) raw += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)]
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

export function isReferralCode(value: string | null | undefined) {
  return Boolean(value && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value))
}

export type AuthStore = {
  users: UserAccount[]
  sessionUserId: string | null
}

export const AUTH_STORAGE_KEY = 'flix.auth.v1'
