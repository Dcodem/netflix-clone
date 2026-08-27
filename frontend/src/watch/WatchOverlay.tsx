import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { getShow } from '../api/client'
import type { Episode, Season, ShowDetail } from '../api/types'
import {
  CheckIcon,
  ChevronLeftIcon,
  EpisodesIcon,
  FullscreenIcon,
  NextEpisodeIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SkipIntroIcon,
  SpeakerIcon,
  SubtitlesIcon,
} from '../components/Icons'
import { MediaImage } from '../components/MediaImage'
import { createWatchAmbience, playClick, playWhoosh } from '../lib/sounds'
import { stillFocus } from '../lib/media'
import { useWatch } from './WatchContext'

const PLAYER_SOURCE = 'flix-player'
const SKIP_INTRO_AT = 80
const SKIP_RECAP_AT = 148
const CAPTIONS = [
  'The city never really sleeps.',
  'Stay close. We move on my mark.',
  'This is the last chance we get.',
  'Don’t look back.',
]

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

function playerSrc(href: string, runtimeSec: number, progress: number) {
  try {
    const url = new URL(href, window.location.origin)
    url.searchParams.set('runtime', String(Math.round(runtimeSec)))
    url.searchParams.set('t', String(Math.round(Math.max(0, progress) * runtimeSec)))
    if (/^https?:\/\//i.test(href)) return url.toString()
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return href
  }
}

function nextEpisode(detail: ShowDetail | null, seasonNumber?: number | null, episodeNumber?: number | null) {
  if (!detail?.seasons?.length || !seasonNumber || !episodeNumber) return null
  const season = detail.seasons.find((entry) => entry.season_number === seasonNumber)
  const episodes = season?.episodes ?? []
  const index = episodes.findIndex((entry) => entry.number === episodeNumber)
  if (index >= 0 && index < episodes.length - 1 && season) {
    return { season, episode: episodes[index + 1] }
  }
  const following = detail.seasons.find((entry) => entry.season_number === seasonNumber + 1)
  if (following?.episodes?.[0]) return { season: following, episode: following.episodes[0] }
  return null
}

function currentEpisode(detail: ShowDetail | null, seasonNumber?: number | null, episodeNumber?: number | null) {
  if (!detail?.seasons?.length) return null
  const season =
    detail.seasons.find((entry) => entry.season_number === seasonNumber) ?? detail.seasons[0]
  const episode =
    season?.episodes?.find((entry) => entry.number === episodeNumber) ?? season?.episodes?.[0]
  return season && episode ? { season, episode } : null
}

export function WatchOverlay() {
  const { session, closeWatch, openWatch, reportProgress } = useWatch()
  const overlayRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const ambienceRef = useRef<ReturnType<typeof createWatchAmbience> | null>(null)
  const [chrome, setChrome] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null)
  const [episodesOpen, setEpisodesOpen] = useState(false)
  const [audioOpen, setAudioOpen] = useState(false)
  const [subs, setSubs] = useState<'off' | 'en'>('off')
  const [introSkipped, setIntroSkipped] = useState(false)
  const [recapSkipped, setRecapSkipped] = useState(false)
  const [flash, setFlash] = useState<'play' | 'pause' | 'back' | 'fwd' | null>(null)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)
  const [volOpen, setVolOpen] = useState(false)
  const [barHover, setBarHover] = useState(false)
  const flashTimer = useRef(0)

  const runtimeSec = Math.max(60, (session?.history?.runtime ?? 48) * 60)
  const startProgress = session?.history?.progress ?? 0
  const isShow = session?.history?.kind === 'show'
  const keepChrome = episodesOpen || audioOpen || volOpen || barHover

  const post = useCallback((payload: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage({ source: PLAYER_SOURCE, ...payload }, '*')
  }, [])

  const pulse = useCallback((kind: 'play' | 'pause' | 'back' | 'fwd') => {
    setFlash(kind)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 560)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = overlayRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen()
  }, [])

  const togglePlay = useCallback(() => {
    playClick()
    setPaused((value) => {
      const next = !value
      post({ cmd: next ? 'pause' : 'play' })
      ambienceRef.current?.setPlaying(!next)
      pulse(next ? 'pause' : 'play')
      return next
    })
  }, [post, pulse])

  const skip = useCallback(
    (delta: number) => {
    playClick()
    playWhoosh()
    post({ cmd: 'skip', delta })
      pulse(delta < 0 ? 'back' : 'fwd')
    },
    [post, pulse],
  )

  const toggleMute = useCallback(() => {
    setMuted((value) => {
      const next = !value
      post({ cmd: 'mute', value: next })
      ambienceRef.current?.setMuted(next)
      return next
    })
  }, [post])

  useEffect(() => {
    if (!session) return
    setChrome(true)
    setPaused(false)
    setMuted(false)
    setVolume(1)
    setEpisodesOpen(false)
    setAudioOpen(false)
    setVolOpen(false)
    setBarHover(false)
    setIntroSkipped(false)
    setRecapSkipped(false)
    setShowDetail(null)
    setSeasonNumber(session.history?.seasonNumber ?? null)
    setCurrent(startProgress * runtimeSec)
    setDuration(runtimeSec)
    setFlash(null)
    try {
      ambienceRef.current = createWatchAmbience()
      ambienceRef.current.setMuted(false)
      ambienceRef.current.setPlaying(true)
      ambienceRef.current.setVolume(1)
    } catch {
      ambienceRef.current = null
    }
    return () => {
      ambienceRef.current?.stop()
      ambienceRef.current = null
      window.clearTimeout(flashTimer.current)
    }
  }, [session, runtimeSec, startProgress])

  useEffect(() => {
    if (!session?.history?.id || session.history.kind !== 'show') return
    let cancelled = false
    getShow(session.history.id)
      .then((detail) => {
        if (!cancelled) setShowDetail(detail)
      })
      .catch(() => {
        if (!cancelled) setShowDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [session?.history?.id, session?.history?.kind])

  useEffect(() => {
    if (!session) return
    let timer = 0
    const show = () => {
      setChrome(true)
      window.clearTimeout(timer)
      if (!keepChrome) timer = window.setTimeout(() => setChrome(false), 4800)
    }
    if (keepChrome) setChrome(true)
    else timer = window.setTimeout(() => setChrome(false), 4800)
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement)?.tagName === 'INPUT' || (event.target as HTMLElement)?.tagName === 'SELECT'
      if (typing) return
      if (event.code === 'Space' || event.key === 'k') {
        event.preventDefault()
        togglePlay()
        show()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        skip(-10)
        show()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        skip(10)
        show()
      } else if (event.key.toLowerCase() === 'm') {
        toggleMute()
        show()
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFullscreen()
      } else show()
    }
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string; current?: number; duration?: number; paused?: boolean }
      if (!data || data.source !== PLAYER_SOURCE || data.type !== 'time') return
      if (typeof data.current === 'number') setCurrent(data.current)
      if (typeof data.duration === 'number' && data.duration > 0) setDuration(data.duration)
      if (typeof data.paused === 'boolean') setPaused(data.paused)
    }
    window.addEventListener('mousemove', show)
    window.addEventListener('pointerdown', show)
    window.addEventListener('keydown', onKey)
    window.addEventListener('message', onMessage)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', show)
      window.removeEventListener('pointerdown', show)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('message', onMessage)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [session, togglePlay, skip, toggleMute, toggleFullscreen, keepChrome])

  useEffect(() => {
    const length = duration || runtimeSec
    if (length) reportProgress(current / length)
  }, [current, duration, runtimeSec, reportProgress])

  const playing = currentEpisode(showDetail, session?.history?.seasonNumber, session?.history?.episodeNumber)
  const upcoming = useMemo(
    () => nextEpisode(showDetail, session?.history?.seasonNumber, session?.history?.episodeNumber),
    [showDetail, session?.history?.seasonNumber, session?.history?.episodeNumber],
  )
  const activeSeason =
    showDetail?.seasons?.find((season) => season.season_number === (seasonNumber ?? session?.history?.seasonNumber)) ??
    showDetail?.seasons?.[0]

  if (!session) return null

  const length = duration || runtimeSec
  const progress = length ? Math.min(1, current / length) : 0
  const remaining = Math.max(0, length - current)
  const episodeLabel =
    session.history?.seasonNumber && session.history?.episodeNumber
      ? `S${session.history.seasonNumber}:E${session.history.episodeNumber}`
      : null
  const showSkipIntro = isShow && !introSkipped && current < 110 && !episodesOpen && !audioOpen
  const showSkipRecap = isShow && !recapSkipped && !showSkipIntro && current >= 80 && current < 155 && !episodesOpen && !audioOpen
  const showNext = Boolean(upcoming && remaining <= 48 && remaining > 0 && !episodesOpen && !audioOpen)
  const caption = subs === 'en' ? CAPTIONS[Math.floor(current / 9) % CAPTIONS.length] : null

  function seekFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    post({ cmd: 'seek', seconds: ratio * length })
  }

  function skipIntro(event: { stopPropagation: () => void }) {
    event.stopPropagation()
    playClick()
    playWhoosh()
    setIntroSkipped(true)
    post({ cmd: 'seek', seconds: SKIP_INTRO_AT })
  }

  function skipRecap(event: { stopPropagation: () => void }) {
    event.stopPropagation()
    playClick()
    playWhoosh()
    setRecapSkipped(true)
    setIntroSkipped(true)
    post({ cmd: 'seek', seconds: SKIP_RECAP_AT })
  }

  function playEpisode(season: Season, episode: Episode) {
    if (!session?.history) return
    playClick()
    openWatch(episode.watch_href, session.history.title, {
      ...session.history,
      watch_href: episode.watch_href,
      runtime: episode.duration ?? session.history.runtime,
      progress: 0,
      seasonNumber: season.season_number,
      episodeNumber: episode.number,
      episodeId: episode.id,
    })
  }

  function onVolume(next: number) {
    setVolume(next)
    if (next <= 0.01) {
      setMuted(true)
      ambienceRef.current?.setMuted(true)
    } else {
      setMuted(false)
      ambienceRef.current?.setMuted(false)
      ambienceRef.current?.setVolume(next)
    }
  }

  return (
    <div
      ref={overlayRef}
      className={`watch-overlay ${paused ? 'is-paused' : ''} ${chrome ? 'is-chrome' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Player"
      onClick={togglePlay}
      onDoubleClick={(event) => {
        event.preventDefault()
        toggleFullscreen()
      }}
    >
      <iframe
        ref={frameRef}
        className="watch-frame"
        src={playerSrc(session.href, runtimeSec, startProgress)}
        title={session.title}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        tabIndex={-1}
      />
      <button
        type="button"
        className="watch-back"
        onClick={(event) => {
          event.stopPropagation()
          closeWatch()
        }}
        aria-label="Back"
      >
        <ChevronLeftIcon className="icon" />
      </button>
      {flash ? (
        <div className={`watch-flash is-${flash}`} aria-hidden="true">
          {flash === 'play' ? <PlayIcon className="icon" /> : null}
          {flash === 'pause' ? <PauseIcon className="icon" /> : null}
          {flash === 'back' ? <SkipBackIcon className="icon" /> : null}
          {flash === 'fwd' ? <SkipForwardIcon className="icon" /> : null}
        </div>
      ) : paused ? (
        <div className="watch-center" aria-hidden="true">
          <PlayIcon className="icon" />
        </div>
      ) : null}
      <div
        className={`watch-topbar ${chrome ? 'is-visible' : ''}`}
        onClick={(event) => event.stopPropagation()}
        onPointerEnter={() => setBarHover(true)}
        onPointerLeave={() => setBarHover(false)}
      >
        <div className="watch-title-stack">
          <p className="watch-title">{session.history?.title || session.title}</p>
          {episodeLabel ? (
            <p className="watch-ep-line">
              {episodeLabel}
              {playing?.episode.title ? ` ${playing.episode.title}` : ''}
            </p>
          ) : null}
        </div>
      </div>
      {showSkipIntro ? (
        <button type="button" className="skip-intro is-visible" onClick={skipIntro}>
          Skip Intro
          <SkipIntroIcon className="icon" />
        </button>
      ) : null}
      {showSkipRecap ? (
        <button type="button" className="skip-intro is-visible" onClick={skipRecap}>
          Skip Recap
          <SkipIntroIcon className="icon" />
        </button>
      ) : null}
      {showNext && upcoming ? (
        <button
          type="button"
          className="next-ep-card is-visible"
          onClick={(event) => {
            event.stopPropagation()
            playEpisode(upcoming.season, upcoming.episode)
          }}
        >
          <span className="next-ep-kicker">Next Episode</span>
          <span className="next-ep-body">
            <span className="next-ep-thumb">
              <MediaImage src={upcoming.episode.thumb_url} alt="" />
              <PlayIcon className="icon" />
            </span>
            <span className="next-ep-copy">
              <em>
                S{upcoming.season.season_number}:E{upcoming.episode.number} {upcoming.episode.title}
              </em>
              {upcoming.episode.synopsis ? <small>{upcoming.episode.synopsis}</small> : null}
            </span>
          </span>
        </button>
      ) : null}
      {caption ? <p className={`watch-caption ${chrome ? 'is-raised' : ''}`}>{caption}</p> : null}
      <div
        className={`watch-bottombar ${chrome ? 'is-visible' : ''}`}
        onClick={(event) => event.stopPropagation()}
        onPointerEnter={() => setBarHover(true)}
        onPointerLeave={() => setBarHover(false)}
      >
        <div className="watch-scrub">
          <div
            className="watch-progress"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(length)}
            aria-valuenow={Math.round(current)}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              seekFromEvent(event)
            }}
            onPointerMove={(event) => {
              if (event.buttons) seekFromEvent(event)
            }}
          >
            <div className="watch-progress-fill" style={{ width: `${Math.round(progress * 1000) / 10}%` }}>
              <span className="watch-knob" />
            </div>
          </div>
          <span className="watch-time">{formatClock(remaining)}</span>
        </div>
        <div className="watch-controls">
          <div className="watch-controls-left">
            <button type="button" className="watch-ctrl" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
              {paused ? <PlayIcon className="icon" /> : <PauseIcon className="icon" />}
            </button>
            <button type="button" className="watch-ctrl" onClick={() => skip(-10)} aria-label="Back 10 seconds">
              <SkipBackIcon className="icon" />
            </button>
            <button type="button" className="watch-ctrl" onClick={() => skip(10)} aria-label="Forward 10 seconds">
              <SkipForwardIcon className="icon" />
            </button>
            <div
              className={`watch-vol ${volOpen ? 'is-open' : ''}`}
              onPointerEnter={() => setVolOpen(true)}
              onPointerLeave={() => setVolOpen(false)}
            >
              <button
                type="button"
                className="watch-ctrl"
                onClick={() => {
                  setVolOpen(true)
                  toggleMute()
                }}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                <SpeakerIcon muted={muted || volume <= 0.01} className="icon" />
              </button>
              <div className="watch-vol-rail">
                <input
                  className="watch-vol-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  aria-label="Volume"
                  onChange={(event) => onVolume(Number(event.target.value))}
                />
              </div>
            </div>
          </div>
          <div className="watch-controls-right">
            {isShow && upcoming ? (
              <button
                type="button"
                className="watch-ctrl"
                onClick={() => playEpisode(upcoming.season, upcoming.episode)}
                aria-label="Next Episode"
              >
                <NextEpisodeIcon className="icon" />
              </button>
            ) : null}
            {isShow ? (
              <button
                type="button"
                className={`watch-ctrl ${episodesOpen ? 'is-on' : ''}`}
                onClick={() => {
                  setEpisodesOpen((value) => !value)
                  setAudioOpen(false)
                }}
                aria-label="Episodes"
              >
                <EpisodesIcon className="icon" />
              </button>
            ) : null}
            <button
              type="button"
              className={`watch-ctrl ${audioOpen ? 'is-on' : ''}`}
              onClick={() => {
                setAudioOpen((value) => !value)
                setEpisodesOpen(false)
              }}
              aria-label="Audio and subtitles"
            >
              <SubtitlesIcon className="icon" />
            </button>
            <button
              type="button"
              className="watch-ctrl"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            >
              <FullscreenIcon exit={fullscreen} className="icon" />
            </button>
          </div>
        </div>
      </div>
      {episodesOpen && showDetail?.seasons?.length ? (
        <div className="watch-panel watch-episodes" onClick={(event) => event.stopPropagation()}>
          <div className="watch-ep-head">
            <h2>Episodes</h2>
            {showDetail.seasons.length > 1 ? (
              <label>
                <span className="visually-hidden">Season</span>
                <select
                  className="watch-season"
                  value={activeSeason?.season_number}
                  onChange={(event) => setSeasonNumber(Number(event.target.value))}
                >
                  {showDetail.seasons.map((season) => (
                    <option key={season.season_number} value={season.season_number}>
                      Season {season.season_number}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="watch-ep-count">{activeSeason?.episodes?.length ?? 0} Episodes</span>
            )}
          </div>
          <div className="watch-ep-list">
            {activeSeason?.episodes?.map((episode) => {
              const season = activeSeason
              const active = episode.number === session.history?.episodeNumber && season.season_number === session.history?.seasonNumber
              return (
                <button
                  type="button"
                  key={episode.id}
                  className={`watch-ep ${active ? 'is-on' : ''}`}
                  onClick={() => playEpisode(season, episode)}
                >
                  <span className="watch-ep-num">{episode.number}</span>
                    <span className="watch-ep-thumb" style={{ '--focal': stillFocus(episode.number) } as CSSProperties}>
                    <MediaImage src={episode.thumb_url} alt="" />
                    <PlayIcon className="icon" />
                  </span>
                  <span className="watch-ep-copy">
                    <em>
                      {episode.title}
                      {episode.duration ? <small>{episode.duration}m</small> : null}
                    </em>
                    {episode.synopsis ? <span>{episode.synopsis}</span> : null}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      {audioOpen ? (
        <div className="watch-panel watch-audio" onClick={(event) => event.stopPropagation()}>
          <div>
            <h2>Audio</h2>
            <button type="button" className="is-on">
              <CheckIcon className="icon" />
              English
            </button>
            <button type="button">
              English [Audio Description]
            </button>
          </div>
          <div>
            <h2>Subtitles</h2>
            <button type="button" className={subs === 'off' ? 'is-on' : ''} onClick={() => setSubs('off')}>
              {subs === 'off' ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
              Off
            </button>
            <button type="button" className={subs === 'en' ? 'is-on' : ''} onClick={() => setSubs('en')}>
              {subs === 'en' ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
              English
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
