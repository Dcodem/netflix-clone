import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem, ShowDetail } from '../api/types'
import { comingLineFor, isComingSoon } from '../lib/comingSoon'
import { stillWatching } from '../lib/homeRows'
import { formatRuntime, genresOf, isShow, remainingLabel } from '../lib/media'
import { isNewEpisodes, matchPercent, maturityLabel } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTmdbInfo } from '../trailers/useTmdbInfo'
import { presentCopy } from '../trailers/tmdbOverlay'
import { CatalogImage } from './CatalogImage'
import { FeatureBadges } from './FeatureBadges'
import { GenreDots } from './GenreDots'
import { ContinueMenu } from './ContinueMenu'
import { SpeakerIcon, MoreVertIcon } from './Icons'
import { TitleActions } from './TitleActions'
import { TitleLogo } from './TitleLogo'

export function TitleHoverCard({
  item,
  anchor,
  anchorEl,
  progress,
  onClose,
  onKeep,
}: {
  item: MovieListItem
  anchor: DOMRect
  anchorEl?: HTMLElement | null
  progress?: number
  onClose: () => void
  onKeep: () => void
}) {
  const { activeProfile, hideContinue } = useProfiles()
  const { openTitle } = useTitleModal()
  const trailerRef = useRef<TrailerHandle>(null)
  const jawRef = useRef<HTMLDivElement>(null)
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [trailerReady, setTrailerReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const [rowMenu, setRowMenu] = useState(false)

  useEffect(() => {
    document.body.classList.add('is-jaw-open')
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

  // In-row expansion geometry: the WRAP grows to 1.5x in the row flow (CSS),
  // and this card fills the grown slot — positioned to the wrap's live box,
  // vertically centered on the row, overflowing above/below like Netflix.
  // Re-measure on the animation frame so we ride the flex-basis transition.
  const [box, setBox] = useState(() => ({
    left: anchor.left,
    top: anchor.top,
    width: anchor.width,
    height: anchor.height,
  }))
  const wrapRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const wrap = (anchorEl ?? document.querySelector<HTMLElement>('.poster-wrap.is-previewing, .scene-wrap.is-previewing')) as HTMLElement | null
    // Top 10 tiles carry the giant numeral inside the wrap — anchor the
    // expanded card to the POSTER portion (Netflix positions its top10
    // preview over the poster, overlapping the next ranked tile rightward).
    const card = wrap?.classList.contains('is-top10-wrap')
      ? wrap.querySelector<HTMLElement>('.poster-card')
      : null
    wrapRef.current = (card ?? wrap) as HTMLElement | null
    if (!wrapRef.current) return
    // The card is FIXED in the viewport at the position where it opened —
    // scrolling must not drag it with the row (the user's eyes stay on the
    // card). Scroll activity only matters for the scroll-away auto-close.
    // Fixed coords are captured once the flex transition settles; while the
    // transition runs the box tracks the wrap's viewport rect.
    let raf = 0
    let last = ''
    let settleFrames = 0
    let closed = false
    const tick = () => {
      const el = wrapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const key = `${rect.left.toFixed(1)},${(rect.top + window.scrollY).toFixed(1)},${rect.width.toFixed(1)}`
      if (key !== last) {
        last = key
        // While the flex transition runs, ride the wrap's VIEWPORT rect.
        // (Document coords are derived at render time; see box consumer.)
        setBox({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
      }
      // Viewport-bottom correction — only while something is actually
      // changing. When both wrap and jaw are stable, stop the loop entirely
      // (per-frame setState re-renders the card and restarts trailer resolve).
      const jaw = jawRef.current
      const jr = jaw?.getBoundingClientRect()
      const overflow = jr ? jr.bottom - window.innerHeight : 0
      const stable = key === last && overflow <= 0
      if (stable) {
        // 45 frames (~0.75s): must outlive the 0.6s flex-basis transition
        // or the card freezes at an intermediate width, leaving a black
        // band between the card and the next tile.
        if (++settleFrames > 45) {
          // Lock: stop tracking — the card holds its viewport position from
          // here on (the box was last set to the wrap's viewport rect).
          return
        }
      } else {
        settleFrames = 0
      }
      if (overflow > 0) {
        setBox((prev) => ({ ...prev, top: prev.top - overflow - 14 }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Scroll-away close: after the card locks (the rAF loop stops), a page
    // scroll that carries the row out of view must close the card — it can
    // no longer re-measure itself.
    const onScroll = () => {
      if (closed) return
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.bottom < -80 || r.top > window.innerHeight + 80) {
        closed = true
        window.removeEventListener('scroll', onScroll)
        onClose()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  // Top 10 rows: the poster box is narrower than a normal tile (the numeral
  // takes the left side) — Netflix's top10 preview expands WIDER than the
  // poster and overlaps the next ranked tile rightward.
  const isTop10 = Boolean(
    wrapRef.current?.closest('.is-top10') || wrapRef.current?.classList.contains('is-top10-wrap'),
  )
  const width = isTop10 ? box.width * 1.3 : box.width
  // Viewport-space positioning: the card opens where the tile is and stays
  // there (fixed), so page scroll never drags it. The bottom clamp keeps it
  // fully on screen; it closes when its row scrolls away.
  const left = box.left
  const realH = jawRef.current?.offsetHeight
  const estimated = realH && realH > 40 ? realH : width * (9 / 16) + 260
  const top = Math.min(box.top, Math.max(8, window.innerHeight - estimated - 14))
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
  const releaseDate = (detail as { release_date?: string | null } | null)?.release_date ?? null
  const releaseLine = releaseDate
    ? new Date(releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const last = activeProfile?.history.find((entry) => entry.id === item.id)
  const soon = isComingSoon(item) && item.playable !== true
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
        {progress ? (
          <div className={`continue-more jawbone-more ${rowMenu ? 'is-open' : ''}`}>
            <button
              type="button"
              className="continue-hide"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setRowMenu((open) => !open)
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
                  onClose()
                }}
                onDetails={() => {
                  setRowMenu(false)
                  onClose()
                  openTitle(item, jawRef.current)
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="jawbone-body">
        <TitleActions
          item={item}
          detail={detail}
          watchHref={watchHref}
          size="sm"
          continueMode={stillWatching({ progress, kind: item.kind })}
        />
        <div className="jawbone-meta">
          {soon && coming ? <span className="jawbone-coming">{coming}</span> : <span className="match">{match}% Match</span>}
          {soon ? null : isNewEpisodes(item.id, item.kind) ? <span className="now-badge">New Episodes</span> : null}
          {detail?.year || item.year ? <span>{detail?.year || item.year}</span> : null}
          <span className="maturity">{maturity}</span>
          {soon ? (
            item.year ? <span>{item.year}</span> : null
          ) : remainingLabel(progress, detail?.runtime) ? (
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
        {releaseLine ? <div className="jawbone-release">{releaseLine}</div> : null}
        {copy.synopsis ? <p className="jawbone-synopsis">{copy.synopsis}</p> : null}
      </div>
    </div>,
    document.body,
  )
}
