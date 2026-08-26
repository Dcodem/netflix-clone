import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { MovieListItem } from '../api/types'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'
import { TitleHoverCard } from './TitleHoverCard'

export function PosterCard({
  item,
  progress,
  hoverable = true,
  continueMode = false,
}: {
  item: MovieListItem
  progress?: number
  hoverable?: boolean
  continueMode?: boolean
}) {
  const { openTitle } = useTitleModal()
  const { hideContinue } = useProfiles()
  const rootRef = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const timer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function cancelClose() {
    window.clearTimeout(timer.current)
  }

  function onEnter(event: PointerEvent<HTMLDivElement>) {
    if (!hoverable || event.pointerType !== 'mouse') return
    cancelClose()
    timer.current = window.setTimeout(() => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect) {
        setAnchor(rect)
        setHover(true)
      }
    }, 380)
  }

  function onLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    cancelClose()
    timer.current = window.setTimeout(() => setHover(false), 180)
  }

  return (
    <div className="poster-wrap" onPointerEnter={onEnter} onPointerLeave={onLeave}>
      <button
        type="button"
        className="poster-card"
        ref={rootRef}
        onClick={() => {
          setHover(false)
          openTitle(item)
        }}
        aria-label={item.title}
      >
        <div className="poster-art">
          <CatalogImage item={item} alt={item.title} />
        </div>
        {progress ? (
          <div className="progress-track">
            <div style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
      </button>
      {continueMode ? (
        <button
          type="button"
          className="continue-hide"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            hideContinue(item.id)
          }}
          aria-label="Remove from Continue Watching"
        >
          ×
        </button>
      ) : null}
      {hover && anchor ? (
        <TitleHoverCard
          item={item}
          anchor={anchor}
          progress={progress}
          continueMode={continueMode}
          onKeep={cancelClose}
          onClose={() => setHover(false)}
        />
      ) : null}
    </div>
  )
}
