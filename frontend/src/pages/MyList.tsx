import { useEffect, useMemo, useState } from 'react'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { GenreSelect } from '../components/GenreSelect'
import { MediaGrid } from '../components/MediaGrid'
import { OutlineSelect } from '../components/OutlineSelect'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  catalogGenres,
  enrichListItems,
  likedToItems,
  MY_LIST_SORTS,
  sortMyListItems,
  type MyListSort,
} from '../lib/homeRows'
import { filterByMaturity } from '../lib/netflix'
import { uniqueById } from '../lib/media'
import { matchesGenreFilter } from '../profiles/taste'
import { useProfiles } from '../profiles/ProfileContext'
import { useCatalogEnrichment } from '../trailers/useCatalogEnrichment'

const SORT_VALUES = new Set(MY_LIST_SORTS.map((entry) => entry.value))

function sortKey(profileId?: string | null) {
  return profileId ? `flix.myListSort.${profileId}` : null
}

function readMyListSort(profileId?: string | null): MyListSort {
  const key = sortKey(profileId)
  if (!key) return 'suggestions'
  try {
    const raw = localStorage.getItem(key)
    if (raw && SORT_VALUES.has(raw as MyListSort)) return raw as MyListSort
  } catch {
    /* ignore */
  }
  return 'suggestions'
}

function writeMyListSort(profileId: string, sort: MyListSort) {
  try {
    localStorage.setItem(sortKey(profileId) as string, sort)
  } catch {
    /* ignore */
  }
}

function genreKey(profileId?: string | null) {
  return profileId ? `flix.myListGenre.${profileId}` : null
}

function readMyListGenre(profileId?: string | null) {
  const key = genreKey(profileId)
  if (!key) return ''
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function writeMyListGenre(profileId: string, genre: string) {
  try {
    const key = genreKey(profileId)
    if (!key) return
    if (genre) localStorage.setItem(key, genre)
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function MyList() {
  const { activeProfile } = useProfiles()
  const movies = useFetch(() => getMovies(), 'home-movies')
  const extra = useFetch(
    () =>
      Promise.all([
        getCatalogMany('movies').catch(() => [] as MovieListItem[]),
        getCatalogMany('shows').catch(() => [] as MovieListItem[]),
      ]),
    'home-extra',
  )
  const source = useMemo(
    () => [...(movies.data ?? []), ...(extra.data?.[0] ?? []), ...(extra.data?.[1] ?? [])],
    [movies.data, extra.data],
  )
  const catalog = useCatalogEnrichment(source)
  const items = useMemo(
    () =>
      enrichListItems(filterByMaturity(likedToItems(activeProfile?.myList ?? []), activeProfile), catalog),
    [activeProfile, catalog],
  )
  const uniqueItems = useMemo(() => uniqueById(items), [items])
  const desktop = useMediaQuery('(min-width: 768px)')
  const [genre, setGenre] = useState(() => readMyListGenre(activeProfile?.id))
  const [sort, setSort] = useState<MyListSort>(() => readMyListSort(activeProfile?.id))
  const [headingStuck, setHeadingStuck] = useState(false)
  const genres = useMemo(() => catalogGenres(uniqueItems), [uniqueItems])
  const visible = useMemo(() => {
    const filtered = genre ? uniqueItems.filter((item) => matchesGenreFilter(item, genre)) : uniqueItems
    return sortMyListItems(filtered, sort, activeProfile)
  }, [uniqueItems, genre, sort, activeProfile])
  const useGenreMenu = genres.length > 1
  const genreKeyJoin = genres.join('|')

  useEffect(() => {
    setSort(readMyListSort(activeProfile?.id))
    const stored = readMyListGenre(activeProfile?.id)
    if (!stored || !genreKeyJoin || genreKeyJoin.split('|').includes(stored)) setGenre(stored)
  }, [activeProfile?.id, genreKeyJoin])

  useEffect(() => {
    const onScroll = () => setHeadingStuck(window.scrollY > 72)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="page browse-page has-browse-heading my-list-page">
      <div className={`browse-heading ${headingStuck ? 'is-stuck' : ''}`}>
        <h1>My List</h1>
        {useGenreMenu ? (
          <GenreSelect
            value={genre}
            genres={genres}
            onChange={(next) => {
              setGenre(next)
              if (activeProfile?.id) writeMyListGenre(activeProfile.id, next)
            }}
            useMenu
            buttonLabel="Genres"
          />
        ) : null}
        {uniqueItems.length ? (
          <OutlineSelect
            label="Sort"
            value={sort}
            options={MY_LIST_SORTS}
            onChange={(next) => {
              const value = next as MyListSort
              setSort(value)
              if (activeProfile?.id) writeMyListSort(activeProfile.id, value)
            }}
          />
        ) : null}
      </div>
      {uniqueItems.length ? (
        visible.length ? (
          <MediaGrid items={visible} layout="poster" hoverable={desktop} />
        ) : (
          <EmptyState title="No titles in this genre" detail="Pick another genre from the menu." />
        )
      ) : (
        <EmptyState title="You haven't added any titles to your list yet." />
      )}
    </main>
  )
}
