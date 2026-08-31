import type { TrailerHit } from './types'
import { KNOWN_TRAILERS } from './knownTrailers'

export function knownTrailer(item: { title?: string; year?: number | null }): TrailerHit | null {
  const title = (item.title ?? '').trim().toLowerCase()
  if (!title) return null
  const year = item.year ? String(item.year) : ''
  const src = (year && KNOWN_TRAILERS[`${title}|${year}`]) || KNOWN_TRAILERS[title]
  if (!src || !/^[\w-]{6,20}$/.test(src)) return null
  return { source: 'tmdb', kind: 'youtube', src, label: 'Trailer' }
}
