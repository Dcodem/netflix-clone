import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { findTmdbInfo, type TmdbInfo } from './tmdb'
import { envKeys } from './types'
import { useKeyedState } from '../hooks/useKeyedState'

const memory = new Map<string, TmdbInfo | null>()

function cacheId(item: { title?: string; year?: number | null; kind?: string; tmdb_id?: number | string | null }) {
  return `flix.info.v1:${item.kind ?? 'movie'}:${item.tmdb_id ?? ''}:${(item.title ?? '').toLowerCase()}:${item.year ?? ''}`
}

export function useTmdbInfo(item: {
  title?: string
  year?: number | null
  kind?: string
  tmdb_id?: number | string | null
} | null): TmdbInfo | null {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const title = item?.title ?? ''
  const cacheKey = cacheId(item ?? {})
  const [info, setInfo] = useKeyedState<TmdbInfo | null>(cacheKey, memory.get(cacheKey) ?? null)

  useEffect(() => {
    if (!title) {
      setInfo(null)
      return
    }
    if (memory.has(cacheKey)) {
      setInfo(memory.get(cacheKey) ?? null)
      return
    }
    let cancelled = false
    findTmdbInfo({ title, year: item?.year, kind: item?.kind, tmdb_id: item?.tmdb_id }, key)
      .then((result) => {
        memory.set(cacheKey, result)
        if (!cancelled) setInfo(result)
      })
      .catch(() => {
        memory.set(cacheKey, null)
        if (!cancelled) setInfo(null)
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, item?.kind, item?.tmdb_id, item?.year, key, title])

  return info
}
