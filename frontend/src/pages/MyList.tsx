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
  const catalog = useMemo(
    () => [...(movies.data ?? []), ...(extra.data?.[0] ?? []), ...(extra.data?.[1] ?? [])],
    [movies.data, extra.data],
  )
  const items = useMemo(
    () =>
      enrichListItems(filterByMaturity(likedToItems(activeProfile?.myList ?? []), activeProfile), catalog),
    [activeProfile, catalog],
  )
  const uniqueItems = useMemo(() => uniqueById(items), [items])
  const desktop = useMediaQuery('(min-width: 768px)')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState<MyListSort>('suggestions')
  const [headingStuck, setHeadingStuck] = useState(false)
  const genres = useMemo(() => catalogGenres(uniqueItems), [uniqueItems])
  const visible = useMemo(() => {
    const filtered = genre ? uniqueItems.filter((item) => matchesGenreFilter(item, genre)) : uniqueItems
    return sortMyListItems(filtered, sort, activeProfile)
  }, [uniqueItems, genre, sort, activeProfile])
  const useGenreMenu = desktop && genres.length > 1

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
          <GenreSelect value={genre} genres={genres} onChange={setGenre} useMenu />
        ) : null}
        {uniqueItems.length ? (
          <OutlineSelect
            label="Sort"
            value={sort}
            options={MY_LIST_SORTS}
            onChange={(next) => setSort(next as MyListSort)}
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
