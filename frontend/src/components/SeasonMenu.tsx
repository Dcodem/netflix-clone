import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Season } from '../api/types'
import { seasonStats } from '../lib/episodeProgress'
import type { WatchHistoryItem } from '../profiles/types'
import { CaretIcon, CheckIcon } from './Icons'

export function SeasonMenu({
  seasons,
  history,
  value,
  onChange,
  className,
}: {
  seasons: Season[]
  history?: WatchHistoryItem
  value: number
  onChange: (seasonNumber: number) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [box, setBox] = useState<DOMRect | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onScroll = (event: Event) => {
      if (listRef.current?.contains(event.target as Node)) return
      const rect = btnRef.current?.getBoundingClientRect()
      if (rect) setBox(rect)
    }
    document.addEventListener('pointerdown', onDoc)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  if (seasons.length <= 1) {
    const count = seasons[0]?.episodes?.length ?? 0
    return count ? <span className={`season-count ${className ?? ''}`.trim()}>{count} Episodes</span> : null
  }

  const current = seasons.find((season) => season.season_number === value) ?? seasons[0]

  return (
    <div className={`season-menu ${open ? 'is-open' : ''} ${className ?? ''}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="season-menu-btn"
        ref={btnRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          const rect = btnRef.current?.getBoundingClientRect()
          setBox(rect ?? null)
          setOpen((next) => !next)
        }}
      >
        Season {current?.season_number ?? value}
        <CaretIcon className="icon" />
      </button>
      {open && box
        ? createPortal(
            <div
              className="season-menu-list is-portal"
              role="listbox"
              aria-label="Season"
              ref={listRef}
              style={{ top: box.bottom + 6, right: Math.max(12, window.innerWidth - box.right) }}
            >
              {seasons.map((season) => {
                const stats = seasonStats(history, season)
                const on = season.season_number === value
                const detail =
                  stats.started > 0 ? `${stats.started} of ${stats.total} watched` : `${stats.total} episodes`
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    key={season.season_number}
                    className={on ? 'is-on' : ''}
                    onClick={() => {
                      onChange(season.season_number)
                      setOpen(false)
                    }}
                  >
                    {on ? <CheckIcon className="icon" /> : <span className="season-check-spacer" />}
                    <span>
                      Season {season.season_number}
                      <small>{detail}</small>
                    </span>
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
