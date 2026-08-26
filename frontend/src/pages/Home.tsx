import { useMemo } from 'react'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Hero } from '../components/Hero'
import { MediaRow } from '../components/MediaRow'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { buildBrowseRows, type BrowseFilter } from '../lib/homeRows'
import { ofKind, pickHero, uniqueById } from '../lib/media'
import { useProfiles } from '../profiles/ProfileContext'

export function Home({ filter = 'home' }: { filter?: BrowseFilter }) {
  const { activeProfile } = useProfiles()
  const movies = useFetch(() => getMovies(), 'home-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return { catalogMovies, catalogShows }
  }, 'home-catalog')

  const catalog = useMemo(() => {
    const homeItems = movies.data ?? []
    const extraMovies = extras.data?.catalogMovies ?? []
    const extraShows = extras.data?.catalogShows ?? []
    return uniqueById([...homeItems, ...extraMovies, ...extraShows])
  }, [movies.data, extras.data])

  const pool = useMemo(
    () => ofKind(catalog, filter === 'home' ? 'all' : filter),
    [catalog, filter],
  )
  const hero = useMemo(() => pickHero(pool), [pool])
  const rows = useMemo(
    () =>
      buildBrowseRows({
        catalog,
        filter,
        profile: activeProfile,
      }),
    [catalog, filter, activeProfile],
  )

  const loading = (movies.loading && !movies.data) || (extras.loading && !extras.data)
  if (loading && !catalog.length) {
    return <Spinner label="Loading titles" />
  }

  if (!catalog.length && movies.error) {
    return <ErrorState message={movies.error} onRetry={movies.retry} />
  }

  if (!pool.length) {
    const label = filter === 'shows' ? 'TV shows' : filter === 'movies' ? 'movies' : 'titles'
    return (
      <EmptyState
        title={`No ${label} yet`}
        detail="The catalog API returned nothing for this view. Is it running on port 8090?"
      />
    )
  }

  return (
    <main className="page browse-page">
      {hero ? <Hero item={hero} /> : null}
      {rows.map((row) => (
        <MediaRow key={row.id} title={row.title} items={row.items} />
      ))}
    </main>
  )
}
