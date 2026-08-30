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
}

export type AuthStore = {
  users: UserAccount[]
  sessionUserId: string | null
}

export const AUTH_STORAGE_KEY = 'flix.auth.v1'
