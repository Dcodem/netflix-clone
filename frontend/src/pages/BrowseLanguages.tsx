import { useEffect, useMemo, useState } from 'react'
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
  languageOptionsFor,
  originalLanguageOf,
  sortLanguageTitles,
  titlesInLanguage,
  type LanguageCode,
  type LanguageSort,
} from '../lib/languages'
import { uniqueById } from '../lib/media'
import { filterByMaturity, profileLanguageCode } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { useCatalogEnrichment } from '../trailers/useCatalogEnrichment'

function isLanguageCode(value: string | null): value is LanguageCode {
  return Boolean(value && ORIGINAL_LANGUAGES.some((entry) => entry.code === value))
}

const SORT_VALUES = new Set(LANGUAGE_SORTS.map((entry) => entry.id))

function sortKey(profileId?: string | null) {
  return profileId ? `flix.languageSort.${profileId}` : null
}

function readLanguageSort(profileId?: string | null): LanguageSort {
  const key = sortKey(profileId)
  if (!key) return 'suggestions'
  try {
    const raw = localStorage.getItem(key)
    if (raw && SORT_VALUES.has(raw as LanguageSort)) return raw as LanguageSort
  } catch {
    /* ignore */
  }
  return 'suggestions'
}

function writeLanguageSort(profileId: string, sort: LanguageSort) {
  try {
    localStorage.setItem(sortKey(profileId) as string, sort)
  } catch {
    /* ignore */
  }
}

export function BrowseLanguages() {
  const { activeProfile } = useProfiles()
  const desktop = useMediaQuery('(min-width: 768px)')
  const [params, setParams] = useSearchParams()
  const langParam = params.get('lang')
  const picked = isLanguageCode(langParam) ? langParam : null
  const [sort, setSort] = useState<LanguageSort>(() => readLanguageSort(activeProfile?.id))
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'browse-languages')
  const matureCatalog = useCatalogEnrichment(
    useMemo(
      () => filterByMaturity(catalog.data ?? [], activeProfile),
      [catalog.data, activeProfile],
    ),
  )
  const offered = useMemo(() => languageOptionsFor(matureCatalog, picked), [matureCatalog, picked])
  const language = useMemo(() => {
    if (picked) return picked
    if (!desktop) return null
    const profileCode = profileLanguageCode(activeProfile?.language)
    if (!catalog.data || offered.some((entry) => entry.code === profileCode)) return profileCode
    return 'en'
  }, [picked, desktop, activeProfile?.language, catalog.data, offered])

  const items = useMemo(() => {
    if (!language) return []
    return sortLanguageTitles(titlesInLanguage(matureCatalog, language), sort, activeProfile)
  }, [matureCatalog, language, sort, activeProfile])

  const tileArt = useMemo(() => {
    const art = new Map<LanguageCode, MovieListItem>()
    for (const item of matureCatalog) {
      const code = originalLanguageOf(item)
      if (!art.has(code)) art.set(code, item)
    }
    return art
  }, [matureCatalog])

  function pickLanguage(code: LanguageCode) {
    const next = new URLSearchParams(params)
    next.set('lang', code)
    setParams(next)
  }

  useEffect(() => {
    setSort(readLanguageSort(activeProfile?.id))
  }, [activeProfile?.id])

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
          {offered.map((entry) => {
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
            options={offered.map((entry) => ({ value: entry.code, label: entry.label }))}
            onChange={(next) => pickLanguage(next as LanguageCode)}
          />
          <OutlineSelect
            label="Sort by"
            value={sort}
            options={LANGUAGE_SORTS.map((entry) => ({ value: entry.id, label: entry.label }))}
            onChange={(next) => {
              const value = next as LanguageSort
              setSort(value)
              if (activeProfile?.id) writeLanguageSort(activeProfile.id, value)
            }}
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
