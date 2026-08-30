import type { MovieListItem } from '../api/types'
import {
  becauseYouLikedRows,
  becauseYouWatchedRows,
  matchesGenreFilter,
  rankByTaste,
  ROM_COM_GENRE,
  romComItems,
  isRomComGenre,
  tasteGenreRails,
} from '../profiles/taste'
import { usesPersonalizedRecs, type LikedTitle, type Profile, type WatchHistoryItem } from '../profiles/types'
import { isComingSoon, sortByComingDate } from './comingSoon'
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
const POPULAR_RAIL = 12

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
    year: item.year,
    poster_url: item.poster_url,
    genres: item.genres,
    href: `/${item.kind === 'show' ? 'shows' : 'movies'}/view/${item.id}`,
  }))
}

export type MyListSort = 'suggestions' | 'added' | 'az' | 'year'

export const MY_LIST_SORTS: { value: MyListSort; label: string }[] = [
  { value: 'suggestions', label: 'Suggestions For You' },
  { value: 'added', label: 'Date Added' },
  { value: 'az', label: 'A-Z' },
  { value: 'year', label: 'Year Released' },
]

export function enrichListItems(list: MovieListItem[], catalog: MovieListItem[]): MovieListItem[] {
  if (!catalog.length) return list
  const byId = new Map(catalog.map((item) => [item.id, item]))
  const byTitle = new Map(catalog.map((item) => [item.title.toLowerCase(), item]))
  return list.map((item) => {
    const hit = byId.get(item.id) ?? byTitle.get(item.title.toLowerCase())
    if (!hit) return item
    return {
      ...item,
      year: item.year ?? hit.year,
      rating: item.rating ?? hit.rating,
      genres: item.genres?.length ? item.genres : hit.genres,
      poster_url: item.poster_url ?? hit.poster_url,
    }
  })
}

export function sortMyListItems(
  items: MovieListItem[],
  sort: MyListSort,
  profile: Profile | null,
): MovieListItem[] {
  if (sort === 'az') {
    return [...items].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
  }
  if (sort === 'year') return sortByYear(items)
  if (sort === 'added') return items
  if (!usesPersonalizedRecs(profile)) return sortByRating(items)
  const ranked = rankByTaste(items, profile, { excludeSeen: false })
  const seen = new Set(ranked.map((item) => item.id))
  return [...ranked, ...items.filter((item) => !seen.has(item.id))]
}

function rail(items: MovieListItem[], cap = RAIL): MovieListItem[] {
  return uniqueById(items).slice(0, cap)
}

function uniqueRail(items: MovieListItem[], used: Set<string>, cap = RAIL): MovieListItem[] {
  return uniqueById(items.filter((item) => !used.has(item.id))).slice(0, cap)
}

function railIds(items: MovieListItem[], cap = RAIL): Set<string> {
  return new Set(rail(items, cap).map((item) => item.id))
}

