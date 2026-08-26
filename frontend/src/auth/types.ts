export type UserAccount = {
  id: string
  email: string
  name: string
  passwordSalt: string
  passwordHash: string
  createdAt: number
  ivaKey: string
  tmdbKey: string
}

export type AuthStore = {
  users: UserAccount[]
  sessionUserId: string | null
}

export const AUTH_STORAGE_KEY = 'flix.auth.v1'
