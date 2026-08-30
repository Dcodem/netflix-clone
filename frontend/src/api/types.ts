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
}

export type MovieDetail = MovieListItem & {
  synopsis?: string
  runtime?: number | null
  cast?: string[]
  creators?: string[]
  director?: string
  writers?: string[]
  backdrop_url?: string | null
  watch_href?: string | null
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
