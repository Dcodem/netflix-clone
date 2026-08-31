import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem, ShowDetail } from '../api/types'
import { comingLineFor, isComingSoon } from '../lib/comingSoon'
import { stillWatching } from '../lib/homeRows'
import { formatRuntime, genresOf, isShow, remainingLabel } from '../lib/media'
import { isNewEpisodes, matchPercent, maturityLabel } from '../lib/netflix'
import { playWhoosh } from '../lib/sounds'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTmdbInfo } from '../trailers/useTmdbInfo'
import { presentCopy } from '../trailers/tmdbOverlay'
import { CatalogImage } from './CatalogImage'
import { FeatureBadges } from './FeatureBadges'
import { GenreDots } from './GenreDots'
import { SpeakerIcon } from './Icons'
import { TitleActions } from './TitleActions'
import { TitleLogo } from './TitleLogo'

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
  const jawRef = useRef<HTMLDivElement>(null)
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [trailerReady, setTrailerReady] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    document.body.classList.add('is-jaw-open')
    playWhoosh()
    return () => document.body.classList.remove('is-jaw-open')
  }, [])

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

  const continueMode = stillWatching({ progress, kind: item.kind })
  const width = Math.max(continueMode ? 392 : 352, Math.min(440, Math.round(anchor.width * 1.7)))
  const artH = width * (9 / 16)
  let left = anchor.left + anchor.width / 2 - width / 2
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
  const heightGuess = artH + 196
  let top = anchor.top + anchor.height / 2 - artH / 2
  if (top + heightGuess > window.innerHeight - 12) {
    top = Math.max(12, anchor.bottom - heightGuess)
  }
  if (top < 12) top = 12
  const fromScale = Math.max(0.42, Math.min(0.82, anchor.width / width))

  const tmdbInfo = useTmdbInfo(item)
  const copy = presentCopy(
    {
      synopsis: detail?.synopsis,
      runtime: detail?.runtime,
      year: item.year ?? detail?.year,
      genres: genresOf(detail ?? item),
    },
    tmdbInfo,
  )
  const match = matchPercent(item, activeProfile)
  const maturity = maturityLabel({ ...item, genres: copy.genres })
  const runtime = formatRuntime(copy.runtime)
  const quality = item.quality || detail?.quality
  const genres = copy.genres.slice(0, 3)
  const seasons = isShow(item) ? ((detail as ShowDetail | null)?.seasons ?? []) : []
  const episodeCount = seasons.reduce((count, season) => count + (season.episodes?.length ?? 0), 0)
  const last = activeProfile?.history.find((entry) => entry.id === item.id)
  const soon = isComingSoon(item)
  const coming = comingLineFor(item)
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
      ref={jawRef}
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
            year={copy.year ?? item.year}
            kind={item.kind}
            tmdb_id={item.tmdb_id}
            mode="mini"
            muted={muted}
            className="jawbone-trailer"
            onReady={() => setTrailerReady(true)}
          />
        ) : null}
        <div className={`jawbone-logo ${progress ? 'has-progress' : ''}`}>
          <TitleLogo item={item} className="jawbone-wordmark" titleClassName="jawbone-wordmark-text" />
        </div>
        {progress ? (
          <div className="progress-track jawbone-progress">
            <div style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}
        <div className={`jawbone-controls ${progress ? 'has-progress' : ''}`}>
          {previewOn ? (
            <button
              type="button"
              className="hero-mute jawbone-mute"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute preview' : 'Mute preview'}
            >
              <SpeakerIcon muted={muted} className="icon" />
            </button>
          ) : null}
          <span className="maturity-flag jawbone-rating">{maturity}</span>
        </div>
      </div>
      <div className="jawbone-body">
        <TitleActions
          item={item}
          detail={detail}
          watchHref={watchHref}
          size="md"
          continueMode={continueMode}
        />
        <div className="jawbone-meta">
          {soon && coming ? <span className="jawbone-coming">{coming}</span> : <span className="match">{match}% Match</span>}
          {soon ? null : isNewEpisodes(item.id, item.kind) ? <span className="now-badge">New Episodes</span> : null}
          <span className="maturity">{maturity}</span>
          {soon ? null : remainingLabel(progress, detail?.runtime) ? (
            <span>{remainingLabel(progress, detail?.runtime)}</span>
          ) : isShow(item) ? (
            <span>
              {seasons.length > 1
                ? `${seasons.length} Seasons`
                : seasons.length === 1
                  ? '1 Season'
                  : episodeCount
                    ? `${episodeCount} Episodes`
                    : 'TV Show'}
            </span>
          ) : runtime ? (
            <span>{runtime}</span>
          ) : null}
          {soon ? null : <FeatureBadges quality={quality} compact />}
        </div>
        {genres.length ? <GenreDots genres={genres} className="jawbone-genres" /> : null}
      </div>
    </div>,
    document.body,
  )
}
