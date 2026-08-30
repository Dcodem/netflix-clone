import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { CategoriesSheet } from '../components/CategoriesSheet'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { GenreSelect } from '../components/GenreSelect'
import { Hero } from '../components/Hero'
import { MediaRow } from '../components/MediaRow'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
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

  const catalog = useMemo(() => {
    const homeItems = movies.data ?? []
    const extraMovies = extras.data?.catalogMovies ?? []
    const extraShows = extras.data?.catalogShows ?? []
    const merged = uniqueById([...homeItems, ...extraMovies, ...extraShows])
    return filterByMaturity(merged, activeProfile)
  }, [movies.data, extras.data, activeProfile])

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
  const hero = useMemo(() => pickHero(top10.length ? top10 : pool), [top10, pool])
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
  const rows = useMemo(
    () =>
      buildBrowseRows({
        catalog,
        filter,
        profile: activeProfile,
        genre,
      }),
    [catalog, filter, activeProfile, genre],
  )
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
          seed={row.seed}
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
