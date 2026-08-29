import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { MovieListItem } from '../api/types'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'
import { CloseIcon } from './Icons'
import { TitleHoverCard } from './TitleHoverCard'

type HoverLock = { dismiss: () => void }
let activeLock: HoverLock | null = null

export function PosterCard({
  item,
  progress,
  hoverable = true,
  continueMode = false,
  rank,
  layout = 'landscape',
}: {
  item: MovieListItem
  progress?: number
  hoverable?: boolean
  continueMode?: boolean
  rank?: number
  layout?: 'landscape' | 'poster'
}) {
  const { openTitle, item: openItem } = useTitleModal()
  const { hideContinue } = useProfiles()
  const rootRef = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const [peek, setPeek] = useState(false)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const timer = useRef<number>(0)
  const lock = useRef<HoverLock>({ dismiss() {} }).current
  const ranked = typeof rank === 'number'

  lock.dismiss = () => {
    window.clearTimeout(timer.current)
    setHover(false)
    setPeek(false)
  }

  function takeLock() {
    if (activeLock && activeLock !== lock) activeLock.dismiss()
    activeLock = lock
  }

  function dropLock() {
    lock.dismiss()
    if (activeLock === lock) activeLock = null
  }

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      if (activeLock === lock) activeLock = null
    },
    [lock],
  )

  useEffect(() => {
    if (openItem) dropLock()
  }, [openItem])

  function cancelClose() {
    window.clearTimeout(timer.current)
  }

  function onEnter(event: PointerEvent<HTMLDivElement>) {
    if (!hoverable || event.pointerType !== 'mouse') return
    cancelClose()
    takeLock()
    setPeek(true)
    timer.current = window.setTimeout(() => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect) {
        setAnchor(rect)
        setHover(true)
      }
    }, 400)
  }

  function onLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    cancelClose()
    timer.current = window.setTimeout(() => dropLock(), 140)
  }

  return (
    <div
      className={`poster-wrap ${ranked ? 'is-ranked' : ''} ${layout === 'poster' ? 'is-poster' : 'is-landscape'} ${peek ? 'is-peeking' : ''} ${hover ? 'is-previewing' : ''}`}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {ranked ? (
        <span
          className={`rank-num ${rank === 1 ? 'is-first' : ''} ${rank === 10 ? 'is-ten' : ''}`}
          data-rank={rank}
        >
          {rank}
        </span>
      ) : null}
      <button
        type="button"
        className="poster-card"
        ref={rootRef}
        onClick={() => {
          dropLock()
          openTitle(item)
        }}
        aria-label={item.title}
      >
        <div className="poster-art">
          <CatalogImage item={item} alt={item.title} prefer={layout === 'landscape' ? 'backdrop' : 'poster'} />
        </div>
        {progress ? (
          <div className="progress-track">
            <div style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
      </button>
      {continueMode ? (
        <div className="continue-meta">
          <span className="continue-title">{item.title}</span>
          {item.continueLabel ? <span className="continue-ep">{item.continueLabel}</span> : null}
        </div>
      ) : null}
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
          <CloseIcon className="icon" />
        </button>
      ) : null}
      {hover && anchor && !openItem ? (
        <TitleHoverCard
          item={item}
          anchor={anchor}
          progress={progress}
          onKeep={cancelClose}
          onClose={dropLock}
        />
      ) : null}
    </div>
  )
}
