import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { findTmdbVideos, type TmdbVideoClip } from './tmdb'
import { envKeys } from './types'

const memory = new Map<string, TmdbVideoClip[]>()

function cacheId(title: string, year?: number | null, kind?: string) {
  return `flix.videos.v1:${kind ?? 'movie'}:${title.toLowerCase()}:${year ?? ''}`
}

export function useTmdbVideos(item: { title?: string; year?: number | null; kind?: string } | null): TmdbVideoClip[] {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const title = item?.title ?? ''
  const cacheKey = cacheId(title, item?.year, item?.kind)
  const [clips, setClips] = useState<TmdbVideoClip[]>(() => memory.get(cacheKey) ?? [])

  useEffect(() => {
    if (!key || !title) {
      setClips([])
      return
    }
    if (memory.has(cacheKey)) {
      setClips(memory.get(cacheKey) ?? [])
      return
    }
    let cancelled = false
    findTmdbVideos({ title, year: item?.year, kind: item?.kind }, key)
      .then((result) => {
        memory.set(cacheKey, result)
        if (!cancelled) setClips(result)
      })
      .catch(() => {
        memory.set(cacheKey, [])
        if (!cancelled) setClips([])
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, item?.kind, item?.year, key, title])

  return clips
}
