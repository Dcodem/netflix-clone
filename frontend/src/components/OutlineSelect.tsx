import { useEffect, useRef, useState } from 'react'
import { CaretIcon, CheckIcon } from './Icons'

export function OutlineSelect({
  label,
  value,
  options,
  searchable = false,
  searchPlaceholder = 'Search',
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  searchable?: boolean
  searchPlaceholder?: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((entry) => entry.value === value)
  const needle = query.trim().toLowerCase()
  const filtered =
    searchable && needle ? options.filter((entry) => entry.label.toLowerCase().includes(needle)) : options

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  return (
    <div className={`outline-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="outline-select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((next) => !next)}
      >
        <span className="outline-select-kicker">{label}</span>
        <span className="outline-select-value">
          {selected?.label ?? ''}
          <CaretIcon className="icon" />
        </span>
      </button>
      {open ? (
        <div className="outline-select-menu" role="listbox" aria-label={label}>
          {searchable ? (
            <input
              className="outline-select-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              aria-label={searchPlaceholder}
            />
          ) : null}
          <div className="outline-select-list">
            {filtered.length ? (
              filtered.map((entry) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={entry.value === value}
                  key={entry.value}
                  className={entry.value === value ? 'is-on' : ''}
                  onClick={() => {
                    onChange(entry.value)
                    setOpen(false)
                  }}
                >
                  {entry.value === value ? <CheckIcon className="icon" /> : <span className="outline-select-spacer" />}
                  {entry.label}
                </button>
              ))
            ) : (
              <p className="outline-select-empty">No matches.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
