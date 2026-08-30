import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { resolveWatchHref } from '../api/client'
import { useProfiles } from '../profiles/ProfileContext'
import type { WatchHistoryItem } from '../profiles/types'

export type WatchSession = {
  href: string
  title: string
  startedAt: number
  history?: Omit<WatchHistoryItem, 'watchedAt'>
}

type WatchContextValue = {
  session: WatchSession | null
  openWatch: (href: string, title: string, history?: Omit<WatchHistoryItem, 'watchedAt'>) => void
  closeWatch: () => void
  reportProgress: (progress: number) => void
}

const WatchContext = createContext<WatchContextValue | null>(null)

export function WatchProvider({ children }: { children: ReactNode }) {
  const { recordWatch } = useProfiles()
  const [session, setSession] = useState<WatchSession | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const progressRef = useRef(0)

  const closeWatch = useCallback(() => {
    const current = sessionRef.current
    if (current?.history) {
      recordWatch({
        ...current.history,
        progress: Math.min(0.96, Math.max(0.08, progressRef.current || current.history.progress || 0.08)),
      })
    }
    setSession(null)
  }, [recordWatch])

  const reportProgress = useCallback((progress: number) => {
    progressRef.current = Math.min(0.98, Math.max(0, progress))
  }, [])

  const openWatch = useCallback(
    (href: string, title: string, history?: Omit<WatchHistoryItem, 'watchedAt'>) => {
      if (!href) return
      progressRef.current = history?.progress ?? 0
      if (history) recordWatch({ ...history, progress: progressRef.current })
      setSession({ href: resolveWatchHref(href), title, startedAt: Date.now(), history })
    },
    [recordWatch],
  )

  useEffect(() => {
    if (!session) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented) return
      if (document.querySelector('.watch-overlay.is-pip')) return
      if (document.fullscreenElement) {
        void document.exitFullscreen()
        return
      }
      closeWatch()
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
    () => ({ session, openWatch, closeWatch, reportProgress }),
    [session, openWatch, closeWatch, reportProgress],
  )

  return <WatchContext.Provider value={value}>{children}</WatchContext.Provider>
}

export function useWatch(): WatchContextValue {
  const value = useContext(WatchContext)
  if (!value) throw new Error('useWatch must be used within WatchProvider')
  return value
}
