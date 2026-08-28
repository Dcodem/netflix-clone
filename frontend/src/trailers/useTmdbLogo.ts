import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { findTmdbLogo } from './tmdb'
import { envKeys } from './types'

const memory = new Map<string, string | null>()

function cacheId(title: string, year?: number | null, kind?: string) {
  return `flix.logo.v1:${kind ?? 'movie'}:${title.toLowerCase()}:${year ?? ''}`
}

export function useTmdbLogo(item: { title: string; year?: number | null; kind?: string }): string | null {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const cacheKey = cacheId(item.title, item.year, item.kind)
  const [logo, setLogo] = useState<string | null>(() => memory.get(cacheKey) ?? null)

  useEffect(() => {
    if (!key) return
    if (memory.has(cacheKey)) {
      setLogo(memory.get(cacheKey) ?? null)
      return
    }
    let cancelled = false
    findTmdbLogo({ title: item.title, year: item.year, kind: item.kind }, key)
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
  }, [cacheKey, item.kind, item.title, item.year, key])

  return logo
}
