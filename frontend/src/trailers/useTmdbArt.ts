import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { needsPlaceholderArt } from '../lib/netflix'
import { findTmdbArt, type TmdbArt } from './tmdb'
import { envKeys } from './types'
import { useKeyedState } from '../hooks/useKeyedState'

const memory = new Map<string, TmdbArt | null>()
const EMPTY_ART: TmdbArt = { poster: null, backdrop: null }

function cacheId(item: { title: string; year?: number | null; kind?: string; tmdb_id?: number | string | null }) {
  return `flix.art.v1:${item.kind ?? 'movie'}:${item.tmdb_id ?? ''}:${item.title.toLowerCase()}:${item.year ?? ''}`
}

export function useTmdbArt(item: {
  title: string
  year?: number | null
  kind?: string
  tmdb_id?: number | string | null
  poster_url?: string | null
  backdrop_url?: string | null
}): TmdbArt {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const cacheKey = cacheId(item)
  const skip = !item.title
  const [art, setArt] = useKeyedState<TmdbArt>(cacheKey, memory.get(cacheKey) ?? EMPTY_ART)

  useEffect(() => {
    if (skip) return
    if (memory.has(cacheKey)) {
      setArt(memory.get(cacheKey) ?? EMPTY_ART)
      return
    }
    let cancelled = false
    findTmdbArt({ title: item.title, year: item.year, kind: item.kind, tmdb_id: item.tmdb_id }, key)
      .then((result) => {
        memory.set(cacheKey, result)
        if (!cancelled) setArt(result ?? EMPTY_ART)
      })
      .catch(() => {
        memory.set(cacheKey, null)
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, item.kind, item.title, item.tmdb_id, item.year, key, skip])

  return {
    poster: art.poster || (needsPlaceholderArt(item.poster_url) ? null : item.poster_url) || null,
    backdrop: art.backdrop || (needsPlaceholderArt(item.backdrop_url ?? null) ? null : item.backdrop_url) || null,
  }
}
