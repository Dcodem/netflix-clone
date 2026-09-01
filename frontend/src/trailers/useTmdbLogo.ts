import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { findTmdbLogo } from './tmdb'
import { envKeys } from './types'
import { useKeyedState } from '../hooks/useKeyedState'

const memory = new Map<string, string | null>()

function cacheId(item: { title: string; year?: number | null; kind?: string; tmdb_id?: number | string | null }) {
  return `flix.logo.v1:${item.kind ?? 'movie'}:${item.tmdb_id ?? ''}:${item.title.toLowerCase()}:${item.year ?? ''}`
}

export function useTmdbLogo(item: {
  title: string
  year?: number | null
  kind?: string
  tmdb_id?: number | string | null
}): string | null {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const cacheKey = cacheId(item)
  const [logo, setLogo] = useKeyedState<string | null>(cacheKey, memory.get(cacheKey) ?? null)

  useEffect(() => {
    if (!item.title) return
    if (memory.has(cacheKey)) {
      setLogo(memory.get(cacheKey) ?? null)
      return
    }
    let cancelled = false
    findTmdbLogo({ title: item.title, year: item.year, kind: item.kind, tmdb_id: item.tmdb_id }, key)
      .then((result) => {
        memory.set(cacheKey, result)
        if (!cancelled) setLogo(result)
      })
      .catch(() => {
        memory.set(cacheKey, null)
        if (!cancelled) setLogo(null)
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, item.kind, item.title, item.tmdb_id, item.year, key])

  return logo
}
