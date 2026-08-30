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
}

export type AuthStore = {
  users: UserAccount[]
  sessionUserId: string | null
}

export const AUTH_STORAGE_KEY = 'flix.auth.v1'
