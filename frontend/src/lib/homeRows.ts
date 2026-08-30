import type { MovieListItem } from '../api/types'
import {
  becauseYouLikedRows,
  becauseYouWatchedRows,
  rankByTaste,
  tasteGenreRails,
} from '../profiles/taste'
import type { LikedTitle, Profile, WatchHistoryItem } from '../profiles/types'
import { genresOf, ofKind, remainingLabel, sortByRating, sortByYear, uniqueById } from './media'

export type BrowseFilter = 'home' | 'movies' | 'shows' | 'popular'

export type HomeRow = {
  id: string
  title: string
  subtitle?: string
  items: MovieListItem[]
  seed?: MovieListItem
  variant?: 'default' | 'continue' | 'top10'
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
    continueLabel:
      item.kind === 'show' && item.seasonNumber && item.episodeNumber
        ? `S${item.seasonNumber}:E${item.episodeNumber}`
        : remainingLabel(item.progress, item.runtime) ?? undefined,
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

function recommendRail(items: MovieListItem[], profile: Profile | null): MovieListItem[] {
  if (!profile) return sortByRating(items)
  const ranked = rankByTaste(items, profile, { excludeSeen: false })
  return ranked.length ? ranked : sortByRating(items)
}

function pushRow(rows: HomeRow[], row: HomeRow) {
  if (!row.items.length) return
  rows.push({
    ...row,
    items: rail(row.items, row.variant === 'continue' ? 24 : RAIL),
    loop: row.loop ?? (row.variant !== 'continue' && !row.seed && row.items.length >= 8),
  })
}

export function stillWatching(entry: { progress?: number; kind?: string }) {
  const progress = entry.progress ?? 0
  if (progress < 0.05) return false
  if (progress < 0.9) return true
  return entry.kind === 'show'
}

function finishedMovie(entry: WatchHistoryItem) {
  return entry.kind !== 'show' && (entry.progress ?? 0) >= 0.9
}

export function catalogGenres(items: MovieListItem[]): string[] {
  return [...new Set(items.flatMap((item) => genresOf(item)))].sort()
}

export function exploreHrefForRow(row: Pick<HomeRow, 'id' | 'title'>): string | undefined {
  if (row.id === 'mylist') return '/browse/my-list'
  if (row.id === 'continue') return undefined
  if (row.id === 'coming' || row.id === 'watching' || row.id === 'worth' || row.id === 'new-flix') {
    return '/browse/latest'
  }
  if (row.id === 'new-movies' || row.id === 'top10-movies') return '/browse/movies'
  if (row.id === 'new-shows' || row.id === 'top10-tv') return '/browse/shows'
  if (row.id.startsWith('genre-')) {
    const genre = row.id.slice('genre-'.length)
    return `/browse?genre=${encodeURIComponent(genre)}`
  }
  return undefined
}

export function buildBrowseRows(opts: {
  catalog: MovieListItem[]
  filter: BrowseFilter
  profile: Profile | null
  genre?: string
}): HomeRow[] {
  const { catalog, filter, profile } = opts
  const history = profile?.history ?? []
  const kind: 'all' | 'movies' | 'shows' =
    filter === 'movies' ? 'movies' : filter === 'shows' ? 'shows' : 'all'
  let pool = ofKind(catalog, kind)
  if (opts.genre) {
    pool = pool.filter((item) => genresOf(item).includes(opts.genre!))
  }
  const movies = ofKind(pool, 'movies')
  const shows = ofKind(pool, 'shows')
  const historyPool = ofKind(historyToListItems(history), kind)
  const becauseHistory =
    kind === 'all' ? history : history.filter((item) => (kind === 'shows' ? item.kind === 'show' : item.kind !== 'show'))
  const rows: HomeRow[] = []

  if (filter === 'popular') {
    const year = new Date().getFullYear()
    const soon = pool.filter((item) => (item.year ?? 0) >= year)
    const available = pool.filter((item) => (item.year ?? 0) < year)
    const watching = sortByRating(available)
    const comingIds = new Set(soon.slice(0, 8).map((item) => item.id))
    const watchingIds = new Set(watching.slice(0, 12).map((item) => item.id))
    const leftoverSoon = soon.filter((item) => !comingIds.has(item.id))
    const worthFill = sortByRating(available.filter((item) => !watchingIds.has(item.id)))
    pushRow(rows, { id: 'coming', title: 'Coming Soon', items: soon })
    pushRow(rows, { id: 'watching', title: 'Everyone’s Watching', items: watching })
    pushRow(rows, {
      id: 'worth',
      title: 'Worth the Wait',
      items: uniqueById([...leftoverSoon, ...worthFill]),
    })
    pushRow(rows, { id: 'new-flix', title: 'New on FLIX', items: sortByYear(available) })
    const topTv = sortByRating(shows).slice(0, 10)
    if (topTv.length >= 4) {
      pushRow(rows, {
        id: 'top10-tv',
        title: 'Top 10 TV Shows in the U.S. Today',
        items: topTv,
        variant: 'top10',
        loop: false,
      })
    }
    const topMovies = sortByRating(movies).slice(0, 10)
    if (topMovies.length >= 4) {
      pushRow(rows, {
        id: 'top10-movies',
        title: 'Top 10 Movies in the U.S. Today',
        items: topMovies,
        variant: 'top10',
        loop: false,
      })
    }
    if (profile) {
      pushRow(rows, {
        id: 'next-watch',
        title: 'Your Next Watch',
        items: rankByTaste(pool, profile),
      })
    }
    pushRow(rows, { id: 'new-movies', title: 'New Movies', items: sortByYear(movies) })
    pushRow(rows, { id: 'new-shows', title: 'New TV Shows', items: sortByYear(shows) })
    for (const row of tasteGenreRails(pool, profile, kind, 2)) {
      pushRow(rows, { id: row.id, title: row.title, items: row.items })
    }
    return rows
  }

  const hidden = new Set(profile?.hiddenContinueIds ?? [])
  const continueIds = new Set(
    becauseHistory.filter((entry) => !hidden.has(entry.id) && stillWatching(entry)).map((entry) => entry.id),
  )
  pushRow(rows, {
    id: 'continue',
    title: profile?.name ? `Continue Watching for ${profile.name}` : 'Continue Watching',
    items: historyPool.filter((item) => continueIds.has(item.id)),
    variant: 'continue',
    loop: false,
  })

  if (profile?.myList.length) {
    pushRow(rows, {
      id: 'mylist',
      title: 'My List',
      items: ofKind(likedToItems(profile.myList), kind),
    })
  }

  const trendingTitle =
    filter === 'movies' ? 'Trending Movies' : filter === 'shows' ? 'Trending TV Shows' : 'Trending Now'
  pushRow(rows, { id: 'trending', title: trendingTitle, items: sortByRating(pool) })

  const top10 = sortByRating(pool).slice(0, 10)
  if (top10.length >= 4) {
    pushRow(rows, {
      id: 'top10',
      title:
        filter === 'movies'
          ? 'Top 10 Movies in the U.S. Today'
          : filter === 'shows'
            ? 'Top 10 TV Shows in the U.S. Today'
            : 'Top 10 in the U.S. Today',
      items: top10,
      variant: 'top10',
      loop: false,
    })
  }

  pushRow(rows, {
    id: 'only-flix',
    title: 'Only on FLIX',
    items: recommendRail(filter === 'movies' ? movies : filter === 'shows' ? shows : shows, profile),
  })

  const newTitle = filter === 'movies' ? 'New Movies' : filter === 'shows' ? 'New TV Shows' : 'New Releases'
  pushRow(rows, { id: 'new', title: newTitle, items: sortByYear(pool) })

  pushRow(rows, {
    id: 'watch-again',
    title: 'Watch It Again',
    items: historyToListItems(becauseHistory.filter(finishedMovie)),
    loop: false,
  })

  for (const row of becauseYouWatchedRows(pool, becauseHistory, filter === 'home' ? 3 : 4)) {
    pushRow(rows, {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      items: row.items,
      seed: row.seed,
      loop: false,
    })
  }

  if (filter === 'home') {
    pushRow(rows, { id: 'new-movies', title: 'New Movies', items: sortByYear(movies) })
    pushRow(rows, { id: 'new-shows', title: 'New TV Shows', items: sortByYear(shows) })
  }

  if (profile) {
    pushRow(rows, {
      id: 'picks',
      title: `Top Picks for ${profile.name}`,
      items: rankByTaste(pool, profile),
    })
  } else if (filter === 'home') {
    pushRow(rows, { id: 'movies', title: 'Movies', items: recommendRail(movies, profile) })
    pushRow(rows, { id: 'shows', title: 'TV Shows', items: recommendRail(shows, profile) })
  }

  for (const row of becauseYouLikedRows(pool, profile?.liked ?? [], 2)) {
    pushRow(rows, {
      id: row.id,
      title: row.title,
      items: row.items,
      seed: row.seed,
      loop: false,
    })
  }

  const genreLimit = filter === 'home' ? 2 : 3
  for (const row of tasteGenreRails(pool, profile, kind, genreLimit)) {
    pushRow(rows, { id: row.id, title: row.title, items: row.items })
  }

  return rows
}
