import { mapTmdbGenres, tmdbSearchTitle } from '../lib/catalogTitle'
import type { TrailerHit } from './types'
import { rememberTitleOverlay } from './tmdbOverlay'

export type CatalogTitle = {
  title: string
  year?: number | null
  kind?: string
  tmdb_id?: number | string | null
}

type SearchItem = CatalogTitle

type TmdbSearch = {
  results?: Array<{
    id: number
    title?: string
    name?: string
    poster_path?: string | null
    backdrop_path?: string | null
    release_date?: string
    first_air_date?: string
  }>
}
type TmdbVideos = { results?: Array<{ key: string; site: string; type: string; official?: boolean }> }

async function tmdbJson<T>(path: string, key: string, extra: Record<string, string> = {}): Promise<T> {
  const params = new URLSearchParams(extra)
  if (key) params.set('api_key', key)
  const query = params.toString()
  const response = await fetch(query ? `/tmdb${path}?${query}` : `/tmdb${path}`)
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`)
  return (await response.json()) as T
}

function scoreVideo(video: { type: string; official?: boolean }) {
  let value = 0
  if (video.type === 'Trailer') value += 4
  else if (video.type === 'Teaser') value += 2
  else if (video.type === 'Clip') value += 1
  if (video.official) value += 1
  return value
}

function rankYoutube(videos: TmdbVideos['results']) {
  return [...(videos ?? [])]
    .filter((video) => video.site === 'YouTube' && video.key)
    .sort((a, b) => scoreVideo(b) - scoreVideo(a))
}

function pickYoutube(videos: TmdbVideos['results']): string | null {
  return rankYoutube(videos)[0]?.key ?? null
}

export type TmdbVideoClip = {
  key: string
  type: string
  label: string
}

const VIDEO_LABELS: Record<string, string> = {
  Trailer: 'Trailer',
  Teaser: 'Teaser',
  Clip: 'Clip',
  Featurette: 'Featurette',
  'Behind the Scenes': 'Behind the Scenes',
  Recap: 'Recap',
}

export async function findTmdbVideos(item: SearchItem, key: string): Promise<TmdbVideoClip[]> {
  const match = await findTmdbMatch(item, key)
  if (!match) return []
  const videos = await tmdbJson<TmdbVideos>(
    match.isTv ? `/3/tv/${match.id}/videos` : `/3/movie/${match.id}/videos`,
    key,
  )
  const seen = new Set<string>()
  const clips: TmdbVideoClip[] = []
  const typeCount: Record<string, number> = {}
  for (const video of rankYoutube(videos.results)) {
    if (seen.has(video.key)) continue
    seen.add(video.key)
    const base = VIDEO_LABELS[video.type] ?? video.type
    const count = (typeCount[base] ?? 0) + 1
    typeCount[base] = count
    clips.push({
      key: video.key,
      type: video.type,
      label: count > 1 ? `${base} ${count}` : base,
    })
    if (clips.length >= 8) break
  }
  return clips
}

export async function findTmdbTrailer(item: SearchItem, key: string): Promise<TrailerHit | null> {
  const match = await findTmdbMatch(item, key)
  if (!match) return null
  const videos = await tmdbJson<TmdbVideos>(
    match.isTv ? `/3/tv/${match.id}/videos` : `/3/movie/${match.id}/videos`,
    key,
  )
  const youtubeKey = pickYoutube(videos.results)
  if (!youtubeKey) return null
  return {
    source: 'tmdb',
    kind: 'youtube',
    src: youtubeKey,
    label: 'Trailer',
  }
}

const TMDB_IMG = 'https://image.tmdb.org/t/p'

export type TmdbArt = {
  poster: string | null
  backdrop: string | null
}

type TmdbLookup = {
  id: number
  title?: string
  name?: string
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  first_air_date?: string
  overview?: string
  runtime?: number | null
  episode_run_time?: number[]
  genres?: Array<{ name?: string }>
}

async function findTmdbMatch(item: SearchItem, key: string) {
  const tmdbId = Number(item.tmdb_id)
  if (Number.isFinite(tmdbId) && tmdbId > 0) {
    const order = item.kind === 'show' ? [true, false] : [false, true]
    for (const isTv of order) {
      try {
        const detail = await tmdbJson<TmdbLookup>(isTv ? `/3/tv/${tmdbId}` : `/3/movie/${tmdbId}`, key)
        if (detail?.id) return { ...detail, isTv }
      } catch {
        /* try the other media type */
      }
    }
  }
  const query = tmdbSearchTitle(item)
  const primaryTv = item.kind === 'show'
  const attempts: Array<{ isTv: boolean; year?: number }> = []
  if (query.year) attempts.push({ isTv: primaryTv, year: query.year })
  attempts.push({ isTv: primaryTv })
  attempts.push({ isTv: !primaryTv })
  for (const attempt of attempts) {
    const path = attempt.isTv ? '/3/search/tv' : '/3/search/movie'
    const extra: Record<string, string> = { query: query.title }
    if (attempt.year) extra[attempt.isTv ? 'first_air_date_year' : 'year'] = String(attempt.year)
    const search = await tmdbJson<TmdbSearch>(path, key, extra)
    const match = search.results?.[0]
    if (match) return { ...match, isTv: attempt.isTv }
  }
  return null
}

export type TmdbInfo = {
  tmdb_id: number
  overview: string
  year: number | null
  runtime: number | null
  genres: string[]
}

function yearFromDate(value?: string) {
  const year = Number.parseInt(String(value ?? '').slice(0, 4), 10)
  return Number.isFinite(year) && year > 1800 ? year : null
}

function infoFromLookup(detail: TmdbLookup, isTv: boolean): TmdbInfo {
  return {
    tmdb_id: detail.id,
    overview: detail.overview?.trim() ?? '',
    year: yearFromDate(detail.release_date) ?? yearFromDate(detail.first_air_date),
    runtime: isTv ? detail.episode_run_time?.[0] ?? null : detail.runtime ?? null,
    genres: mapTmdbGenres((detail.genres ?? []).map((entry) => entry.name)),
  }
}

export async function findTmdbInfo(item: SearchItem, key: string): Promise<TmdbInfo | null> {
  const match = await findTmdbMatch(item, key)
  if (!match) return null
  const detail =
    match.overview != null && match.genres
      ? match
      : await tmdbJson<TmdbLookup>(match.isTv ? `/3/tv/${match.id}` : `/3/movie/${match.id}`, key)
  const info = infoFromLookup(detail, match.isTv)
  rememberTitleOverlay(item, info)
  return info
}

export async function findTmdbArt(item: SearchItem, key: string): Promise<TmdbArt | null> {
  const match = await findTmdbMatch(item, key)
  if (!match) return null
  if (match.id) rememberTitleOverlay(item, infoFromLookup(match, match.isTv))
  return {
    poster: match.poster_path ? `${TMDB_IMG}/w500${match.poster_path}` : null,
    backdrop: match.backdrop_path ? `${TMDB_IMG}/w1280${match.backdrop_path}` : null,
  }
}

const FILE_NAME = /^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i

export function tmdbFileName(url: string): string | null {
  const match = url.match(/\/([A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp))(?:\?|$)/i)
  return match && FILE_NAME.test(match[1]) ? match[1] : null
}

type TmdbImages = {
  backdrops?: Array<{ file_path?: string | null; iso_639_1?: string | null; vote_average?: number }>
  logos?: Array<{
    file_path?: string | null
    iso_639_1?: string | null
    vote_average?: number
    aspect_ratio?: number
  }>
}

export async function findTmdbLogo(item: SearchItem, key: string): Promise<string | null> {
  const match = await findTmdbMatch(item, key)
  if (!match) return null
  const images = await tmdbJson<TmdbImages>(
    match.isTv ? `/3/tv/${match.id}/images` : `/3/movie/${match.id}/images`,
    key,
    { include_image_language: 'en,null' },
  )
  const ranked = [...(images.logos ?? [])]
    .filter((entry) => entry.file_path)
    .sort((a, b) => {
      const lang = (value?: string | null) => (value === 'en' ? 3 : value == null || value === '' ? 1 : 0)
      const png = (path?: string | null) => (path?.toLowerCase().endsWith('.png') ? 1 : 0)
      const ratio = (value?: number) => {
        if (!value) return 0
        if (value >= 1.6 && value <= 5.5) return 2
        if (value >= 1.2) return 1
        return 0
      }
      return (
        png(b.file_path) - png(a.file_path) ||
        lang(b.iso_639_1) - lang(a.iso_639_1) ||
        ratio(b.aspect_ratio) - ratio(a.aspect_ratio) ||
        (b.vote_average ?? 0) - (a.vote_average ?? 0)
      )
    })
  const path = ranked[0]?.file_path
  return path ? `${TMDB_IMG}/w500${path}` : null
}

export async function findTmdbGallery(item: SearchItem, key: string): Promise<string[]> {
  const match = await findTmdbMatch(item, key)
  if (!match) return []
  const images = await tmdbJson<TmdbImages>(
    match.isTv ? `/3/tv/${match.id}/images` : `/3/movie/${match.id}/images`,
    key,
  )
  const ranked = [...(images.backdrops ?? [])]
    .filter((entry) => entry.file_path && tmdbFileName(entry.file_path))
    .sort((a, b) => {
      const lang = (value?: string | null) => (value === 'en' ? 2 : value == null || value === '' ? 1 : 0)
      return lang(b.iso_639_1) - lang(a.iso_639_1) || (b.vote_average ?? 0) - (a.vote_average ?? 0)
    })
  const urls: string[] = []
  const seen = new Set<string>()
  for (const entry of ranked) {
    const file = tmdbFileName(entry.file_path ?? '')
    if (!file || seen.has(file)) continue
    seen.add(file)
    urls.push(`${TMDB_IMG}/w1280/${file}`)
    if (urls.length >= 8) break
  }
  return urls
}
