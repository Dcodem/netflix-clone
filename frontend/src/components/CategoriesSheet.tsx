import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
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
            <Link to="/browse" onClick={onClose}>
              Home
            </Link>
            <Link to="/browse/my-list" onClick={onClose}>
              My List
            </Link>
            <Link to="/browse/shows" onClick={onClose}>
              TV Shows
            </Link>
            <Link to="/browse/movies" onClick={onClose}>
              Movies
            </Link>
          </>
        ) : (
          <button
            type="button"
            className={!selected ? 'is-on' : ''}
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
            className={selected === genre ? 'is-on' : ''}
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
