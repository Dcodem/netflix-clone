import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem, ShowDetail } from '../api/types'
import { genresOf, isShow } from '../lib/media'
import { maturityLabel, qualityBadge } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { InfoIcon, PlayIcon, SpeakerIcon } from './Icons'
import { CatalogImage } from './CatalogImage'

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
  const [scale, setScale] = useState(1.45)
  const previewActive = !openItem && !session

  useEffect(() => {
    let cancelled = false
    setTrailerReady(false)
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

  const backdrop = detail?.backdrop_url || item.poster_url
  const genres = genresOf(detail ?? item)
  const last = activeProfile?.history.find((entry) => entry.id === item.id)
  const seasons = isShow(item) ? ((detail as ShowDetail | null)?.seasons ?? []) : []
  const resumeSeason =
    seasons.find((season) => season.season_number === last?.seasonNumber) ?? seasons[0]
  const resumeEpisode =
    resumeSeason?.episodes?.find(
      (episode) => episode.id === last?.episodeId || episode.number === last?.episodeNumber,
    ) ?? resumeSeason?.episodes?.[0]
  const watchHref = isShow(item)
    ? last?.watch_href || resumeEpisode?.watch_href || detail?.watch_href
    : detail?.watch_href
  const maturity = maturityLabel(item)
  const synopsis = detail?.synopsis
  const quality = qualityBadge(item.quality || detail?.quality)

  function onWatch() {
    if (!watchHref) return
    openWatch(watchHref, item.title, {
      id: item.id,
      kind: item.kind ?? 'movie',
      title: item.title,
      poster_url: item.poster_url ?? null,
      genres,
      watch_href: watchHref,
      runtime: resumeEpisode?.duration ?? detail?.runtime ?? last?.runtime ?? null,
      progress: last?.progress,
      seasonNumber: last?.seasonNumber ?? resumeSeason?.season_number,
      episodeNumber: last?.episodeNumber ?? resumeEpisode?.number,
      episodeId: last?.episodeId ?? resumeEpisode?.id,
    })
  }

  function toggleMute() {
    const next = !muted
    trailerRef.current?.setMuted(next)
    setMuted(next)
  }

  return (
    <section className={`hero ${trailerReady && previewActive ? 'is-playing' : ''}`}>
      <div className={`hero-media ${trailerReady && previewActive ? 'is-playing' : ''}`} ref={mediaRef}>
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
              onReady={() => setTrailerReady(true)}
            />
          </div>
        ) : null}
      </div>
      <div className="hero-body">
        <div className="billboard-kicker">
          <span className="n-mark">F</span>
          <span>{isShow(item) ? 'SERIES' : 'FILM'}</span>
        </div>
        <h1 className="hero-title">{item.title}</h1>
        <div className="hero-meta">
          {item.year ? <span>{item.year}</span> : null}
          {quality ? <span className="quality-badge">{quality}</span> : null}
          {isShow(item) ? (
            <span>
              {seasons.length > 1 ? `${seasons.length} Seasons` : 'Series'}
              {last?.seasonNumber && last?.episodeNumber
                ? ` · S${last.seasonNumber}:E${last.episodeNumber}`
                : ''}
            </span>
          ) : null}
        </div>
        {synopsis ? <p className="hero-syn">{synopsis}</p> : null}
        <div className="hero-actions">
          <button type="button" className="btn btn-play" onClick={onWatch} disabled={!watchHref}>
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
        {trailerReady && previewActive ? (
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
