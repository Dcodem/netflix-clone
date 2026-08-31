import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { findTmdbVideos, type TmdbVideoClip } from './tmdb'
import { envKeys } from './types'
import { knownTrailer } from './catalogTrailers'

const memory = new Map<string, TmdbVideoClip[]>()

function cacheId(item: { title?: string; year?: number | null; kind?: string; tmdb_id?: number | string | null }) {
  return `flix.videos.v1:${item.kind ?? 'movie'}:${item.tmdb_id ?? ''}:${(item.title ?? '').toLowerCase()}:${item.year ?? ''}`
}

export function useTmdbVideos(item: {
  title?: string
  year?: number | null
  kind?: string
  tmdb_id?: number | string | null
} | null): TmdbVideoClip[] {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const title = item?.title ?? ''
  const cacheKey = cacheId(item ?? {})
  const [clips, setClips] = useState<TmdbVideoClip[]>(() => memory.get(cacheKey) ?? [])

  useEffect(() => {
    if (!title) {
      setClips([])
      return
    }
    if (memory.has(cacheKey)) {
      setClips(memory.get(cacheKey) ?? [])
      return
    }
    let cancelled = false
    findTmdbVideos({ title, year: item?.year, kind: item?.kind, tmdb_id: item?.tmdb_id }, key)
      .then((result) => {
        const hit = knownTrailer({ title, year: item?.year })
        const clips = result.length
          ? result
          : hit
            ? [{ key: hit.src, type: 'Trailer', label: 'Trailer' }]
            : []
        memory.set(cacheKey, clips)
        if (!cancelled) setClips(clips)
      })
      .catch(() => {
        const hit = knownTrailer({ title, year: item?.year })
        const clips = hit ? [{ key: hit.src, type: 'Trailer', label: 'Trailer' }] : []
        memory.set(cacheKey, clips)
        if (!cancelled) setClips(clips)
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, item?.kind, item?.tmdb_id, item?.year, key, title])

  return clips
}
