import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { MovieListItem } from '../api/types'

type TitleModalContextValue = {
  item: MovieListItem | null
  openTitle: (item: MovieListItem) => void
  closeTitle: () => void
}

const TitleModalContext = createContext<TitleModalContextValue | null>(null)

export function TitleModalProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<MovieListItem | null>(null)
  const openTitle = useCallback((next: MovieListItem) => setItem(next), [])
  const closeTitle = useCallback(() => setItem(null), [])
  const value = useMemo(() => ({ item, openTitle, closeTitle }), [item, openTitle, closeTitle])
  return <TitleModalContext.Provider value={value}>{children}</TitleModalContext.Provider>
}

export function useTitleModal(): TitleModalContextValue {
  const value = useContext(TitleModalContext)
  if (!value) throw new Error('useTitleModal must be used within TitleModalProvider')
  return value
}
