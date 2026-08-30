import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCatalogMany, getMovies, searchTitles } from '../api/client'
import type { MovieListItem } from '../api/types'
import { ErrorState } from '../components/ErrorState'
import { ClockIcon, CloseIcon } from '../components/Icons'
import { MediaGrid } from '../components/MediaGrid'
import { SearchHitsList } from '../components/SearchHitsList'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { sortByRating, uniqueById } from '../lib/media'
import { filterByMaturity } from '../lib/netflix'
import { catalogHits, rankSearchHits } from '../lib/searchHits'
import { clearRecentSearches, listRecentSearches, removeRecentSearch } from '../lib/recentSearch'
import { useProfiles } from '../profiles/ProfileContext'
import { relatedSearchResults } from '../profiles/taste'

export function Search() {
  const { activeProfile } = useProfiles()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const enabled = q.length >= 2
  const { data, error, loading, retry } = useFetch(() => searchTitles(q), q, { enabled })
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies', 8).catch(() => [] as MovieListItem[]),
      getCatalogMany('shows', 8).catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'search-catalog')
  const popular = useFetch(() => getMovies(), 'search-popular', { enabled: !enabled })
  const [recents, setRecents] = useState(listRecentSearches)
  const pool = useMemo(
    () => filterByMaturity(catalog.data ?? [], activeProfile),
    [catalog.data, activeProfile],
  )
  const hits = useMemo(() => {
    const fromApi = filterByMaturity(data ?? [], activeProfile)
    return rankSearchHits(q, uniqueById([...fromApi, ...catalogHits(q, pool)]))
  }, [data, q, pool, activeProfile])
  const related = useMemo(() => {
    const hitIds = new Set(hits.map((item) => item.id))
    return relatedSearchResults(hits, pool, activeProfile, 48).filter((item) => !hitIds.has(item.id))
  }, [hits, pool, activeProfile])
  const popularItems = useMemo(
    () => sortByRating(filterByMaturity(popular.data ?? [], activeProfile)).slice(0, 18),
    [popular.data, activeProfile],
  )
  const desktopItems = useMemo(() => uniqueById([...hits, ...related]), [hits, related])
  const phone = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    setRecents(listRecentSearches())
  }, [q])

  const recentBlock = useMemo(
    () =>
      recents.length ? (
        <div className="search-recents">
          <div className="search-recents-head">
            <h2 className="section-title">Recent Searches</h2>
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
          </div>
          <ul className="search-recent-list">
            {recents.slice(0, 5).map((entry) => (
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
        </div>
      ) : null,
    [recents, setParams],
  )

  if (!enabled) {
    return (
      <main className="page page-pad search-page">
        {recentBlock}
        {popularItems.length ? (
          <>
            <h2 className="section-title search-recommended-title">
              {phone ? 'Top Searches' : 'Recommended TV Shows and Movies'}
            </h2>
            {phone ? (
              <SearchHitsList items={popularItems.slice(0, 10)} ranked />
            ) : (
              <MediaGrid items={popularItems} layout="landscape" />
            )}
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

  if (error && !hits.length && !related.length) {
    return (
      <main className="page page-pad search-page">
        <ErrorState message={error} onRetry={retry} />
      </main>
    )
  }

  if (!hits.length && !related.length) {
    return (
      <main className="page page-pad search-page">
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
      </main>
    )
  }

  return (
    <main className="page page-pad search-page">
      {phone ? (
        <>
          {hits.length ? <SearchHitsList items={hits} /> : null}
          {related.length ? (
            <>
              <h1 className={`search-heading ${hits.length ? 'is-related' : ''}`}>
                Explore titles related to: <span>{q}</span>
              </h1>
              <SearchHitsList items={related} />
            </>
          ) : null}
        </>
      ) : (
        <>
          {!hits.length && related.length ? (
            <h1 className="search-heading">
              Explore titles related to: <span>{q}</span>
            </h1>
          ) : null}
          <MediaGrid items={desktopItems} layout="landscape" />
        </>
      )}
    </main>
  )
}
