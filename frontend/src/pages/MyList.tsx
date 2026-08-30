import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { GenreSelect } from '../components/GenreSelect'
import { MediaGrid } from '../components/MediaGrid'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { catalogGenres, likedToItems } from '../lib/homeRows'
import { filterByMaturity } from '../lib/netflix'
import { matchesGenreFilter } from '../profiles/taste'
import { useProfiles } from '../profiles/ProfileContext'

export function MyList() {
  const { activeProfile } = useProfiles()
  const items = filterByMaturity(likedToItems(activeProfile?.myList ?? []), activeProfile)
  const desktop = useMediaQuery('(min-width: 768px)')
  const [genre, setGenre] = useState('')
  const [headingStuck, setHeadingStuck] = useState(false)
  const genres = useMemo(() => catalogGenres(items), [items])
  const visible = useMemo(
    () => (genre ? items.filter((item) => matchesGenreFilter(item, genre)) : items),
    [items, genre],
  )
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
      </div>
      {items.length ? (
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
