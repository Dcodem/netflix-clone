import type { MovieListItem } from '../api/types'
import { becauseYouWatched, rankByTaste } from '../profiles/taste'
import type { WatchHistoryItem } from '../profiles/types'
import { genresOf, ofKind, sortByRating, sortByYear, uniqueById } from './media'

export type BrowseFilter = 'home' | 'movies' | 'shows'

export type HomeRow = {
  id: string
  title: string
  items: MovieListItem[]
}

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

function genreRows(
  items: MovieListItem[],
  limit: number,
  titleKind: 'Movies' | 'TV Shows' | null,
): HomeRow[] {
  const counts = new Map<string, MovieListItem[]>()
  for (const item of items) {
    for (const genre of genresOf(item)) {
      const list = counts.get(genre) ?? []
      list.push(item)
      counts.set(genre, list)
    }
  }
  return [...counts.entries()]
    .map(([genre, list]) => ({
      id: `genre-${genre}`,
      title: titleKind ? `${genre} ${titleKind}` : genre,
      items: uniqueById(list).slice(0, 18),
    }))
    .filter((row) => row.items.length >= 4)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, limit)
}

function pushRow(rows: HomeRow[], row: HomeRow) {
  if (row.items.length) rows.push(row)
}

export function buildBrowseRows(opts: {
  catalog: MovieListItem[]
  filter: BrowseFilter
  history: WatchHistoryItem[]
  profileName: string
}): HomeRow[] {
  const { catalog, filter, history, profileName } = opts
  const pool = ofKind(catalog, filter === 'home' ? 'all' : filter)
  const movies = ofKind(catalog, 'movies')
  const shows = ofKind(catalog, 'shows')
  const historyPool = ofKind(historyToListItems(history), filter === 'home' ? 'all' : filter)
  const becauseHistory =
    filter === 'home'
      ? history
      : history.filter((item) => (filter === 'shows' ? item.kind === 'show' : item.kind !== 'show'))

  const rows: HomeRow[] = []

  pushRow(rows, {
    id: 'continue',
    title: 'Continue Watching',
    items: historyPool.slice(0, 18),
  })
  pushRow(rows, {
    id: 'picks',
    title: `Top Picks for ${profileName}`,
    items: rankByTaste(pool, history).slice(0, 18),
  })

  const because = becauseYouWatched(pool, becauseHistory)
  if (because) {
    pushRow(rows, { id: 'because', title: because.title, items: because.items })
  }

  const trendingTitle =
    filter === 'movies' ? 'Trending Movies' : filter === 'shows' ? 'Trending TV Shows' : 'Trending Now'
  const newTitle =
    filter === 'movies' ? 'New Movies' : filter === 'shows' ? 'New TV Shows' : 'New Releases'

  pushRow(rows, { id: 'trending', title: trendingTitle, items: sortByRating(pool).slice(0, 18) })
  pushRow(rows, { id: 'new', title: newTitle, items: sortByYear(pool).slice(0, 18) })

  if (filter === 'home') {
    pushRow(rows, { id: 'popular-movies', title: 'Popular Movies', items: sortByRating(movies).slice(0, 18) })
    pushRow(rows, { id: 'popular-shows', title: 'Popular TV Shows', items: sortByRating(shows).slice(0, 18) })
    pushRow(rows, {
      id: 'new-movies',
      title: 'Recently Added Movies',
      items: sortByYear(movies).slice(0, 18),
    })
    pushRow(rows, {
      id: 'new-shows',
      title: 'Recently Added TV Shows',
      items: sortByYear(shows).slice(0, 18),
    })
  }

  const genreKind = filter === 'movies' ? 'Movies' : filter === 'shows' ? 'TV Shows' : null
  for (const row of genreRows(pool, filter === 'home' ? 10 : 12, genreKind)) {
    pushRow(rows, row)
  }

  return rows
}
