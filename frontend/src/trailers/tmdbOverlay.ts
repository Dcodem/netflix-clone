import type { MovieListItem } from '../api/types'
import { parseCatalogTitle, weakCopy } from '../lib/catalogTitle'
import type { TmdbInfo } from './tmdb'

export type TitleOverlay = TmdbInfo & { tmdb_id: number }

const memory = new Map<string, TitleOverlay>()
const listeners = new Set<() => void>()

function overlayKey(item: { title?: string; year?: number | null; kind?: string; tmdb_id?: number | string | null }) {
  const parsed = parseCatalogTitle(item.title ?? '')
  const tmdbId = Number(item.tmdb_id)
  if (Number.isFinite(tmdbId) && tmdbId > 0) return `id:${tmdbId}`
  return `${item.kind ?? 'movie'}:${parsed.title.toLowerCase()}:${item.year || parsed.year || ''}`
}

function readSession(key: string): TitleOverlay | null {
  try {
    const raw = sessionStorage.getItem(`flix.overlay.v1:${key}`)
    if (!raw) return null
    return JSON.parse(raw) as TitleOverlay
  } catch {
    return null
  }
}

function writeSession(key: string, overlay: TitleOverlay) {
  try {
    sessionStorage.setItem(`flix.overlay.v1:${key}`, JSON.stringify(overlay))
  } catch {
    /* quota */
  }
}

export function getTitleOverlay(item: {
  title?: string
  year?: number | null
  kind?: string
  tmdb_id?: number | string | null
}): TitleOverlay | null {
  const key = overlayKey(item)
  if (memory.has(key)) return memory.get(key) ?? null
  const stored = readSession(key)
  if (stored) memory.set(key, stored)
  return stored
}

export function rememberTitleOverlay(
  item: { title?: string; year?: number | null; kind?: string; tmdb_id?: number | string | null },
  patch: Partial<TitleOverlay> & { tmdb_id: number },
) {
  if (!(patch.tmdb_id > 0)) return
  const prev = getTitleOverlay({ ...item, tmdb_id: patch.tmdb_id }) ?? getTitleOverlay(item)
  putTitleOverlay(item, {
    tmdb_id: patch.tmdb_id,
    overview: patch.overview || prev?.overview || '',
    year: patch.year || prev?.year || null,
    runtime: patch.runtime ?? prev?.runtime ?? null,
    genres: patch.genres?.length ? patch.genres : prev?.genres ?? [],
  })
}

export function putTitleOverlay(
  item: { title?: string; year?: number | null; kind?: string; tmdb_id?: number | string | null },
  overlay: TitleOverlay,
) {
  const keys = new Set([overlayKey({ ...item, tmdb_id: undefined }), overlayKey(item)])
  if (overlay.tmdb_id > 0) keys.add(`id:${overlay.tmdb_id}`)
  for (const key of keys) {
    memory.set(key, overlay)
    writeSession(key, overlay)
  }
  for (const listener of listeners) listener()
}

export function subscribeTitleOverlay(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Presentation fields only. Never copies play URLs. */
export function presentListItem<T extends MovieListItem>(item: T, overlay = getTitleOverlay(item)): T {
  if (!overlay) return item
  const genres = item.genres?.length ? item.genres : overlay.genres
  return {
    ...item,
    tmdb_id: item.tmdb_id ?? overlay.tmdb_id,
    year: item.year || overlay.year,
    genres,
  }
}

export function presentCopy(
  catalog: { synopsis?: string | null; runtime?: number | null; year?: number | null; genres?: string[] } | null | undefined,
  overlay: TitleOverlay | TmdbInfo | null,
) {
  const synopsis = weakCopy(catalog?.synopsis) ? overlay?.overview || catalog?.synopsis?.trim() || '' : catalog?.synopsis?.trim() || ''
  const genres = catalog?.genres?.length ? catalog.genres : overlay?.genres ?? []
  return {
    synopsis,
    genres,
    year: catalog?.year || overlay?.year || null,
    runtime: catalog?.runtime || overlay?.runtime || null,
  }
}

export function needsCatalogEnrichment(item: MovieListItem): boolean {
  if (getTitleOverlay(item)) return false
  return !item.genres?.length || !item.year
}
