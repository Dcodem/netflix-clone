import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useProfiles } from './ProfileContext'
import { STORAGE_KEY } from './types'

const COOKIE_NAME = 'flix.recovery'
const COOKIE_MAX_AGE = 365 * 24 * 3600

/**
 * Reads the FLIX recovery cookie (if any) and returns its backup ID.
 */
function scopedKey(userId: string) {
  return `${STORAGE_KEY}.${userId}`
}

export function readRecoveryCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)flix\.recovery=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function writeRecoveryCookie(id: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    id,
  )}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`
}

/**
 * Mirrors the profile store into a long-lived cookie + a backend backup so
 * the user can recover profiles, watch history, and continue-watching on any
 * device. Uploads are debounced (5s) and only fire when the store changes.
 */
export function useProfileSync() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { setStoreFromBackup } = useProfiles()
  const restoringRef = useRef(false)
  const lastUploaded = useRef('')

  // Restore once on mount: no local store but a recovery cookie → pull.
  useEffect(() => {
    const id = readRecoveryCookie()
    if (!id || !userId) return
    if (localStorage.getItem(scopedKey(userId))) return // already local
    restoringRef.current = true
    fetch(`/profile/backup/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (data?.store) setStoreFromBackup(data.store)
      })
      .catch(() => {
        /* no backup — start fresh */
      })
      .finally(() => {
        restoringRef.current = false
      })
  }, [userId, setStoreFromBackup])

  // Backup on change (debounced).
  useEffect(() => {
    if (!userId) return
    const id = readRecoveryCookie() || crypto.randomUUID()
    writeRecoveryCookie(id)
    const t = window.setTimeout(() => {
      const raw = localStorage.getItem(scopedKey(userId))
      if (!raw) return
      if (raw === lastUploaded.current) return
      lastUploaded.current = raw
      fetch('/profile/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_id: id, store: JSON.parse(raw) }),
      }).catch(() => {
        /* backup is best-effort; localStorage remains the primary store */
      })
    }, 5000)
    return () => window.clearTimeout(t)
  }, [userId])
}
