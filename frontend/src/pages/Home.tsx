import { useEffect, useMemo, useState } from 'react'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Hero } from '../components/Hero'
import { MediaRow } from '../components/MediaRow'
import { Spinner } from '../components/Spinner'
import { TopTenRow } from '../components/TopTenRow'
import { useFetch } from '../hooks/useFetch'
import { buildBrowseRows, catalogGenres, type BrowseFilter } from '../lib/homeRows'
import { ofKind, pickHero, uniqueById } from '../lib/media'
import { isKidsSafe } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'

const HEADINGS: Record<BrowseFilter, string | null> = {
  home: null,
  movies: 'Movies',
  shows: 'TV Shows',
  popular: 'New & Popular',
}

export function Home({ filter = 'home' }: { filter?: BrowseFilter }) {
  const { activeProfile } = useProfiles()
  const [genre, setGenre] = useState('')
  const movies = useFetch(() => getMovies(), 'home-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return { catalogMovies, catalogShows }
  }, 'home-catalog')

  useEffect(() => {
    setGenre('')
  }, [filter])

  const catalog = useMemo(() => {
    const homeItems = movies.data ?? []
    const extraMovies = extras.data?.catalogMovies ?? []
    const extraShows = extras.data?.catalogShows ?? []
    const merged = uniqueById([...homeItems, ...extraMovies, ...extraShows])
    return activeProfile?.kids ? merged.filter(isKidsSafe) : merged
  }, [movies.data, extras.data, activeProfile?.kids])

  const kindPool = useMemo(
    () => ofKind(catalog, filter === 'home' || filter === 'popular' ? 'all' : filter),
    [catalog, filter],
  )
  const genres = useMemo(() => catalogGenres(kindPool), [kindPool])
  const pool = useMemo(
    () => (genre ? kindPool.filter((item) => (item.genres ?? []).includes(genre)) : kindPool),
    [kindPool, genre],
  )
  const hero = useMemo(() => (genre ? null : pickHero(pool)), [pool, genre])
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
    return <Spinner label="Loading titles" />
  }

  if (!catalog.length && movies.error) {
    return <ErrorState message={movies.error} onRetry={movies.retry} />
  }

  if (!kindPool.length) {
    const label = filter === 'shows' ? 'TV shows' : filter === 'movies' ? 'movies' : 'titles'
    const kids = Boolean(activeProfile?.kids)
    return (
      <EmptyState
        title={kids ? 'No Kids titles yet' : `No ${label} yet`}
        detail={
          kids
            ? 'Kids profiles only show Family and Animation titles. This catalog does not have any yet.'
            : 'The catalog API returned nothing for this view. Is it running on port 8090?'
        }
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
      </main>
    )
  }

  return (
    <main className={`page browse-page ${heading ? 'has-browse-heading' : ''}`}>
      {heading ? (
        <div className="browse-heading">
          <h1>{heading}</h1>
          {filter === 'movies' || filter === 'shows' ? (
            <label className="genre-select-wrap">
              <span className="visually-hidden">Genres</span>
              <select
                className="genre-select"
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                aria-label="Genres"
              >
                <option value="">Genres</option>
                {genres.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
      {hero ? <Hero item={hero} /> : null}
      {rows.map((row) =>
        row.variant === 'top10' ? (
          <TopTenRow key={row.id} title={row.title} items={row.items} />
        ) : (
          <MediaRow
            key={row.id}
            title={row.title}
            items={row.items}
            progressById={row.variant === 'continue' ? progressById : undefined}
            continueMode={row.variant === 'continue'}
            loop={row.loop}
          />
        ),
      )}
    </main>
  )
}
