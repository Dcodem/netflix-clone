import { useEffect, useRef, useState } from 'react'
import type { MovieListItem } from '../api/types'
import { useTitleModal } from '../title/TitleModalContext'
import { MediaImage } from './MediaImage'
import { TitleHoverCard } from './TitleHoverCard'

export function PosterCard({
  item,
  progress,
  hoverable = true,
}: {
  item: MovieListItem
  progress?: number
  hoverable?: boolean
}) {
  const { openTitle } = useTitleModal()
  const rootRef = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const timer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function cancelClose() {
    window.clearTimeout(timer.current)
  }

  function onEnter() {
    if (!hoverable) return
    cancelClose()
    timer.current = window.setTimeout(() => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect) {
        setAnchor(rect)
        setHover(true)
      }
    }, 380)
  }

  function onLeave() {
    cancelClose()
    timer.current = window.setTimeout(() => setHover(false), 180)
  }

  return (
    <div className="poster-wrap" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        className="poster-card"
        ref={rootRef}
        onClick={() => openTitle(item)}
        aria-label={item.title}
      >
        <div className="poster-art">
          <MediaImage src={item.poster_url} alt={item.title} />
        </div>
        {progress ? (
          <div className="progress-track">
            <div style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
      </button>
      {hover && anchor ? (
        <TitleHoverCard
          item={item}
          anchor={anchor}
          progress={progress}
          onKeep={cancelClose}
          onClose={() => setHover(false)}
        />
      ) : null}
    </div>
  )
}
