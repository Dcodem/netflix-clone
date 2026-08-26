import { cacheKey, type TrailerHit, type TrailerKeys } from './types'
import { findIvaTrailer } from './iva'
import { findTmdbTrailer } from './tmdb'

const memory = new Map<string, TrailerHit | null>()

type SearchItem = {
  title: string
  year?: number | null
  kind?: string
}

export async function resolveTrailer(
  item: SearchItem,
  keys: TrailerKeys,
  opts: { seconds?: number } = {},
): Promise<TrailerHit | null> {
  if (!item.title) return null
  const key = cacheKey(item.title, item.year, item.kind ?? 'movie')
  if (memory.has(key)) return memory.get(key) ?? null
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) {
      const parsed = JSON.parse(cached) as TrailerHit
      memory.set(key, parsed)
      return parsed
    }
  } catch {
    // ignore cache
  }

  let hit: TrailerHit | null = null
  if (keys.tmdb) {
    try {
      hit = await findTmdbTrailer(item, keys.tmdb)
    } catch {
      hit = null
    }
  }
  if (!hit && keys.iva) {
    try {
      hit = await findIvaTrailer(item, keys.iva, opts)
    } catch {
      hit = null
    }
  }
  memory.set(key, hit)
  if (hit) {
    try {
      sessionStorage.setItem(key, JSON.stringify(hit))
    } catch {
      // quota
    }
  }
  return hit
}
