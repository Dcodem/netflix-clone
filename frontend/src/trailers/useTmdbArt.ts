import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { needsPlaceholderArt } from '../lib/netflix'
import { findTmdbArt, type TmdbArt } from './tmdb'
import { envKeys } from './types'

const memory = new Map<string, TmdbArt | null>()

function cacheId(title: string, year?: number | null, kind?: string) {
  return `flix.art.v1:${kind ?? 'movie'}:${title.toLowerCase()}:${year ?? ''}`
}

export function useTmdbArt(item: {
  title: string
  year?: number | null
  kind?: string
  poster_url?: string | null
  backdrop_url?: string | null
}): TmdbArt {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const cacheKey = cacheId(item.title, item.year, item.kind)
  const skip = !key || (!needsPlaceholderArt(item.poster_url) && !needsPlaceholderArt(item.backdrop_url ?? null))
  const [art, setArt] = useState<TmdbArt>(() => memory.get(cacheKey) ?? { poster: null, backdrop: null })

  useEffect(() => {
    if (skip) return
    if (memory.has(cacheKey)) {
      setArt(memory.get(cacheKey) ?? { poster: null, backdrop: null })
      return
    }
    let cancelled = false
    findTmdbArt({ title: item.title, year: item.year, kind: item.kind }, key)
      .then((result) => {
        memory.set(cacheKey, result)
        if (!cancelled) setArt(result ?? { poster: null, backdrop: null })
      })
      .catch(() => {
        memory.set(cacheKey, null)
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, item.kind, item.title, item.year, key, skip])

  return {
    poster: art.poster || (needsPlaceholderArt(item.poster_url) ? null : item.poster_url) || null,
    backdrop: art.backdrop || (needsPlaceholderArt(item.backdrop_url ?? null) ? null : item.backdrop_url) || null,
  }
}
