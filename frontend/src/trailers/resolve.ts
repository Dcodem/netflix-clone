import { cacheKey, type TrailerHit, type TrailerKeys } from './types'
import { findIvaTrailer } from './iva'
import { findTmdbTrailer } from './tmdb'
import { knownTrailer } from './catalogTrailers'

const memory = new Map<string, TrailerHit | null>()

type SearchItem = {
  title: string
  year?: number | null
  kind?: string
  tmdb_id?: number | string | null
}

export async function resolveTrailer(
  item: SearchItem,
  keys: TrailerKeys,
  opts: { seconds?: number } = {},
): Promise<TrailerHit | null> {
  if (!item.title) return null
  const key = cacheKey(item.title, item.year, item.kind ?? 'movie', item.tmdb_id)
  if (memory.has(key)) return memory.get(key) ?? null
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) {
      const parsed = JSON.parse(cached) as TrailerHit | null
      if (parsed?.src) {
        memory.set(key, parsed)
        return parsed
      }
    }
  } catch {
    // ignore cache
  }

  let hit: TrailerHit | null = knownTrailer(item)
  console.log('[trailer-debug] start', item.title, 'known:', hit?.src ?? null)
  try {
    hit = (await findTmdbTrailer(item, keys.tmdb)) ?? hit
    console.log('[trailer-debug] tmdb result', item.title, hit?.src ?? null)
  } catch (err) {
    console.log('[trailer-debug] tmdb FAILED', item.title, String(err).slice(0, 120))
  }
  if (!hit && keys.iva) {
    try {
      hit = await findIvaTrailer(item, keys.iva, opts)
    } catch {
      hit = null
    }
  }
  memory.set(key, hit)
  // Only cache POSITIVE hits in sessionStorage. A null (timeout/rate-limit
  // during a busy page load) must stay retryable — caching it permanently
  // killed trailers for the whole session.
  if (hit) {
    try {
      sessionStorage.setItem(key, JSON.stringify(hit))
    } catch {
      // quota
    }
  }
  return hit
}

export function peekTrailer(item: SearchItem): TrailerHit | null {
  if (!item.title) return null
  const kind = item.kind ?? 'movie'
  const keys = [
    cacheKey(item.title, item.year, kind, item.tmdb_id),
    cacheKey(item.title, item.year, kind),
    cacheKey(item.title, undefined, kind),
  ]
  const seen = new Set<string>()
  for (const key of keys) {
    if (seen.has(key)) continue
    seen.add(key)
    if (memory.has(key)) {
      const hit = memory.get(key)
      if (hit) return hit
      continue
    }
    try {
      const cached = sessionStorage.getItem(key)
      if (cached) {
        const parsed = JSON.parse(cached) as TrailerHit
        if (parsed?.src) {
          memory.set(key, parsed)
          return parsed
        }
      }
    } catch {
      // ignore cache
    }
  }
  return knownTrailer(item)
}

export function youtubeIdFromHit(hit: TrailerHit | null | undefined): string | null {
  if (!hit || hit.kind !== 'youtube') return null
  const id = String(hit.src || '').trim()
  return /^[\w-]{6,20}$/.test(id) ? id : null
}
