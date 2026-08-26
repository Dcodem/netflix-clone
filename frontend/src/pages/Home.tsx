import { useMemo } from 'react'
import { getCatalog, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Hero } from '../components/Hero'
import { MediaGrid } from '../components/MediaGrid'
import { MediaRow } from '../components/MediaRow'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { genresOf, pickHero, sortByRating, sortByYear, uniqueById } from '../lib/media'
import { useProfiles } from '../profiles/ProfileContext'
import { rankByTaste } from '../profiles/taste'

function genreRows(items: MovieListItem[], limit = 4): { genre: string; items: MovieListItem[] }[] {
  const counts = new Map<string, MovieListItem[]>()
  for (const item of items) {
    for (const genre of genresOf(item)) {
      const list = counts.get(genre) ?? []
      list.push(item)
      counts.set(genre, list)
    }
  }
  return [...counts.entries()]
    .map(([genre, list]) => ({ genre, items: uniqueById(list) }))
    .filter((row) => row.items.length >= 4)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, limit)
}

export function Home() {
  const { activeProfile } = useProfiles()
  const movies = useFetch(() => getMovies(), 'home-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalog('movies').catch(() => [] as MovieListItem[]),
      getCatalog('shows').catch(() => [] as MovieListItem[]),
    ])
    return { catalogMovies, catalogShows }
  }, 'home-catalog')

  const catalog = useMemo(() => {
    const homeItems = movies.data ?? []
    const extraMovies = extras.data?.catalogMovies ?? []
    const extraShows = extras.data?.catalogShows ?? []
    return uniqueById([...homeItems, ...extraMovies, ...extraShows])
  }, [movies.data, extras.data])

  const hero = useMemo(() => pickHero(movies.data ?? []), [movies.data])
  const continueWatching = (activeProfile?.history ?? []).slice(0, 18)
  const picks = useMemo(
    () => rankByTaste(catalog, activeProfile?.history ?? []).slice(0, 18),
    [catalog, activeProfile],
  )
  const trending = useMemo(() => sortByRating(catalog).slice(0, 18), [catalog])
  const newest = useMemo(() => sortByYear(catalog).slice(0, 18), [catalog])
  const shows = useMemo(
    () => (extras.data?.catalogShows.length ? extras.data.catalogShows : catalog.filter((item) => item.kind === 'show')).slice(0, 18),
    [catalog, extras.data],
  )
  const rows = useMemo(() => genreRows(catalog), [catalog])

  if (movies.loading && !movies.data) {
    return <Spinner label="Loading titles" />
  }

  if (movies.error) {
    return <ErrorState message={movies.error} onRetry={movies.retry} />
  }

  if (!movies.data?.length) {
    return (
      <EmptyState
        title="Nothing to show yet"
        detail="The catalog API returned no titles. Is it running on port 8090?"
      />
    )
  }

  return (
    <main className="page">
      {hero ? <Hero item={hero} /> : null}
      <MediaRow
        title="Continue Watching"
        items={continueWatching.map((item) => ({
          id: item.id,
          title: item.title,
          kind: item.kind,
          poster_url: item.poster_url,
          genres: item.genres,
          href: `/${item.kind === 'show' ? 'shows' : 'movies'}/view/${item.id}`,
        }))}
      />
      {picks.length ? (
        <MediaRow title={`Top Picks for ${activeProfile?.name ?? 'You'}`} items={picks} />
      ) : null}
      <MediaRow title="Trending" items={trending} />
      <MediaRow title="New Releases" items={newest} />
      <MediaRow title="Shows" items={shows} />
      {rows.map((row) => (
        <MediaRow key={row.genre} title={row.genre} items={row.items.slice(0, 18)} />
      ))}
      <h2 className="section-title">All titles</h2>
      <MediaGrid items={movies.data} />
    </main>
  )
}
