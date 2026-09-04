/** Types matching API.md / openapi.json exactly. */

export type MovieListItem = {
  id: string
  title: string
  kind?: string
  year?: number | null
  rating?: number | null
  quality?: string | null
  genres?: string[]
  poster_url?: string | null
  href: string
  continueLabel?: string
  /** TMDB vote count — obscurity/quality signals. */
  votes?: number | null
  /** TMDB release/air date (YYYY-MM-DD). Real dates only, drives Coming Soon. */
  release_date?: string | null
  /** False = not yet released; UI must show Coming Soon, not Play. */
  playable?: boolean
  /** TMDB id for art, copy, and rails. Never used as a play URL. */
  tmdb_id?: number | string | null
}

export type MovieDetail = MovieListItem & {
  synopsis?: string
  runtime?: number | null
  cast?: string[]
  /** Top-billed cast with headshots from TMDB. */
  cast_details?: { name: string; character?: string; profile?: string | null }[]
  creators?: string[]
  director?: string
  writers?: string[]
  backdrop_url?: string | null
  watch_href?: string | null
  /** False = not yet released; UI must show Coming Soon, not Play. */
  playable?: boolean
}

export type Episode = {
  id: string
  number: number
  title: string
  duration?: number | null
  synopsis?: string | null
  thumb_url?: string | null
  watch_href: string
}

export type Season = {
  season_number: number
  episodes?: Episode[]
}

export type ShowDetail = MovieDetail & {
  seasons?: Season[]
}

export type CatalogPage = {
  items?: MovieListItem[]
  next?: unknown
}

export type HomeRail = {
  id: string
  title: string
  items: MovieListItem[]
}

export type NetflixTop10Entry = {
  netflix_rank: number
  views?: string | null
  hours_viewed?: string | null
  week_ending?: string | null
  kind: string
  item: MovieListItem
}

export type NetflixTop10 = NetflixTop10Entry[]

export type HomeRails = HomeRail[]
