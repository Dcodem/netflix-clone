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

export async function findTmdbArt(item: SearchItem, key: string): Promise<TmdbArt | null> {
  const isShow = item.kind === 'show'
  const path = isShow ? '/3/search/tv' : '/3/search/movie'
  const extra: Record<string, string> = { query: item.title }
  if (item.year) extra[isShow ? 'first_air_date_year' : 'year'] = String(item.year)
  const search = await tmdbJson<TmdbSearch>(path, key, extra)
  const match = search.results?.[0]
  if (!match) return null
  return {
    poster: match.poster_path ? `${TMDB_IMG}/w342${match.poster_path}` : null,
    backdrop: match.backdrop_path ? `${TMDB_IMG}/w1280${match.backdrop_path}` : null,
  }
}
