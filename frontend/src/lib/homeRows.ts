import type { MovieListItem } from '../api/types'
import {
  becauseYouLikedRows,
  becauseYouWatchedRows,
  rankByTaste,
  tasteGenreRails,
} from '../profiles/taste'
import type { LikedTitle, Profile, WatchHistoryItem } from '../profiles/types'
import { genresOf, ofKind, sortByRating, sortByYear, uniqueById } from './media'

export type BrowseFilter = 'home' | 'movies' | 'shows' | 'popular'

export type HomeRow = {
  id: string
  title: string
  items: MovieListItem[]
  variant?: 'default' | 'top10' | 'continue'
  loop?: boolean
}

const RAIL = 36

export function historyToListItems(history: WatchHistoryItem[]): MovieListItem[] {
  return history.map((item) => ({
    id: item.id,
    title: item.title,
    kind: item.kind,
    poster_url: item.poster_url,
    genres: item.genres,
    href: `/${item.kind === 'show' ? 'shows' : 'movies'}/view/${item.id}`,
  }))
}

export function likedToItems(items: LikedTitle[]): MovieListItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    kind: item.kind,
    poster_url: item.poster_url,
    genres: item.genres,
    href: `/${item.kind === 'show' ? 'shows' : 'movies'}/view/${item.id}`,
  }))
}

function rail(items: MovieListItem[], cap = RAIL): MovieListItem[] {
  return uniqueById(items).slice(0, cap)
}

function pushRow(rows: HomeRow[], row: HomeRow) {
  if (!row.items.length) return
  rows.push({
    ...row,
    items: rail(row.items, row.variant === 'top10' ? 10 : row.variant === 'continue' ? 24 : RAIL),
    loop: row.loop ?? (row.variant !== 'top10' && row.variant !== 'continue' && row.items.length >= 8),
  })
}

export function catalogGenres(items: MovieListItem[]): string[] {
  return [...new Set(items.flatMap((item) => genresOf(item)))].sort()
}

export function buildBrowseRows(opts: {
  catalog: MovieListItem[]
  filter: BrowseFilter
  profile: Profile | null
  genre?: string
}): HomeRow[] {
  const { catalog, filter, profile } = opts
  const history = profile?.history ?? []
  let pool = ofKind(catalog, filter === 'home' || filter === 'popular' ? 'all' : filter)
  if (opts.genre) {
    pool = pool.filter((item) => genresOf(item).includes(opts.genre!))
  }
  const movies = ofKind(pool, 'movies')
  const shows = ofKind(pool, 'shows')
  const historyPool = ofKind(
    historyToListItems(history),
    filter === 'shows' ? 'shows' : filter === 'movies' ? 'movies' : 'all',
  )
  const becauseHistory =
    filter === 'home'
      ? history
      : history.filter((item) => (filter === 'shows' ? item.kind === 'show' : item.kind !== 'show'))
  const kind = filter === 'movies' ? 'movies' : filter === 'shows' ? 'shows' : 'all'
  const rows: HomeRow[] = []

  if (filter !== 'popular') {
    const hidden = new Set(profile?.hiddenContinueIds ?? [])
    pushRow(rows, {
      id: 'continue',
      title: 'Continue Watching',
      items: historyPool.filter((item) => !hidden.has(item.id)),
      variant: 'continue',
      loop: false,
    })
  }

  if (filter === 'home' && profile?.myList.length) {
    pushRow(rows, { id: 'mylist', title: 'My List', items: likedToItems(profile.myList) })
  }

  const newTitle =
    filter === 'movies' ? 'New Movies' : filter === 'shows' ? 'New TV Shows' : 'New Releases'
  pushRow(rows, { id: 'new', title: newTitle, items: sortByYear(pool) })

  const top10Title =
    filter === 'movies' ? 'Top 10 Movies' : filter === 'shows' ? 'Top 10 TV Shows' : 'Top 10 in Your Catalog'
  pushRow(rows, {
    id: 'top10',
    title: top10Title,
    items: sortByRating(pool).slice(0, 10),
    variant: 'top10',
    loop: false,
  })

  if (filter === 'home' || filter === 'popular') {
    pushRow(rows, { id: 'movies', title: 'Movies', items: sortByRating(movies) })
    pushRow(rows, { id: 'shows', title: 'TV Shows', items: sortByRating(shows) })
  }

  if (filter === 'popular') {
    pushRow(rows, { id: 'trending', title: "Everyone's Watching", items: sortByRating(pool) })
    return rows
  }

  if (profile) {
    pushRow(rows, {
      id: 'picks',
      title: `Top Picks for ${profile.name}`,
      items: rankByTaste(pool, profile),
    })
  }

  for (const row of becauseYouWatchedRows(pool, becauseHistory, 3)) {
    pushRow(rows, { id: row.id, title: row.title, items: row.items })
  }
  for (const row of becauseYouLikedRows(pool, profile?.liked ?? [], 2)) {
    pushRow(rows, { id: row.id, title: row.title, items: row.items })
  }

  const genreLimit = filter === 'home' ? 4 : 5
  for (const row of tasteGenreRails(pool, profile, kind, genreLimit)) {
    pushRow(rows, { id: row.id, title: row.title, items: row.items })
  }

  return rows
}
