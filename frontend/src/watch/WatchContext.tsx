import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useProfiles } from '../profiles/ProfileContext'
import type { WatchHistoryItem } from '../profiles/types'

export type WatchSession = {
  href: string
  title: string
}

type WatchContextValue = {
  session: WatchSession | null
  openWatch: (href: string, title: string, history?: Omit<WatchHistoryItem, 'watchedAt'>) => void
  closeWatch: () => void
}

const WatchContext = createContext<WatchContextValue | null>(null)

export function WatchProvider({ children }: { children: ReactNode }) {
  const { recordWatch } = useProfiles()
  const [session, setSession] = useState<WatchSession | null>(null)

  const closeWatch = useCallback(() => {
    setSession(null)
  }, [])

  const openWatch = useCallback(
    (href: string, title: string, history?: Omit<WatchHistoryItem, 'watchedAt'>) => {
      if (!href) return
      setSession({ href, title })
      if (history) recordWatch(history)
    },
    [recordWatch],
  )

  useEffect(() => {
    if (!session) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWatch()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [session, closeWatch])

  const value = useMemo(
    () => ({ session, openWatch, closeWatch }),
    [session, openWatch, closeWatch],
  )

  return <WatchContext.Provider value={value}>{children}</WatchContext.Provider>
}

export function useWatch(): WatchContextValue {
  const value = useContext(WatchContext)
  if (!value) throw new Error('useWatch must be used within WatchProvider')
  return value
}
