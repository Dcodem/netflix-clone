import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem } from '../api/types'
import { formatRuntime, genresOf, isShow } from '../lib/media'
import { matchPercent, maturityLabel } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview } from '../trailers/TrailerPreview'
import { CatalogImage } from './CatalogImage'
import { TitleActions } from './TitleActions'

export function TitleHoverCard({
  item,
  anchor,
  progress,
  continueMode = false,
  onClose,
  onKeep,
}: {
  item: MovieListItem
  anchor: DOMRect
  progress?: number
  continueMode?: boolean
  onClose: () => void
  onKeep: () => void
}) {
  const { activeProfile } = useProfiles()
  const [detail, setDetail] = useState<MovieDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = isShow(item) ? getShow(item.id) : getMovie(item.id)
    load
      .then((result) => {
        if (!cancelled) setDetail(result)
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [item])

  const width = Math.max(320, Math.min(380, anchor.width * 1.7))
  let left = anchor.left + anchor.width / 2 - width / 2
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
  const heightGuess = width * 0.56 + 200
  let top = anchor.top - 18
  if (top + heightGuess > window.innerHeight - 12) {
    top = Math.max(12, window.innerHeight - heightGuess - 12)
  }

  const match = matchPercent(item, activeProfile)
  const maturity = maturityLabel(item)
  const runtime = formatRuntime(detail?.runtime)
  const genres = genresOf(detail ?? item).slice(0, 3)
  const last = activeProfile?.history.find((entry) => entry.id === item.id)
  const watchHref =
    last?.watch_href ||
    (isShow(item)
      ? (detail as { seasons?: { episodes?: { watch_href: string }[] }[] })?.seasons?.[0]?.episodes?.[0]?.watch_href ||
        detail?.watch_href
      : detail?.watch_href)

  const originX = Math.max(24, Math.min(width - 24, anchor.left + anchor.width / 2 - left))
  const originY = Math.max(24, Math.min(160, anchor.top + anchor.height / 2 - top))

  return createPortal(
    <div
      className="jawbone"
      style={{ top, left, width, transformOrigin: `${originX}px ${originY}px` }}
      onMouseEnter={onKeep}
      onMouseLeave={onClose}
    >
      <div className="jawbone-art">
        <CatalogImage item={{ ...item, backdrop_url: detail?.backdrop_url }} alt="" prefer="backdrop" />
        <TrailerPreview title={item.title} year={item.year} kind={item.kind} mode="mini" className="jawbone-trailer" />
        {progress ? (
          <div className="progress-track jawbone-progress">
            <div style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
      </div>
      <div className="jawbone-body">
        <TitleActions item={item} detail={detail} watchHref={watchHref} size="sm" continueMode={continueMode} />
        <div className="jawbone-meta">
          <span className="match">{match}% Match</span>
          {item.year ? <span>{item.year}</span> : null}
          <span className="maturity">{maturity}</span>
          {runtime ? <span>{runtime}</span> : isShow(item) ? <span>Series</span> : null}
        </div>
        {genres.length ? <div className="jawbone-genres">{genres.join(' · ')}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
