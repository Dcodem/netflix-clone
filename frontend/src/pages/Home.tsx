import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCatalogMany, getMovies, getNetflixTop10, getRails, getTrending } from '../api/client'
import type { HomeRail, MovieListItem, NetflixTop10Entry } from '../api/types'
import { CategoriesSheet } from '../components/CategoriesSheet'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { GenreSelect } from '../components/GenreSelect'
import { Hero } from '../components/Hero'
import { MediaRow } from '../components/MediaRow'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { isComingSoon } from '../lib/comingSoon'
import { useCatalogEnrichment } from '../trailers/useCatalogEnrichment'
import { buildBrowseRows, catalogGenres, exploreHrefForRow, type BrowseFilter } from '../lib/homeRows'
import { matchesGenreFilter } from '../profiles/taste'
import { isShow, ofKind, pickHero, sortByRating, uniqueById } from '../lib/media'
import { filterByMaturity } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'

const HEADINGS: Record<BrowseFilter, string | null> = {
  home: null,
  movies: 'Movies',
  shows: 'TV Shows',
  popular: null,
}

export function Home({ filter = 'home' }: { filter?: BrowseFilter }) {
  const { activeProfile } = useProfiles()
  const [params, setParams] = useSearchParams()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [headingStuck, setHeadingStuck] = useState(false)
  const desktop = useMediaQuery('(min-width: 768px)')
  const genre = params.get('genre') ?? ''
  const heading = filter === 'home' && genre ? genre : HEADINGS[filter]
  const movies = useFetch(() => getMovies(), 'home-movies')
  const trending = useFetch(() => getTrending('all').catch(() => [] as MovieListItem[]), 'home-trending')
  const railsData = useFetch(() => getRails('CA').catch(() => [] as HomeRail[]), 'home-rails')
  const netflixTop10 = useFetch(() => getNetflixTop10().catch(() => [] as NetflixTop10Entry[]), 'home-nf10')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return { catalogMovies, catalogShows }
  }, 'home-catalog')

  function setGenre(next: string) {
    const nextParams = new URLSearchParams(params)
    if (next) nextParams.set('genre', next)
    else nextParams.delete('genre')
    setParams(nextParams, { replace: true })
  }

  const useGenreMenu = desktop && (filter === 'movies' || filter === 'shows' || Boolean(heading && genre && filter === 'home'))

  useEffect(() => {
    if (!heading) {
      setHeadingStuck(false)
      return
    }
    const onScroll = () => setHeadingStuck(window.scrollY > 72)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [heading])

  const source = useMemo(() => {
    const homeItems = movies.data ?? []
    const extraMovies = extras.data?.catalogMovies ?? []
    const extraShows = extras.data?.catalogShows ?? []
    const merged = uniqueById([...homeItems, ...extraMovies, ...extraShows])
    return filterByMaturity(merged, activeProfile)
  }, [movies.data, extras.data, activeProfile])
  const catalog = useCatalogEnrichment(source)

  const kindPool = useMemo(
    () => ofKind(catalog, filter === 'home' || filter === 'popular' ? 'all' : filter),
    [catalog, filter],
  )
  const genres = useMemo(() => catalogGenres(kindPool), [kindPool])
  const pool = useMemo(
    () => (genre ? kindPool.filter((item) => matchesGenreFilter(item, genre)) : kindPool),
    [kindPool, genre],
  )
  const top10 = useMemo(() => sortByRating(pool).slice(0, 10), [pool])
  const hero = useMemo(() => {
    const source = top10.length ? top10 : pool
    const playable = source.filter((item) => !isComingSoon(item))
    return pickHero(playable.length ? playable : source)
  }, [top10, pool])
  const heroRank = useMemo(() => {
    if (!hero) return 0
    const index = top10.findIndex((item) => item.id === hero.id)
    return index >= 0 ? index + 1 : 0
  }, [hero, top10])
  const heroRankLabel =
    filter === 'movies'
      ? 'Movies Today'
      : filter === 'shows' || (hero ? isShow(hero) : false)
        ? 'TV Shows Today'
        : 'Movies Today'
  const rows = useMemo(() => {
    const built = buildBrowseRows({
      catalog,
      filter,
      profile: activeProfile,
      genre,
    })
    // Netflix's real hours-viewed Top 10 leads the home page. On the Movies /
    // TV Shows pages every rail shows that kind only — server rails arrive
    // unfiltered and would mix TV into the Movies page.
    const kindFilter = (items: MovieListItem[]) =>
      genre
        ? items.filter((item) => matchesGenreFilter(item, genre))
        : ofKind(items, filter === 'movies' ? 'movies' : filter === 'shows' ? 'shows' : 'all')
    const nfRail = netflixTop10.data ?? []
    if (nfRail.length >= 4 && filter !== 'popular') {
      const items = kindFilter(nfRail.map((entry) => entry.item))
      if (items.length >= 4) {
        const idx = built.findIndex((row) => row.id === 'continue')
        built.splice(idx >= 0 ? idx + 1 : 0, 0, {
          id: 'netflix-top10',
          title: 'Top 10 on Netflix This Week',
          subtitle: 'Ranked by hours viewed — matches playable titles',
          items,
          loop: items.length >= 8,
        })
      }
    }
    // Server rails (ranking engine) replace the local trending row and append.
    const byTitle = new Map<string, HomeRail>()
    for (const rail of railsData.data ?? []) byTitle.set(rail.id, rail)
    const localTrendIdx = built.findIndex((row) => row.id === 'trending')
    if (localTrendIdx >= 0) built.splice(localTrendIdx, 1)
    const trendingRail = byTitle.get('trending')
    if (trendingRail && trendingRail.items.length >= 4) {
      const items = kindFilter(trendingRail.items)
      if (items.length >= 4) {
        const idx = built.findIndex((row) => row.id === 'continue')
        built.splice(idx >= 0 ? idx + 1 : 0, 0, {
          id: 'trending-world',
          title: trendingRail.title,
          subtitle: 'What the world is watching this week',
          items,
          loop: items.length >= 8,
        })
      }
    }
    const tailRails: Array<[string, string, 'top10' | undefined]> = [
      ['popular_ca', 'Popular in Canada', undefined],
      ['top10_movies', 'Top 10 Movies Today', 'top10'],
      ['top10_tv', 'Top 10 TV Shows Today', 'top10'],
      ['new', 'New Releases', undefined],
      ['gems', 'Hidden Gems', undefined],
    ]
    for (const [railId, fallbackTitle, variant] of tailRails) {
      const rail = byTitle.get(railId)
      if (!rail || rail.items.length < 4) continue
      if (built.some((row) => row.id === railId)) continue
      const items = kindFilter(rail.items)
      if (items.length < 4) continue
      built.push({
        id: railId,
        title: rail.title || fallbackTitle,
        items,
        loop: items.length >= 8,
        ...(variant ? { variant } : {}),
      })
    }
    // On the TV Shows page the NA-trend Top 10 (Reacher, Silo, …) replaces
    // the local taste-ranked one — it's what North America is actually
    // watching. Hoist it to lead the page and drop the local lookalike.
    if (filter === 'shows') {
      const naIdx = built.findIndex((row) => row.id === 'top10_tv')
      if (naIdx >= 0) {
        const naRail = built[naIdx]
        built.splice(naIdx, 1)
        const localIdx = built.findIndex((row) => row.id === 'top10')
        if (localIdx >= 0) built.splice(localIdx, 1)
        const anchor = built.findIndex((row) => row.id === 'continue')
        built.splice(anchor >= 0 ? anchor + 1 : 0, 0, { ...naRail, title: 'Top 10 TV Shows in the U.S. Today' })
      }
    }
    return built
  }, [catalog, filter, activeProfile, genre, trending.data, railsData.data])
  const progressById = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of activeProfile?.history ?? []) {
      if (item.progress) map[item.id] = item.progress
    }
    return map
  }, [activeProfile])

  const loading = (movies.loading && !movies.data) || (extras.loading && !extras.data)
  if (loading && !catalog.length) {
    return (
      <main className="page browse-page">
        <Spinner label="Loading titles" />
      </main>
    )
  }

  if (!catalog.length && movies.error) {
    return <ErrorState message={movies.error} onRetry={movies.retry} />
  }

  if (!kindPool.length) {
    const label = filter === 'shows' ? 'TV shows' : filter === 'movies' ? 'movies' : 'titles'
    return (
      <EmptyState
        title={`No ${label} yet`}
        detail="The catalog API returned nothing for this view. Is it running on port 8090?"
      />
    )
  }

  if (!pool.length) {
    return (
      <main className="page browse-page has-browse-heading">
        {heading ? (
          <div className={`browse-heading ${headingStuck ? 'is-stuck' : ''}`}>
            <h1>{heading}</h1>
            {filter === 'movies' || filter === 'shows' || (filter === 'home' && genre) ? (
              <GenreSelect
                value={genre}
                genres={genres}
                onChange={setGenre}
                useMenu={useGenreMenu}
                onFallback={() => setCategoriesOpen(true)}
                buttonLabel={filter === 'home' && genre ? 'Genres' : undefined}
              />
            ) : null}
          </div>
        ) : null}
        <EmptyState title="No titles in this genre." />
        <CategoriesSheet
          open={categoriesOpen}
          onClose={() => setCategoriesOpen(false)}
          genres={genres}
          selected={genre}
          onSelect={setGenre}
          variant={filter === 'home' ? 'categories' : 'genres'}
        />
      </main>
    )
  }

  return (
    <main className={`page browse-page ${heading ? 'has-browse-heading' : ''}`}>
      {heading ? (
        <div className={`browse-heading ${headingStuck ? 'is-stuck' : ''}`}>
          <h1>{heading}</h1>
          {filter === 'movies' || filter === 'shows' || (filter === 'home' && genre) ? (
            <GenreSelect
              value={genre}
              genres={genres}
              onChange={setGenre}
              useMenu={useGenreMenu}
              onFallback={() => setCategoriesOpen(true)}
              buttonLabel={filter === 'home' && genre ? 'Genres' : undefined}
            />
          ) : null}
        </div>
      ) : null}
      {filter === 'home' && !genre ? (
        <div className="home-pills" aria-label="Categories">
          <Link to="/browse/shows">TV Shows</Link>
          <Link to="/browse/movies">Movies</Link>
          <button type="button" onClick={() => setCategoriesOpen(true)}>
            Categories
          </button>
        </div>
      ) : null}
      {hero && filter !== 'popular' ? (
        <Hero item={hero} rank={heroRank || undefined} rankLabel={heroRank ? heroRankLabel : undefined} />
      ) : null}
      {rows.map((row) => (
        <MediaRow
          key={row.id}
          title={row.title}
          subtitle={row.subtitle}
          items={row.items}
          progressById={row.variant === 'continue' ? progressById : undefined}
          continueMode={row.variant === 'continue'}
          variant={row.variant}
          loop={row.loop}
          hoverable={desktop}
          exploreTo={exploreHrefForRow(row)}
        />
      ))}
      <CategoriesSheet
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        genres={genres}
        selected={genre}
        onSelect={setGenre}
        variant={filter === 'home' ? 'categories' : 'genres'}
      />
    </main>
  )
}
