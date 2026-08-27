import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchTitles } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MediaGrid } from '../components/MediaGrid'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { filterForProfile } from '../lib/netflix'
import { clearRecentSearches, listRecentSearches } from '../lib/recentSearch'
import { useProfiles } from '../profiles/ProfileContext'

export function Search() {
  const { activeProfile } = useProfiles()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const enabled = q.length >= 2
  const { data, error, loading, retry } = useFetch(() => searchTitles(q), q, { enabled })
  const [recents, setRecents] = useState(listRecentSearches)
  const items = useMemo(() => filterForProfile(data ?? [], activeProfile), [data, activeProfile])

  useEffect(() => {
    setRecents(listRecentSearches())
  }, [q])

  const recentBlock = useMemo(
    () => (
      <div className="search-recents">
        <div className="search-recents-head">
          <h2 className="section-title">Recent searches</h2>
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
          <div className="search-recent-chips">
            {recents.map((entry) => (
              <button
                type="button"
                key={entry}
                className="taste-chip"
                onClick={() => setParams({ q: entry })}
              >
                {entry}
              </button>
            ))}
          </div>
        ) : (
          <p className="section-sub">Searches stay on this device. Type two characters to look up a title.</p>
        )}
      </div>
    ),
    [recents, setParams],
  )

  if (!enabled) {
    return <main className="page page-pad">{recentBlock}</main>
  }

  if (loading) {
    return (
      <main className="page page-pad">
        <Spinner label={`Searching “${q}”`} />
      </main>
    )
  }

  if (error) {
    return (
      <main className="page page-pad">
        <ErrorState message={error} onRetry={retry} />
      </main>
    )
  }

  return (
    <main className="page page-pad">
      {items.length ? (
        <>
          <h1 className="search-heading">Explore titles related to &ldquo;{q}&rdquo;</h1>
          <MediaGrid items={items} />
        </>
      ) : (
        <>
          <EmptyState title="Your search did not have any matches." detail="Try a different title, actor, or genre." />
          {recentBlock}
        </>
      )}
    </main>
  )
}
