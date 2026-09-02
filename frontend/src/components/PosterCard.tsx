import { useEffect, useRef, useState } from 'react'
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
  const baseRect = useRef<DOMRect | null>(null)
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

  function nudgeRow(card: HTMLElement) {
    const scroller = card.closest('.row-scroller')
    if (!(scroller instanceof HTMLElement)) return
    const pad = 72
    const tile = card.getBoundingClientRect()
    const rail = scroller.getBoundingClientRect()
    let delta = 0
    if (tile.left < rail.left + pad) delta = tile.left - (rail.left + pad)
    else if (tile.right > rail.right - pad) delta = tile.right - (rail.right - pad)
    if (Math.abs(delta) > 2) scroller.scrollLeft += delta
  }

  function onEnter() {
    if (!hoverable || rowMenu) return
    cancelClose()
    takeLock()
    const card = rootRef.current
    if (card) baseRect.current = card.getBoundingClientRect()
    setPeek(true)
    timer.current = window.setTimeout(() => {
      const next = rootRef.current
      if (!next) return
      nudgeRow(next)
      const live = next.getBoundingClientRect()
      const base = baseRect.current
      setAnchor(
        base
          ? new DOMRect(
              live.left + live.width / 2 - base.width / 2,
              live.top + live.height / 2 - base.height / 2,
              base.width,
              base.height,
            )
          : live,
      )
      setHover(true)
    }, 400)
  }

  function onLeave() {
    cancelClose()
    timer.current = window.setTimeout(() => dropLock(), 140)
  }

  return (
    <div
      className={`poster-wrap ${scene ? 'scene-wrap' : ''} ${ranked ? 'is-ranked' : ''} ${layout === 'poster' ? 'is-poster' : 'is-landscape'} ${peek ? 'is-peeking' : ''} ${hover ? 'is-previewing' : ''} ${rowMenu ? 'is-row-menu' : ''} ${peek || hover || rowMenu ? 'is-hover' : ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
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
          <span className="continue-copy">
            <span className="continue-title">{item.title}</span>
            {item.continueLabel ? <span className="continue-ep">{item.continueLabel}</span> : null}
          </span>
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
