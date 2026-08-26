import { useSearchParams } from 'react-router-dom'
import { searchTitles } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MediaGrid } from '../components/MediaGrid'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'

export function Search() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const enabled = q.length >= 2
  const { data, error, loading, retry } = useFetch(() => searchTitles(q), q, { enabled })

  if (!enabled) {
    return (
      <main className="page page-pad">
        <EmptyState title="Search for a title" detail="Type at least two characters in the header." />
      </main>
    )
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
      <h1 className="section-title">Search: “{q}”</h1>
      <p className="section-sub">
        {data?.length ?? 0} result{(data?.length ?? 0) === 1 ? '' : 's'}
      </p>
      {data?.length ? (
        <MediaGrid items={data} />
      ) : (
        <EmptyState title="No matches" detail="Try a different title." />
      )}
    </main>
  )
}
