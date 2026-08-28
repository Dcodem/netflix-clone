import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { CategoriesSheet } from '../components/CategoriesSheet'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Hero } from '../components/Hero'
import { CaretIcon } from '../components/Icons'
import { MediaRow } from '../components/MediaRow'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { buildBrowseRows, catalogGenres, type BrowseFilter } from '../lib/homeRows'
import { ofKind, pickHero, uniqueById } from '../lib/media'
import { useProfiles } from '../profiles/ProfileContext'

const HEADINGS: Record<BrowseFilter, string | null> = {
  home: null,
  movies: 'Movies',
  shows: 'TV Shows',
  popular: 'New & Popular',
}

export function Home({ filter = 'home' }: { filter?: BrowseFilter }) {
  const { activeProfile } = useProfiles()
  const [params, setParams] = useSearchParams()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const genre = params.get('genre') ?? ''
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

  const catalog = useMemo(() => {
    const homeItems = movies.data ?? []
    const extraMovies = extras.data?.catalogMovies ?? []
    const extraShows = extras.data?.catalogShows ?? []
    const merged = uniqueById([...homeItems, ...extraMovies, ...extraShows])
    return merged
  }, [movies.data, extras.data])

  const kindPool = useMemo(
    () => ofKind(catalog, filter === 'home' || filter === 'popular' ? 'all' : filter),
    [catalog, filter],
  )
  const genres = useMemo(() => catalogGenres(kindPool), [kindPool])
  const pool = useMemo(
    () => (genre ? kindPool.filter((item) => (item.genres ?? []).includes(genre)) : kindPool),
    [kindPool, genre],
  )
  const hero = useMemo(() => pickHero(pool), [pool])
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
  const heading = HEADINGS[filter]

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
          <div className="browse-heading">
            <h1>{heading}</h1>
          </div>
        ) : null}
        <EmptyState title="No titles in this genre" detail="Pick another genre from the menu." />
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
        <div className="browse-heading">
          <h1>{heading}</h1>
          {filter === 'movies' || filter === 'shows' ? (
            <button
              type="button"
              className={`genre-select ${genre ? 'is-on' : ''}`}
              onClick={() => setCategoriesOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={categoriesOpen}
            >
              {genre || 'Genres'}
              <CaretIcon className="icon" />
            </button>
          ) : null}
        </div>
      ) : null}
      {filter === 'home' ? (
        <div className="home-pills" aria-label="Categories">
          {genre ? (
            <button type="button" className="is-on" onClick={() => setCategoriesOpen(true)}>
              {genre}
              <CaretIcon className="icon" />
            </button>
          ) : null}
          <Link to="/browse/shows">TV Shows</Link>
          <Link to="/browse/movies">Movies</Link>
          <button type="button" onClick={() => setCategoriesOpen(true)}>
            Categories
          </button>
        </div>
      ) : null}
      {hero ? <Hero item={hero} /> : null}
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
