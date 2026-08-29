import { useMemo, useState } from 'react'
import { getCatalogMany } from '../api/client'
import type { MovieListItem } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MediaGrid } from '../components/MediaGrid'
import { OutlineSelect } from '../components/OutlineSelect'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import {
  LANGUAGE_SORTS,
  ORIGINAL_LANGUAGES,
  sortLanguageTitles,
  titlesInLanguage,
  type LanguageCode,
  type LanguageSort,
} from '../lib/languages'
import { uniqueById } from '../lib/media'
import { filterByMaturity, profileLanguageCode } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'

export function BrowseLanguages() {
  const { activeProfile } = useProfiles()
  const [language, setLanguage] = useState<LanguageCode>(profileLanguageCode(activeProfile?.language))
  const [sort, setSort] = useState<LanguageSort>('suggestions')
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'browse-languages')

  const items = useMemo(() => {
    const pool = titlesInLanguage(filterByMaturity(catalog.data ?? [], activeProfile), language)
    return sortLanguageTitles(pool, sort, activeProfile)
  }, [catalog.data, language, sort, activeProfile])

  if (catalog.loading && !catalog.data) {
    return (
      <main className="page page-pad languages-page">
        <Spinner label="Loading titles" />
      </main>
    )
  }

  if (!catalog.data?.length && catalog.error) {
    return <ErrorState message={catalog.error} onRetry={catalog.retry} />
  }

  return (
    <main className="page page-pad languages-page">
      <header className="languages-head">
        <h1>Browse by Languages</h1>
        <div className="languages-filters">
          <OutlineSelect
            label="Original Language"
            value={language}
            searchable
            searchPlaceholder="Search languages"
            options={ORIGINAL_LANGUAGES.map((entry) => ({ value: entry.code, label: entry.label }))}
            onChange={(next) => setLanguage(next as LanguageCode)}
          />
          <OutlineSelect
            label="Sort by"
            value={sort}
            options={LANGUAGE_SORTS.map((entry) => ({ value: entry.id, label: entry.label }))}
            onChange={(next) => setSort(next as LanguageSort)}
          />
        </div>
      </header>
      {items.length ? (
        <MediaGrid items={items} layout="poster" hoverable={false} />
      ) : (
        <EmptyState title="No titles in this language" detail="Pick another original language." />
      )}
    </main>
  )
}
