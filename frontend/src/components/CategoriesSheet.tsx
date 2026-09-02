import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { CloseIcon } from './Icons'

export function CategoriesSheet({
  open,
  onClose,
  genres,
  selected,
  onSelect,
  variant = 'categories',
}: {
  open: boolean
  onClose: () => void
  genres: string[]
  selected?: string
  onSelect: (genre: string) => void
  variant?: 'categories' | 'genres'
}) {
  const location = useLocation()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('categories-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      document.body.classList.remove('categories-open')
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={`categories-sheet ${variant === 'genres' ? 'is-genres' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={variant === 'genres' ? 'Genres' : 'Categories'}
    >
      <nav className="categories-list">
        {variant === 'categories' ? (
          <>
            <Link
              to="/browse"
              className={`cat-nav ${location.pathname === '/browse' && !selected ? 'is-on' : ''}`}
              onClick={onClose}
            >
              Home
            </Link>
            <Link
              to="/browse/my-list"
              className={`cat-nav ${location.pathname === '/browse/my-list' ? 'is-on' : ''}`}
              onClick={onClose}
            >
              My List
            </Link>
            <Link
              to="/browse/shows"
              className={`cat-nav ${location.pathname === '/browse/shows' ? 'is-on' : ''}`}
              onClick={onClose}
            >
              TV Shows
            </Link>
            <Link
              to="/browse/movies"
              className={`cat-nav ${location.pathname === '/browse/movies' ? 'is-on' : ''}`}
              onClick={onClose}
            >
              Movies
            </Link>
            <Link
              to="/browse/latest"
              className={`cat-nav ${location.pathname === '/browse/latest' ? 'is-on' : ''}`}
              onClick={onClose}
            >
              New &amp; Hot
            </Link>
            <Link
              to="/browse/languages"
              className={`cat-nav ${location.pathname === '/browse/languages' ? 'is-on' : ''}`}
              onClick={onClose}
            >
              Browse by Languages
            </Link>
            {genres.length ? <div className="cat-divider" aria-hidden="true" /> : null}
          </>
        ) : (
          <button
            type="button"
            className={`cat-genre ${!selected ? 'is-on' : ''}`}
            onClick={() => {
              onSelect('')
              onClose()
            }}
          >
            All Genres
          </button>
        )}
        {genres.map((genre) => (
          <button
            type="button"
            key={genre}
            className={`cat-genre ${selected === genre ? 'is-on' : ''}`}
            onClick={() => {
              onSelect(genre)
              onClose()
            }}
          >
            {genre}
          </button>
        ))}
      </nav>
      <button type="button" className="categories-close" onClick={onClose} aria-label="Close">
        <CloseIcon className="icon" />
      </button>
    </div>,
    document.body,
  )
}
