import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem } from '../api/types'
import { comingLineFor, isComingSoon } from '../lib/comingSoon'
import { stillWatching } from '../lib/homeRows'
import { genresOf, isShow } from '../lib/media'
import { buildWatchSession } from '../lib/watchSession'
import { maturityLabel, toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { notifyRemind } from './RemindToast'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTmdbInfo } from '../trailers/useTmdbInfo'
import { presentCopy } from '../trailers/tmdbOverlay'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { BellIcon, CheckIcon, InfoIcon, PlayIcon, PlusIcon, RestartIcon, SpeakerIcon } from './Icons'
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

export function Hero({ item, rank, rankLabel }: { item: MovieListItem; rank?: number; rankLabel?: string }) {
  const { openWatch, session } = useWatch()
  const { openTitle, item: openItem } = useTitleModal()
  const { activeProfile, toggleMyList } = useProfiles()
  const mediaRef = useRef<HTMLDivElement>(null)
  const trailerRef = useRef<TrailerHandle>(null)
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [muted, setMuted] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)
  const [trailerEnded, setTrailerEnded] = useState(false)
  const [settled, setSettled] = useState(false)
  const [heroHover, setHeroHover] = useState(false)
  const [scale, setScale] = useState(1.45)
  const previewActive = !openItem && !session && activeProfile?.autoplayPreview !== false
  const playing = trailerReady && previewActive && !trailerEnded
  const cinematic = previewActive && !playing

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
    setHeroHover(false)
    if (!previewActive) return
    const timer = window.setTimeout(() => setSettled(true), 6000)
    return () => window.clearTimeout(timer)
  }, [previewActive, item.id])

  const backdrop = detail?.backdrop_url || item.poster_url
  const last = activeProfile?.history.find((entry) => entry.id === item.id)
  const sessionReady = buildWatchSession(item, detail, last)
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
  const maturity = maturityLabel({ ...item, genres: copy.genres })
  const synopsis = copy.synopsis
  const genres = copy.genres.slice(0, 3)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const soon = isComingSoon(item)
  const coming = comingLineFor(item)

  function onWatch() {
    const next = buildWatchSession(item, detail, last)
    if (!next) return
    playClick()
    openWatch(next.href, item.title, next.payload)
  }

  function onRemind() {
    playClick()
    toggleMyList(toLiked(item))
    notifyRemind(item.title, !onList)
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

  const collapsed = settled && !heroHover

  return (
    <section
      className={`hero ${playing ? 'is-playing' : ''} ${cinematic ? 'is-cinematic' : ''} ${collapsed ? 'is-settled' : ''}`}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHeroHover(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setHeroHover(false)
      }}
    >
      <div className={`hero-media ${playing ? 'is-playing' : ''}`} ref={mediaRef}>
        <button
          type="button"
          className="hero-open-title"
          onClick={(event) => openTitle(item, event.currentTarget)}
          aria-label={`${item.title} details`}
        />
        <CatalogImage
          key={item.id}
          item={{ ...item, backdrop_url: backdrop }}
          alt=""
          className="hero-img"
          prefer="backdrop"
        />
        {previewActive ? (
          <div
            className="hero-trailer-clip"
            style={{ '--trailer-scale': String(scale) } as CSSProperties}
          >
            <TrailerPreview
              ref={trailerRef}
              title={item.title}
              year={copy.year ?? item.year}
              kind={item.kind}
              tmdb_id={item.tmdb_id}
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
        {rank && rankLabel ? (
          <p className="hero-rank">
            <span>#{rank}</span> in {rankLabel}
          </p>
        ) : null}
        {genres.length ? <GenreDots genres={genres} className="hero-genre-dots" /> : null}
        {coming ? <p className="hero-coming">{coming}</p> : null}
        {synopsis ? <p className="hero-syn">{synopsis}</p> : null}
        <div className="hero-actions">
          {soon ? (
            <button
              type="button"
              className={`btn ${onList ? 'btn-reminded' : 'btn-play'}`}
              onClick={onRemind}
              aria-pressed={onList}
            >
              {onList ? <CheckIcon className="icon" /> : <BellIcon className="icon" />}
              {onList ? 'Reminded' : 'Remind Me'}
            </button>
          ) : (
            <button type="button" className="btn btn-play" onClick={onWatch} disabled={!sessionReady}>
              <PlayIcon className="icon" />
              {last && stillWatching(last) ? 'Resume' : 'Play'}
            </button>
          )}
          <button type="button" className="btn btn-info hero-more" onClick={(event) => openTitle(item, event.currentTarget)}>
            <InfoIcon className="icon" />
            <span className="hero-more-wide">More Info</span>
            <span className="hero-more-short">Info</span>
          </button>
          {soon ? null : (
            <button
              type="button"
              className="btn btn-info hero-list"
              onClick={() => toggleMyList(toLiked(item))}
            >
              {onList ? <CheckIcon className="icon" /> : <PlusIcon className="icon" />}
              My List
            </button>
          )}
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
