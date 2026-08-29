import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EmptyState } from '../components/EmptyState'
import { CaretIcon } from '../components/Icons'
import { MediaGrid } from '../components/MediaGrid'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { catalogGenres, likedToItems } from '../lib/homeRows'
import { genresOf } from '../lib/media'
import { filterByMaturity } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'

export function MyList() {
  const { activeProfile } = useProfiles()
  const items = filterByMaturity(likedToItems(activeProfile?.myList ?? []), activeProfile)
  const desktop = useMediaQuery('(min-width: 768px)')
  const [genre, setGenre] = useState('')
  const [genreMenuOpen, setGenreMenuOpen] = useState(false)
  const [headingStuck, setHeadingStuck] = useState(false)
  const genreBtnRef = useRef<HTMLButtonElement>(null)
  const [genreBox, setGenreBox] = useState<DOMRect | null>(null)
  const genres = useMemo(() => catalogGenres(items), [items])
  const visible = useMemo(
    () => (genre ? items.filter((item) => genresOf(item).includes(genre)) : items),
    [items, genre],
  )
  const useGenreMenu = desktop && genres.length > 1

  useEffect(() => {
    const onScroll = () => setHeadingStuck(window.scrollY > 72)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setGenreMenuOpen(false)
  }, [genre])

  function pickGenre(next: string) {
    setGenre(next)
    setGenreMenuOpen(false)
  }

  return (
    <main className="page browse-page has-browse-heading my-list-page">
      <div className={`browse-heading ${headingStuck ? 'is-stuck' : ''}`}>
        <h1>My List</h1>
        {useGenreMenu ? (
          <div className="genre-select-wrap">
            <button
              type="button"
              ref={genreBtnRef}
              className={`genre-select ${genre ? 'is-on' : ''} ${genreMenuOpen ? 'is-open' : ''}`}
              onClick={() => {
                setGenreBox(genreBtnRef.current?.getBoundingClientRect() ?? null)
                setGenreMenuOpen((value) => !value)
              }}
              aria-haspopup="listbox"
              aria-expanded={genreMenuOpen}
            >
              {genre || 'Genres'}
              <CaretIcon className="icon" />
            </button>
            {genreMenuOpen && genreBox
              ? createPortal(
                  <>
                    <button
                      type="button"
                      className="genre-menu-scrim"
                      aria-label="Close genres"
                      onClick={() => setGenreMenuOpen(false)}
                    />
                    <div
                      className="genre-menu is-portal"
                      role="listbox"
                      aria-label="Genres"
                      style={{ top: genreBox.bottom + 8, left: Math.max(16, genreBox.left) }}
                    >
                      <button type="button" className={!genre ? 'is-on' : ''} onClick={() => pickGenre('')}>
                        All Genres
                      </button>
                      {genres.map((entry) => (
                        <button
                          type="button"
                          key={entry}
                          className={genre === entry ? 'is-on' : ''}
                          onClick={() => pickGenre(entry)}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>
                  </>,
                  document.body,
                )
              : null}
          </div>
        ) : null}
      </div>
      {items.length ? (
        visible.length ? (
          <MediaGrid items={visible} layout="poster" hoverable />
        ) : (
          <EmptyState title="No titles in this genre" detail="Pick another genre from the menu." />
        )
      ) : (
        <EmptyState
          title="You haven't added any titles to your list yet"
          detail="Add titles from a hover preview or More Info to watch them later."
        />
      )}
    </main>
  )
}
