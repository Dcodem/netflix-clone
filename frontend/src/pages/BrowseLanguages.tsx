import { useMemo, useState } from 'react'
import { getCatalogMany } from '../api/client'
import type { MovieListItem } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { CaretIcon } from '../components/Icons'
import { MediaGrid } from '../components/MediaGrid'
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
import { useProfiles } from '../profiles/ProfileContext'

export function BrowseLanguages() {
  const { activeProfile } = useProfiles()
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [sort, setSort] = useState<LanguageSort>('suggestions')
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'browse-languages')

  const items = useMemo(() => {
    const pool = titlesInLanguage(catalog.data ?? [], language)
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
          <label className="lang-select">
            <span>Original Language</span>
            <span className="lang-select-row">
              <select
                value={language}
                aria-label="Original Language"
                onChange={(event) => setLanguage(event.target.value as LanguageCode)}
              >
                {ORIGINAL_LANGUAGES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <CaretIcon className="icon" />
            </span>
          </label>
          <label className="lang-select">
            <span>Sort by</span>
            <span className="lang-select-row">
              <select
                value={sort}
                aria-label="Sort by"
                onChange={(event) => setSort(event.target.value as LanguageSort)}
              >
                {LANGUAGE_SORTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <CaretIcon className="icon" />
            </span>
          </label>
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
