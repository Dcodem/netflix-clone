import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretIcon, CheckIcon } from './Icons'

export function OutlineSelect({
  label = '',
  value,
  options,
  searchable = false,
  searchPlaceholder = 'Search',
  onChange,
}: {
  label?: string
  value: string
  options: { value: string; label: string }[]
  searchable?: boolean
  searchPlaceholder?: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [box, setBox] = useState<DOMRect | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = options.find((entry) => entry.value === value)
  const needle = query.trim().toLowerCase()
  const filtered =
    searchable && needle ? options.filter((entry) => entry.label.toLowerCase().includes(needle)) : options

  function syncBox() {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setBox(rect)
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onMove = () => syncBox()
    document.addEventListener('pointerdown', onDoc)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const menuWidth = box ? Math.max(box.width, 260) : 260
  const left = box ? Math.min(box.left, Math.max(8, window.innerWidth - menuWidth - 8)) : 0

  return (
    <div className={`outline-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`outline-select-btn ${label ? '' : 'is-value-only'}`}
        ref={btnRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || selected?.label || 'Select'}
        onClick={() => {
          syncBox()
          setOpen((next) => !next)
        }}
      >
        {label ? <span className="outline-select-kicker">{label}</span> : null}
        <span className="outline-select-value">
          {selected?.label ?? ''}
          <CaretIcon className="icon" />
        </span>
      </button>
      {open && box
        ? createPortal(
            <div
              className="outline-select-menu is-portal"
              role="listbox"
              aria-label={label || selected?.label || 'Select'}
              ref={menuRef}
              style={{ top: box.bottom + 6, left, width: menuWidth }}
            >
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
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
