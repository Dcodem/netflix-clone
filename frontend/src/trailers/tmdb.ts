import type { TrailerHit } from './types'

type SearchItem = {
  title: string
  year?: number | null
  kind?: string
}

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
  const params = new URLSearchParams({ api_key: key, ...extra })
  const response = await fetch(`/tmdb${path}?${params.toString()}`)
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`)
  return (await response.json()) as T
}

function pickYoutube(videos: TmdbVideos['results']): string | null {
  if (!videos?.length) return null
  const ranked = [...videos]
    .filter((video) => video.site === 'YouTube' && video.key)
    .sort((a, b) => {
      const score = (video: { type: string; official?: boolean }) => {
        let value = 0
        if (video.type === 'Trailer') value += 4
        else if (video.type === 'Teaser') value += 2
        else if (video.type === 'Clip') value += 1
        if (video.official) value += 1
        return value
      }
      return score(b) - score(a)
    })
  return ranked[0]?.key ?? null
}

export async function findTmdbTrailer(item: SearchItem, key: string): Promise<TrailerHit | null> {
  const isShow = item.kind === 'show'
  const path = isShow ? '/3/search/tv' : '/3/search/movie'
  const extra: Record<string, string> = { query: item.title }
  if (item.year) extra[isShow ? 'first_air_date_year' : 'year'] = String(item.year)
  const search = await tmdbJson<TmdbSearch>(path, key, extra)
  const match = search.results?.[0]
  if (!match) return null
  const videos = await tmdbJson<TmdbVideos>(isShow ? `/3/tv/${match.id}/videos` : `/3/movie/${match.id}/videos`, key)
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

async function findTmdbMatch(item: SearchItem, key: string) {
  const isShow = item.kind === 'show'
  const path = isShow ? '/3/search/tv' : '/3/search/movie'
  const extra: Record<string, string> = { query: item.title }
  if (item.year) extra[isShow ? 'first_air_date_year' : 'year'] = String(item.year)
  const search = await tmdbJson<TmdbSearch>(path, key, extra)
  return search.results?.[0] ?? null
}

export async function findTmdbArt(item: SearchItem, key: string): Promise<TmdbArt | null> {
  const match = await findTmdbMatch(item, key)
  if (!match) return null
  return {
    poster: match.poster_path ? `${TMDB_IMG}/w342${match.poster_path}` : null,
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
}

export async function findTmdbGallery(item: SearchItem, key: string): Promise<string[]> {
  const match = await findTmdbMatch(item, key)
  if (!match) return []
  const isShow = item.kind === 'show'
  const images = await tmdbJson<TmdbImages>(isShow ? `/3/tv/${match.id}/images` : `/3/movie/${match.id}/images`, key)
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
