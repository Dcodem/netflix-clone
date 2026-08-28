import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem } from '../api/types'
import { genresOf, isShow } from '../lib/media'
import { buildWatchSession } from '../lib/watchSession'
import { maturityLabel } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { InfoIcon, PlayIcon, RestartIcon, SpeakerIcon } from './Icons'
import { CatalogImage } from './CatalogImage'
import { GenreDots } from './GenreDots'
import { TitleLogo } from './TitleLogo'

const VIDEO_ASPECT = 16 / 9

function coverScale(width: number, height: number) {
  if (!width || !height) return 1.35
  const boxAspect = width / height
  const fill = boxAspect > VIDEO_ASPECT ? boxAspect / VIDEO_ASPECT : VIDEO_ASPECT / boxAspect
  return fill * 1.18
}

export function Hero({ item }: { item: MovieListItem }) {
  const { openWatch, session } = useWatch()
  const { openTitle, item: openItem } = useTitleModal()
  const { activeProfile } = useProfiles()
  const mediaRef = useRef<HTMLDivElement>(null)
  const trailerRef = useRef<TrailerHandle>(null)
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [muted, setMuted] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)
  const [trailerEnded, setTrailerEnded] = useState(false)
  const [settled, setSettled] = useState(false)
  const [scale, setScale] = useState(1.45)
  const previewActive = !openItem && !session && activeProfile?.autoplayPreview !== false
  const playing = trailerReady && previewActive && !trailerEnded

  useEffect(() => {
    let cancelled = false
    setTrailerReady(false)
    setTrailerEnded(false)
    setMuted(true)
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

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setScale(coverScale(rect.width, rect.height))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [item.id])

  useEffect(() => {
    if (!previewActive) setMuted(true)
  }, [previewActive])

  useEffect(() => {
    setSettled(false)
    if (!playing) return
    const timer = window.setTimeout(() => setSettled(true), 6000)
    return () => window.clearTimeout(timer)
  }, [playing, item.id])

  const backdrop = detail?.backdrop_url || item.poster_url
  const last = activeProfile?.history.find((entry) => entry.id === item.id)
  const sessionReady = buildWatchSession(item, detail, last)
  const maturity = maturityLabel(item)
  const synopsis = detail?.synopsis
  const genres = genresOf(detail ?? item).slice(0, 3)

  function onWatch() {
    const next = buildWatchSession(item, detail, last)
    if (!next) return
    playClick()
    openWatch(next.href, item.title, next.payload)
  }

  function toggleMute() {
    const next = !muted
    trailerRef.current?.setMuted(next)
    setMuted(next)
  }

  function replayTrailer() {
    setTrailerEnded(false)
    setTrailerReady(true)
    trailerRef.current?.replay()
  }

  return (
    <section className={`hero ${playing ? 'is-playing' : ''} ${settled ? 'is-settled' : ''}`}>
      <div className={`hero-media ${playing ? 'is-playing' : ''}`} ref={mediaRef}>
        <CatalogImage item={{ ...item, backdrop_url: backdrop }} alt="" className="hero-img" prefer="backdrop" />
        {previewActive ? (
          <div
            className="hero-trailer-clip"
            style={{ '--trailer-scale': String(scale) } as CSSProperties}
          >
            <TrailerPreview
              ref={trailerRef}
              title={item.title}
              year={item.year}
              kind={item.kind}
              className="hero-trailer"
              muted={muted}
              onReady={() => {
                setTrailerEnded(false)
                setTrailerReady(true)
              }}
              onEnded={() => setTrailerEnded(true)}
            />
          </div>
        ) : null}
      </div>
      <div className="hero-body">
        <div className="billboard-kicker">
          <span className="n-mark">F</span>
          <span>{isShow(item) ? 'SERIES' : 'FILM'}</span>
        </div>
        <TitleLogo item={item} className="hero-logo" titleClassName="hero-title" />
        {genres.length ? <GenreDots genres={genres} className="hero-genre-dots" /> : null}
        {synopsis ? <p className="hero-syn">{synopsis}</p> : null}
        <div className="hero-actions">
          <button type="button" className="btn btn-play" onClick={onWatch} disabled={!sessionReady}>
            <PlayIcon className="icon" />
            {last?.progress && last.progress > 0.05 ? 'Resume' : 'Play'}
          </button>
          <button type="button" className="btn btn-info" onClick={() => openTitle(item)}>
            <InfoIcon className="icon" />
            More Info
          </button>
        </div>
      </div>
      <div className="hero-controls-right">
        {previewActive && trailerEnded ? (
          <button type="button" className="hero-mute" onClick={replayTrailer} aria-label="Replay">
            <RestartIcon className="icon" />
          </button>
        ) : previewActive ? (
          <button
            type="button"
            className="hero-mute"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute preview' : 'Mute preview'}
          >
            <SpeakerIcon muted={muted} className="icon" />
          </button>
        ) : null}
        <span className="maturity-flag">{maturity}</span>
      </div>
    </section>
  )
}
