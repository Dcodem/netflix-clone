import { useEffect, useMemo, useState } from 'react'
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
import { useMediaQuery } from '../hooks/useMediaQuery'
import { buildBrowseRows, catalogGenres, type BrowseFilter } from '../lib/homeRows'
import { ofKind, pickHero, uniqueById } from '../lib/media'
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
  const [genreMenuOpen, setGenreMenuOpen] = useState(false)
  const [headingStuck, setHeadingStuck] = useState(false)
  const desktop = useMediaQuery('(min-width: 768px)')
  const genre = params.get('genre') ?? ''
  const heading = HEADINGS[filter]
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
    setGenreMenuOpen(false)
  }

  const useGenreMenu = desktop && (filter === 'movies' || filter === 'shows')

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

  useEffect(() => {
    setGenreMenuOpen(false)
  }, [filter, genre])

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
        <div className={`browse-heading ${headingStuck ? 'is-stuck' : ''}`}>
          <h1>{heading}</h1>
          {filter === 'movies' || filter === 'shows' ? (
            <div className="genre-select-wrap">
              <button
                type="button"
                className={`genre-select ${genre ? 'is-on' : ''} ${genreMenuOpen ? 'is-open' : ''}`}
                onClick={() => (useGenreMenu ? setGenreMenuOpen((value) => !value) : setCategoriesOpen(true))}
                aria-haspopup={useGenreMenu ? 'listbox' : 'dialog'}
                aria-expanded={useGenreMenu ? genreMenuOpen : categoriesOpen}
              >
                {genre || 'Genres'}
                <CaretIcon className="icon" />
              </button>
              {useGenreMenu && genreMenuOpen ? (
                <>
                  <button
                    type="button"
                    className="genre-menu-scrim"
                    aria-label="Close genres"
                    onClick={() => setGenreMenuOpen(false)}
                  />
                  <div className="genre-menu" role="listbox" aria-label="Genres">
                    <button type="button" className={!genre ? 'is-on' : ''} onClick={() => setGenre('')}>
                      All Genres
                    </button>
                    {genres.map((entry) => (
                      <button
                        type="button"
                        key={entry}
                        className={genre === entry ? 'is-on' : ''}
                        onClick={() => setGenre(entry)}
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
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
