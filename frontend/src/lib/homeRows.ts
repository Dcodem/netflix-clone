import type { MovieListItem } from '../api/types'
import { becauseYouLiked, becauseYouWatched, rankByTaste } from '../profiles/taste'
import type { LikedTitle, Profile, WatchHistoryItem } from '../profiles/types'
import { genresOf, ofKind, sortByRating, sortByYear, uniqueById } from './media'

export type BrowseFilter = 'home' | 'movies' | 'shows' | 'popular'

export type HomeRow = {
  id: string
  title: string
  items: MovieListItem[]
  variant?: 'default' | 'top10' | 'continue'
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

  if (filter === 'popular') {
    const rows: HomeRow[] = []
    pushRow(rows, {
      id: 'top10',
      title: 'Top 10 in Your Catalog',
      items: sortByRating(pool).slice(0, 10),
      variant: 'top10',
    })
    pushRow(rows, { id: 'new', title: 'New on Flix', items: sortByYear(pool).slice(0, 18) })
    pushRow(rows, { id: 'trending', title: "Everyone's Watching", items: sortByRating(pool).slice(0, 18) })
    pushRow(rows, { id: 'popular-movies', title: 'Popular Movies', items: sortByRating(movies).slice(0, 18) })
    pushRow(rows, { id: 'popular-shows', title: 'Popular TV Shows', items: sortByRating(shows).slice(0, 18) })
    return rows
  }

  const rows: HomeRow[] = []

  if (filter === 'home') {
    const hidden = new Set(profile?.hiddenContinueIds ?? [])
    pushRow(rows, {
      id: 'continue',
      title: 'Continue Watching',
      items: historyPool.filter((item) => !hidden.has(item.id)).slice(0, 18),
      variant: 'continue',
    })
    if (profile?.myList.length) {
      pushRow(rows, { id: 'mylist', title: 'My List', items: likedToItems(profile.myList).slice(0, 18) })
    }
  }

  if (profile) {
    pushRow(rows, {
      id: 'picks',
      title: `Top Picks for ${profile.name}`,
      items: rankByTaste(pool, profile).slice(0, 18),
    })
  }

  const because = becauseYouWatched(pool, becauseHistory)
  if (because) {
    pushRow(rows, { id: 'because', title: because.title, items: because.items })
  }
  const liked = becauseYouLiked(pool, profile?.liked ?? [])
  if (liked) {
    pushRow(rows, { id: 'liked', title: liked.title, items: liked.items })
  }

  const trendingTitle =
    filter === 'movies' ? 'Trending Movies' : filter === 'shows' ? 'Trending TV Shows' : 'Trending Now'
  const newTitle =
    filter === 'movies' ? 'New Movies' : filter === 'shows' ? 'New TV Shows' : 'New Releases'
  const top10Title =
    filter === 'movies' ? 'Top 10 Movies' : filter === 'shows' ? 'Top 10 TV Shows' : 'Top 10 in Your Catalog'

  pushRow(rows, { id: 'trending', title: trendingTitle, items: sortByRating(pool).slice(0, 18) })
  pushRow(rows, {
    id: 'top10',
    title: top10Title,
    items: sortByRating(pool).slice(0, 10),
    variant: 'top10',
  })
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
