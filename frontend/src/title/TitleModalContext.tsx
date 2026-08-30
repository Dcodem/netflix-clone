import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getMovie, getShow } from '../api/client'
import type { MovieListItem } from '../api/types'

type TitleModalContextValue = {
  item: MovieListItem | null
  openTitle: (item: MovieListItem) => void
  closeTitle: () => void
}

const TitleModalContext = createContext<TitleModalContextValue | null>(null)

async function loadTitle(id: string): Promise<MovieListItem | null> {
  const [movie, show] = await Promise.all([getMovie(id).catch(() => null), getShow(id).catch(() => null)])
  return movie ?? show
}

export function titleHref(id: string, extra: URLSearchParams | string = '') {
  const params = new URLSearchParams(extra)
  params.set('jbv', id)
  return `/browse?${params.toString()}`
}

export function TitleModalProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<MovieListItem | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const jbv = params.get('jbv')
  const cacheRef = useRef(new Map<string, MovieListItem>())
  const itemRef = useRef(item)
  itemRef.current = item

  const openTitle = useCallback(
    (next: MovieListItem) => {
      cacheRef.current.set(next.id, next)
      const nextParams = new URLSearchParams(location.search)
      if (nextParams.get('jbv') === next.id) {
        setItem(next)
        return
      }
      const replacing = Boolean(nextParams.get('jbv'))
      nextParams.set('jbv', next.id)
      navigate(`${location.pathname}?${nextParams.toString()}`, { replace: replacing })
    },
    [location.pathname, location.search, navigate],
  )

  const closeTitle = useCallback(() => {
    const nextParams = new URLSearchParams(location.search)
    if (!nextParams.get('jbv')) {
      setItem(null)
      return
    }
    nextParams.delete('jbv')
    const search = nextParams.toString()
    navigate(`${location.pathname}${search ? `?${search}` : ''}`, { replace: true })
    setItem(null)
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (!jbv) {
      if (itemRef.current) setItem(null)
      return
    }
    if (itemRef.current?.id === jbv) return
    const cached = cacheRef.current.get(jbv)
    if (cached) {
      setItem(cached)
      return
    }
    let cancelled = false
    void loadTitle(jbv).then((found) => {
      if (cancelled || !found) return
      cacheRef.current.set(found.id, found)
      setItem(found)
    })
    return () => {
      cancelled = true
    }
  }, [jbv])

  const value = useMemo(() => ({ item, openTitle, closeTitle }), [item, openTitle, closeTitle])
  return <TitleModalContext.Provider value={value}>{children}</TitleModalContext.Provider>
}

export function useTitleModal(): TitleModalContextValue {
  const value = useContext(TitleModalContext)
  if (!value) throw new Error('useTitleModal must be used within TitleModalProvider')
  return value
}