function recommendRail(items: MovieListItem[], profile: Profile | null): MovieListItem[] {
  if (!usesPersonalizedRecs(profile)) return sortByRating(items)
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

function pushRecRow(rows: HomeRow[], row: HomeRow, used: Set<string>) {
  const items = uniqueRail(row.items, used)
  if (!items.length) return
  if (!row.seed && items.length < 6) return
  for (const item of items) used.add(item.id)
  pushRow(rows, { ...row, items })
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
  const genres = [...new Set(items.flatMap((item) => genresOf(item)))].sort()
  if (romComItems(items).length >= 6) return [ROM_COM_GENRE, ...genres]
  return genres
}

export function exploreHrefForRow(row: Pick<HomeRow, 'id' | 'title'>): string | undefined {
  if (row.id === 'mylist') return '/browse/my-list'
  if (row.id === 'continue') return undefined
  if (row.id === 'coming' || row.id === 'watching' || row.id === 'worth' || row.id === 'new-flix') {
    return '/browse/latest'
  }
  if (row.id === 'new-movies' || row.id === 'top10-movies') return '/browse/movies'
  if (row.id === 'new-shows' || row.id === 'top10-tv') return '/browse/shows'
  if (row.id === 'genre-romcom') return `/browse?genre=${encodeURIComponent(ROM_COM_GENRE)}`
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
  const matchesGenre = (item: MovieListItem) => matchesGenreFilter(item, opts.genre)
  if (opts.genre) {
    pool = pool.filter(matchesGenre)
  }
  const movies = ofKind(pool, 'movies')
  const shows = ofKind(pool, 'shows')
  const historyPool = ofKind(historyToListItems(history), kind)
  const becauseHistory =
    kind === 'all' ? history : history.filter((item) => (kind === 'shows' ? item.kind === 'show' : item.kind !== 'show'))
  const rows: HomeRow[] = []

  if (filter === 'popular') {
    const soon = sortByComingDate(pool.filter(isComingSoon))
    const available = pool.filter((item) => !isComingSoon(item))
    const coming = rail(soon, POPULAR_RAIL)
    const comingIds = railIds(coming, POPULAR_RAIL)
    const watching = rail(sortByRating(available), POPULAR_RAIL)
    const watchingIds = railIds(watching, POPULAR_RAIL)
    const leftoverSoon = soon.filter((item) => !comingIds.has(item.id))
    const worthFill = sortByRating(available.filter((item) => !watchingIds.has(item.id)))
    const worth = rail(uniqueById([...leftoverSoon, ...worthFill]), POPULAR_RAIL)
    const worthIds = railIds(worth, POPULAR_RAIL)
    const newFlix = rail(
      sortByYear(available.filter((item) => !watchingIds.has(item.id) && !worthIds.has(item.id))),
      POPULAR_RAIL,
    )
    pushRow(rows, { id: 'coming', title: 'Coming Soon', items: coming })
    pushRow(rows, { id: 'watching', title: 'Everyone’s Watching', items: watching })
    pushRow(rows, { id: 'worth', title: 'Worth the Wait', items: worth })
    pushRow(rows, { id: 'new-flix', title: 'New on FLIX', items: newFlix })
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
    if (usesPersonalizedRecs(profile)) {
      pushRow(rows, {
        id: 'next-watch',
        title: 'Your Next Watch',
        items: rankByTaste(pool, profile),
      })
    }
    pushRow(rows, { id: 'new-movies', title: 'New Movies', items: sortByYear(movies) })
    pushRow(rows, { id: 'new-shows', title: 'New TV Shows', items: sortByYear(shows) })
    if (usesPersonalizedRecs(profile)) {
      for (const row of tasteGenreRails(pool, profile, kind, 2)) {
        pushRow(rows, { id: row.id, title: row.title, items: row.items })
      }
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
    items: historyPool.filter((item) => continueIds.has(item.id) && matchesGenre(item)),
    variant: 'continue',
    loop: false,
  })

  if (profile?.myList.length) {
    pushRow(rows, {
      id: 'mylist',
      title: 'My List',
      items: ofKind(likedToItems(profile.myList), kind).filter(matchesGenre),
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

  const newTitle = filter === 'movies' ? 'New Movies' : filter === 'shows' ? 'New TV Shows' : 'New Releases'
  const recUsed = new Set<string>()
  pushRecRow(
    rows,
    {
      id: 'only-flix',
      title: 'Only on FLIX',
      items: recommendRail(filter === 'movies' ? movies : filter === 'shows' ? shows : shows, profile),
    },
    recUsed,
  )
  pushRow(rows, { id: 'new', title: newTitle, items: sortByYear(pool) })

  pushRow(rows, {
    id: 'watch-again',
    title: 'Watch It Again',
    items: historyToListItems(becauseHistory.filter(finishedMovie)).filter(matchesGenre),
    loop: false,
  })

  if (usesPersonalizedRecs(profile)) {
    for (const row of becauseYouWatchedRows(pool, becauseHistory, filter === 'home' ? 3 : 4)) {
      if (row.seed) recUsed.add(row.seed.id)
      pushRecRow(
        rows,
        {
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          items: row.items.filter((item) => item.id !== row.seed?.id),
          seed: row.seed,
          loop: false,
        },
        recUsed,
      )
    }
  }

  if (filter === 'home') {
    pushRow(rows, { id: 'new-movies', title: 'New Movies', items: sortByYear(movies) })
    pushRow(rows, { id: 'new-shows', title: 'New TV Shows', items: sortByYear(shows) })
  }

  if (usesPersonalizedRecs(profile)) {
    for (const row of becauseYouLikedRows(pool, profile?.liked ?? [], 2)) {
      if (row.seed) recUsed.add(row.seed.id)
      pushRecRow(
        rows,
        {
          id: row.id,
          title: row.title,
          items: row.items.filter((item) => item.id !== row.seed?.id),
          seed: row.seed,
          loop: false,
        },
        recUsed,
      )
    }

    for (const row of tasteGenreRails(pool, profile, kind, 4)) {
      if (opts.genre && (isRomComGenre(opts.genre) ? row.id === 'genre-romcom' : row.id === `genre-${opts.genre}`)) {
        continue
      }
      pushRow(rows, { id: row.id, title: row.title, items: row.items })
    }
  }

  if (usesPersonalizedRecs(profile) && profile) {
    pushRow(rows, {
      id: 'picks',
      title: `Top Picks for ${profile.name}`,
      items: rankByTaste(pool, profile),
    })
  } else if (filter === 'home') {
    pushRow(rows, { id: 'movies', title: 'Movies', items: recommendRail(movies, profile) })
    pushRow(rows, { id: 'shows', title: 'TV Shows', items: recommendRail(shows, profile) })
  }

  return rows
}
