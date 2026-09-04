import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { MovieListItem } from '../api/types'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'
import { ContinueMenu } from './ContinueMenu'
import { MoreVertIcon } from './Icons'
import { TitleHoverCard } from './TitleHoverCard'
import { TitleLogo } from './TitleLogo'

type HoverLock = { dismiss: () => void }
let activeLock: HoverLock | null = null

export function PosterCard({
  item,
  progress,
  hoverable = true,
  continueMode = false,
  rank,
  layout = 'landscape',
  scene = false,
}: {
  item: MovieListItem
  progress?: number
  hoverable?: boolean
  continueMode?: boolean
  rank?: number
  layout?: 'landscape' | 'poster'
  scene?: boolean
}) {
  const { openTitle, item: openItem } = useTitleModal()
  const { hideContinue } = useProfiles()
  const rootRef = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const [peek, setPeek] = useState(false)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [rowMenu, setRowMenu] = useState(false)
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
    if (!rowMenu) return
    const onDoc = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.parentElement?.contains(event.target as Node)) setRowMenu(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [rowMenu])

  useEffect(() => {
    if (openItem) dropLock()
  }, [openItem])

  function cancelClose() {
    window.clearTimeout(timer.current)
  }

  function onEnter(event: PointerEvent<HTMLDivElement>) {
    if (!hoverable || event.pointerType !== 'mouse' || rowMenu) return
    cancelClose()
    takeLock()
    setPeek(true)
    timer.current = window.setTimeout(() => {
      const card = rootRef.current
      if (!card) return
      // No auto-scroll: the row must stay fixed under the mouse while the
      // slot expands (the grown slot extends into the scrollable overflow).
      const rect = card.getBoundingClientRect()
      setAnchor(rect)
      setHover(true)
    }, 400)
  }

  function onLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    cancelClose()
    timer.current = window.setTimeout(() => dropLock(), 140)
  }

  return (
    <div
      className={`poster-wrap ${scene ? 'scene-wrap' : ''} ${ranked ? 'is-ranked' : ''} ${layout === 'poster' ? 'is-poster' : 'is-landscape'} ${peek ? 'is-peeking' : ''} ${hover ? 'is-previewing' : ''} ${rowMenu ? 'is-row-menu' : ''}`}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {ranked ? (
        <svg
          className={`rank-num rank-num-svg ${rank === 10 ? 'is-ten' : ''}`}
          viewBox="0 0 130 190"
          aria-hidden="true"
        >
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
            data-rank={rank}
          >
            {rank}
          </text>
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="rank-num-fill"
            data-rank={rank}
          >
            {rank}
          </text>
        </svg>
      ) : null}
      <button
        type="button"
        className={`poster-card ${scene ? 'scene-card' : ''}`}
        ref={rootRef}
        onClick={() => {
          dropLock()
          openTitle(item, rootRef.current)
        }}
        aria-label={scene ? `${item.title} scene` : item.title}
      >
        <div className={scene ? 'scene-art' : 'poster-art'}>
          <CatalogImage
            item={item}
            alt={item.title}
            prefer={scene || layout === 'landscape' ? 'backdrop' : 'poster'}
            className={scene ? 'scene-img' : undefined}
          />
        </div>
        {scene ? (
          <div className="scene-caption">
            <span className="scene-kicker">You watched</span>
            <TitleLogo item={item} className="scene-logo" titleClassName="scene-title" />
          </div>
        ) : null}
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
      ) : (
        // Netflix shows the title permanently under every card, not just on
        // hover. Year is secondary info, matching their billboard meta style.
        <div className="card-caption">
          <span className="card-caption-title">{item.title}</span>
          {item.year ? <span className="card-caption-year">{item.year}</span> : null}
        </div>
      )}
      {continueMode ? (
        <div className={`continue-more ${rowMenu ? 'is-open' : ''}`}>
          <button
            type="button"
            className="continue-hide"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              dropLock()
              setRowMenu((open) => !open)
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            aria-label="More"
            aria-expanded={rowMenu}
          >
            <MoreVertIcon className="icon" />
          </button>
          {rowMenu ? (
            <ContinueMenu
              onRemove={() => {
                hideContinue(item.id)
                setRowMenu(false)
              }}
              onDetails={() => {
                setRowMenu(false)
                openTitle(item, rootRef.current)
              }}
            />
          ) : null}
        </div>
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
