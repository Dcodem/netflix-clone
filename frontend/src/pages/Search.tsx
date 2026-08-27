import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCatalogMany, getMovies, searchTitles } from '../api/client'
import type { MovieListItem } from '../api/types'
import { ErrorState } from '../components/ErrorState'
import { CatalogImage } from '../components/CatalogImage'
import { ClockIcon, CloseIcon } from '../components/Icons'
import { MediaGrid } from '../components/MediaGrid'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { sortByRating, uniqueById } from '../lib/media'
import { clearRecentSearches, listRecentSearches, removeRecentSearch } from '../lib/recentSearch'
import { useProfiles } from '../profiles/ProfileContext'
import { relatedSearchResults } from '../profiles/taste'

function catalogHits(query: string, catalog: MovieListItem[]): MovieListItem[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  return catalog.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      (item.genres ?? []).some((genre) => genre.toLowerCase().includes(needle)),
  )
}

export function Search() {
  const { activeProfile } = useProfiles()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const enabled = q.length >= 2
  const { data, error, loading, retry } = useFetch(() => searchTitles(q), q, { enabled })
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies', 5).catch(() => [] as MovieListItem[]),
      getCatalogMany('shows', 5).catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'search-catalog')
  const popular = useFetch(() => getMovies(), 'search-popular', { enabled: !enabled })
  const [recents, setRecents] = useState(listRecentSearches)
  const pool = useMemo(() => catalog.data ?? [], [catalog.data])
  const hits = useMemo(() => {
    const fromApi = data ?? []
    return uniqueById([...fromApi, ...catalogHits(q, pool)])
  }, [data, q, pool])
  const items = useMemo(
    () => relatedSearchResults(hits, pool, activeProfile, 48),
    [hits, pool, activeProfile],
  )
  const popularItems = useMemo(
    () => sortByRating(popular.data ?? []).slice(0, 18),
    [popular.data],
  )

  useEffect(() => {
    setRecents(listRecentSearches())
  }, [q])

  const recentBlock = useMemo(
    () => (
      <div className="search-recents">
        <div className="search-recents-head">
          <h2 className="section-title">Recent Searches</h2>
          {recents.length ? (
            <button
              type="button"
              className="search-clear-all"
              onClick={() => {
                clearRecentSearches()
                setRecents([])
              }}
            >
              Clear All
            </button>
          ) : null}
        </div>
        {recents.length ? (
          <ul className="search-recent-list">
            {recents.map((entry) => (
              <li key={entry}>
                <button type="button" onClick={() => setParams({ q: entry })}>
                  <ClockIcon className="icon" />
                  <span>{entry}</span>
                </button>
                <button
                  type="button"
                  className="search-recent-forget"
                  aria-label={`Remove ${entry}`}
                  onClick={() => {
                    removeRecentSearch(entry)
                    setRecents(listRecentSearches())
                  }}
                >
                  <CloseIcon className="icon" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Searches stay on this device. Type two characters to look up a title.</p>
        )}
      </div>
    ),
    [recents, setParams],
  )

  if (!enabled) {
    return (
      <main className="page page-pad search-page">
        {recentBlock}
        {popularItems.length ? (
          <>
            <h2 className="section-title">Popular Searches</h2>
            <ol className="search-top">
              {popularItems.slice(0, 10).map((item, index) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setParams({ q: item.title })}>
                    <span className="search-top-rank">{index + 1}</span>
                    <span className="search-top-poster">
                      <CatalogImage item={item} alt="" prefer="poster" />
                    </span>
                    {item.title}
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </main>
    )
  }

  if (loading && !hits.length) {
    return (
      <main className="page page-pad search-page">
        <Spinner label={`Searching “${q}”`} />
      </main>
    )
  }

  if (error) {
    return (
      <main className="page page-pad search-page">
        <ErrorState message={error} onRetry={retry} />
      </main>
    )
  }

  return (
    <main className="page page-pad search-page">
      {items.length ? (
        <>
          <h1 className="search-heading">
            Explore titles related to: <span>{q}</span>
          </h1>
          <MediaGrid items={items} layout="poster" />
        </>
      ) : (
        <>
          <div className="search-empty">
            <p>Your search for “{q}” did not have any matches.</p>
            <p className="search-empty-kicker">Suggestions:</p>
            <ul>
              <li>Try different keywords</li>
              <li>Looking for a movie or TV show?</li>
              <li>Try using a movie, TV show title, an actor or director</li>
              <li>Try a genre, like comedy, romance, sports, or drama</li>
            </ul>
          </div>
          {recentBlock}
        </>
      )}
    </main>
  )
}
