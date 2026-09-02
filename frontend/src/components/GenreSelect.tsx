import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretIcon } from './Icons'

export function GenreSelect({
  value,
  genres,
  onChange,
  useMenu,
  onFallback,
  buttonLabel,
}: {
  value: string
  genres: string[]
  onChange: (next: string) => void
  useMenu: boolean
  onFallback?: () => void
  /** Keep the trigger as “Genres” on a genre-titled page (Netflix genre gallery). */
  buttonLabel?: string
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [box, setBox] = useState<DOMRect | null>(null)
  const [hoverGenre, setHoverGenre] = useState<string | null>(null)

  useEffect(() => {
    setOpen(false)
    setHoverGenre(null)
  }, [value])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function pick(next: string) {
    onChange(next)
    setOpen(false)
  }

  return (
    <div className="genre-select-wrap">
      <button
        type="button"
        ref={btnRef}
        className={`genre-select ${value && !buttonLabel ? 'is-on' : ''} ${open ? 'is-open' : ''}`}
        onClick={() => {
          if (useMenu) {
            setBox(btnRef.current?.getBoundingClientRect() ?? null)
            setOpen((current) => !current)
            return
          }
          onFallback?.()
        }}
        aria-haspopup={useMenu ? 'listbox' : 'dialog'}
        aria-expanded={useMenu ? open : undefined}
      >
        {buttonLabel || value || 'Genres'}
        <CaretIcon className="icon" />
      </button>
      {useMenu && open && box
        ? createPortal(
            <>
              <button
                type="button"
                className="genre-menu-scrim"
                aria-label="Close genres"
                onClick={() => setOpen(false)}
              />
              <div
                className="genre-menu is-portal"
                role="listbox"
                aria-label="Genres"
                style={{ top: box.bottom + 8, left: Math.max(16, box.left) }}
              >
                <button
                  type="button"
                  className={`${!value ? 'is-on' : ''} ${hoverGenre === '' ? 'is-hover' : ''}`}
                  onMouseEnter={() => setHoverGenre('')}
                  onMouseLeave={() => setHoverGenre((current) => (current === '' ? null : current))}
                  onClick={() => pick('')}
                >
                  All
                </button>
                {genres.map((entry) => (
                  <button
                    type="button"
                    key={entry}
                    className={`${value === entry ? 'is-on' : ''} ${hoverGenre === entry ? 'is-hover' : ''}`}
                    onMouseEnter={() => setHoverGenre(entry)}
                    onMouseLeave={() => setHoverGenre((current) => (current === entry ? null : current))}
                    onClick={() => pick(entry)}
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
  )
}
