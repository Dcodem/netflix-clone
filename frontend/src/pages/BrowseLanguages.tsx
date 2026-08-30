import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCatalogMany } from '../api/client'
import type { MovieListItem } from '../api/types'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MediaGrid } from '../components/MediaGrid'
import { OutlineSelect } from '../components/OutlineSelect'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  LANGUAGE_SORTS,
  ORIGINAL_LANGUAGES,
  originalLanguageOf,
  sortLanguageTitles,
  titlesInLanguage,
  type LanguageCode,
  type LanguageSort,
} from '../lib/languages'
import { uniqueById } from '../lib/media'
import { filterByMaturity, profileLanguageCode } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'

function isLanguageCode(value: string | null): value is LanguageCode {
  return Boolean(value && ORIGINAL_LANGUAGES.some((entry) => entry.code === value))
}

export function BrowseLanguages() {
  const { activeProfile } = useProfiles()
  const desktop = useMediaQuery('(min-width: 768px)')
  const [params, setParams] = useSearchParams()
  const langParam = params.get('lang')
  const picked = isLanguageCode(langParam) ? langParam : null
  const language = picked ?? (desktop ? profileLanguageCode(activeProfile?.language) : null)
  const [sort, setSort] = useState<LanguageSort>('suggestions')
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'browse-languages')

  const items = useMemo(() => {
    if (!language) return []
    const pool = titlesInLanguage(filterByMaturity(catalog.data ?? [], activeProfile), language)
    return sortLanguageTitles(pool, sort, activeProfile)
  }, [catalog.data, language, sort, activeProfile])

  const tileArt = useMemo(() => {
    const pool = filterByMaturity(catalog.data ?? [], activeProfile)
    const art = new Map<LanguageCode, MovieListItem>()
    for (const item of pool) {
      const code = originalLanguageOf(item)
      if (!art.has(code)) art.set(code, item)
    }
    return art
  }, [catalog.data, activeProfile])

  function pickLanguage(code: LanguageCode) {
    const next = new URLSearchParams(params)
    next.set('lang', code)
    setParams(next)
  }

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

  if (!language) {
    return (
      <main className="page page-pad languages-page">
        <header className="languages-head">
          <h1>Browse by Languages</h1>
        </header>
        <div className="languages-tiles" role="list">
          {ORIGINAL_LANGUAGES.map((entry) => {
            const art = tileArt.get(entry.code)
            return (
              <button
                key={entry.code}
                type="button"
                role="listitem"
                className="languages-tile"
                onClick={() => pickLanguage(entry.code)}
              >
                {art ? <CatalogImage item={art} alt="" prefer="backdrop" /> : null}
                <span>{entry.label}</span>
              </button>
            )
          })}
        </div>
      </main>
    )
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
            onChange={(next) => pickLanguage(next as LanguageCode)}
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
        <MediaGrid items={items} layout="poster" hoverable={desktop} />
      ) : (
        <EmptyState title="No titles in this language" detail="Pick another original language." />
      )}
    </main>
  )
}
