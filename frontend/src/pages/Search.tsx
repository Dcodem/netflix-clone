import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCatalogMany, getMovies, searchTitles } from '../api/client'
import type { MovieListItem } from '../api/types'
import { ErrorState } from '../components/ErrorState'
import { CatalogImage } from '../components/CatalogImage'
import { ClockIcon } from '../components/Icons'
import { MediaGrid } from '../components/MediaGrid'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { isMovie, isShow, sortByRating, uniqueById } from '../lib/media'
import { clearRecentSearches, listRecentSearches } from '../lib/recentSearch'
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
  const kind = params.get('kind') ?? 'all'
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
  const filtered = useMemo(() => {
    if (kind === 'shows') return items.filter(isShow)
    if (kind === 'movies') return items.filter(isMovie)
    if (kind === 'list') {
      const ids = new Set(activeProfile?.myList.map((entry) => entry.id) ?? [])
      return items.filter((item) => ids.has(item.id))
    }
    return items
  }, [items, kind, activeProfile])
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
              className="btn btn-ghost"
              onClick={() => {
                clearRecentSearches()
                setRecents([])
              }}
            >
              Clear
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

  const waitingRelated = !error && catalog.loading && hits.length > 0 && hits.length < 12
  if (loading || waitingRelated) {
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
          <div className="search-filters" role="tablist" aria-label="Filter results">
            {[
              { id: 'all', label: 'All' },
              { id: 'shows', label: 'TV Shows' },
              { id: 'movies', label: 'Movies' },
              { id: 'list', label: 'My List' },
            ].map((filter) => (
              <button
                type="button"
                key={filter.id}
                role="tab"
                aria-selected={kind === filter.id}
                className={kind === filter.id ? 'is-on' : ''}
                onClick={() => {
                  const next = new URLSearchParams(params)
                  if (filter.id === 'all') next.delete('kind')
                  else next.set('kind', filter.id)
                  setParams(next, { replace: true })
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {filtered.length ? (
            <MediaGrid items={filtered} layout="poster" />
          ) : (
            <p className="section-sub">No titles in this filter. Try All, or another category.</p>
          )}
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
