import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem, ShowDetail } from '../api/types'
import { formatRuntime, genresOf, isShow } from '../lib/media'
import { matchPercent, maturityLabel } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { CatalogImage } from './CatalogImage'
import { FeatureBadges } from './FeatureBadges'
import { SpeakerIcon } from './Icons'
import { TitleActions } from './TitleActions'

export function TitleHoverCard({
  item,
  anchor,
  progress,
  onClose,
  onKeep,
}: {
  item: MovieListItem
  anchor: DOMRect
  progress?: number
  onClose: () => void
  onKeep: () => void
}) {
  const { activeProfile } = useProfiles()
  const trailerRef = useRef<TrailerHandle>(null)
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [trailerReady, setTrailerReady] = useState(false)
  const [muted, setMuted] = useState(true)

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

  const width = Math.max(340, Math.min(460, Math.round(anchor.width * 1.85)))
  let left = anchor.left + anchor.width / 2 - width / 2
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
  const heightGuess = width * 0.56 + 200
  let top = anchor.top - 18
  if (top + heightGuess > window.innerHeight - 12) {
    top = Math.max(12, window.innerHeight - heightGuess - 12)
  }
  const fromScale = Math.max(0.48, Math.min(0.72, (anchor.width * 1.2) / width))

  const match = matchPercent(item, activeProfile)
  const maturity = maturityLabel(item)
  const runtime = formatRuntime(detail?.runtime)
  const quality = item.quality || detail?.quality
  const genres = genresOf(detail ?? item).slice(0, 3)
  const seasons = isShow(item) ? ((detail as ShowDetail | null)?.seasons ?? []) : []
  const episodeCount = seasons.reduce((count, season) => count + (season.episodes?.length ?? 0), 0)
  const last = activeProfile?.history.find((entry) => entry.id === item.id)
  const previewOn = activeProfile?.autoplayPreview !== false
  const watchHref =
    last?.watch_href ||
    (isShow(item)
      ? (detail as { seasons?: { episodes?: { watch_href: string }[] }[] })?.seasons?.[0]?.episodes?.[0]?.watch_href ||
        detail?.watch_href
      : detail?.watch_href)

  const originX = Math.max(24, Math.min(width - 24, anchor.left + anchor.width / 2 - left))
  const originY = Math.max(24, Math.min(160, anchor.top + anchor.height / 2 - top))

  function toggleMute() {
    const next = !muted
    trailerRef.current?.setMuted(next)
    setMuted(next)
  }

  return createPortal(
    <div
      className="jawbone"
      style={
        {
          top,
          left,
          width,
          transformOrigin: `${originX}px ${originY}px`,
          '--jaw-from': String(fromScale),
        } as CSSProperties
      }
      onMouseEnter={onKeep}
      onMouseLeave={onClose}
    >
      <div className={`jawbone-art ${trailerReady ? 'is-playing' : ''}`}>
        <CatalogImage item={{ ...item, backdrop_url: detail?.backdrop_url }} alt="" prefer="backdrop" />
        {previewOn ? (
          <TrailerPreview
            ref={trailerRef}
            title={item.title}
            year={item.year}
            kind={item.kind}
            mode="mini"
            muted={muted}
            className="jawbone-trailer"
            onReady={() => setTrailerReady(true)}
          />
        ) : null}
        {progress ? (
          <div className="progress-track jawbone-progress">
            <div style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
        {previewOn ? (
          <button
            type="button"
            className={`hero-mute jawbone-mute ${progress ? 'has-progress' : ''}`}
            onClick={toggleMute}
            aria-label={muted ? 'Unmute preview' : 'Mute preview'}
          >
            <SpeakerIcon muted={muted} className="icon" />
          </button>
        ) : null}
      </div>
      <div className="jawbone-body">
        <TitleActions item={item} detail={detail} watchHref={watchHref} size="sm" />
        <div className="jawbone-meta">
          <span className="match">{match}% Match</span>
          <span className="maturity">{maturity}</span>
          {runtime ? <span>{runtime}</span> : null}
          <FeatureBadges quality={quality} />
          {isShow(item) ? (
            <span>
              {seasons.length > 1
                ? `${seasons.length} Seasons`
                : episodeCount
                  ? `${episodeCount} Episodes`
                  : 'TV Show'}
            </span>
          ) : null}
        </div>
        {genres.length ? <div className="jawbone-genres">{genres.join(' • ')}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
