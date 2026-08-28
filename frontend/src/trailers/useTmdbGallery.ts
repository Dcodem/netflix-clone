import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { findTmdbGallery } from './tmdb'
import { envKeys } from './types'

const memory = new Map<string, string[]>()

function cacheId(title: string, year?: number | null, kind?: string) {
  return `flix.gallery.v1:${kind ?? 'movie'}:${title.toLowerCase()}:${year ?? ''}`
}

export function useTmdbGallery(item: { title?: string; year?: number | null; kind?: string } | null): string[] {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const title = item?.title ?? ''
  const cacheKey = cacheId(title, item?.year, item?.kind)
  const [stills, setStills] = useState<string[]>(() => memory.get(cacheKey) ?? [])

  useEffect(() => {
    if (!key || !title) {
      setStills([])
      return
    }
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached) as string[]
        if (Array.isArray(parsed) && parsed.length) {
          memory.set(cacheKey, parsed)
          setStills(parsed)
          return
        }
      }
    } catch {
      // ignore
    }
    if (memory.has(cacheKey)) {
      setStills(memory.get(cacheKey) ?? [])
      return
    }
    let cancelled = false
    findTmdbGallery({ title, year: item?.year, kind: item?.kind }, key)
      .then((result) => {
        memory.set(cacheKey, result)
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(result))
        } catch {
          // quota
        }
        if (!cancelled) setStills(result)
      })
      .catch(() => {
        memory.set(cacheKey, [])
        if (!cancelled) setStills([])
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, item?.kind, item?.year, key, title])

  return stills
}
