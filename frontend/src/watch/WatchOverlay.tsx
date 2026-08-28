import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { getShow } from '../api/client'
import type { Episode, Season, ShowDetail } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import {
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  EpisodesIcon,
  FullscreenIcon,
  NextEpisodeIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SkipIntroIcon,
  SpeakerIcon,
  SpeedIcon,
  SubtitlesIcon,
} from '../components/Icons'
import { MediaImage } from '../components/MediaImage'
import { createWatchAmbience, playClick, playWhoosh } from '../lib/sounds'
import { useProfiles } from '../profiles/ProfileContext'
import { watchForEpisode } from '../lib/episodeProgress'
import { stillFocus, episodeStill } from '../lib/media'
import { peekTrailer, resolveTrailer, youtubeIdFromHit } from '../trailers/resolve'
import { findTmdbGallery, tmdbFileName } from '../trailers/tmdb'
import { envKeys } from '../trailers/types'
import { useWatch } from './WatchContext'

const PLAYER_SOURCE = 'flix-player'
const SKIP_INTRO_AT = 80
const SKIP_RECAP_AT = 148
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
const CAPTIONS = [
  'The city never really sleeps.',
  'Stay close. We move on my mark.',
  'This is the last chance we get.',
  'Don’t look back.',
]

function formatClock(seconds: number, remaining = false) {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const clock = hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`
  return remaining ? `-${clock}` : clock
}

function playerSrc(href: string, runtimeSec: number, progress: number, yt?: string | null, gallery?: string[]) {
  try {
    const url = new URL(href, window.location.origin)
    url.searchParams.set('runtime', String(Math.round(runtimeSec)))
    url.searchParams.set('t', String(Math.round(Math.max(0, progress) * runtimeSec)))
    if (yt) url.searchParams.set('yt', yt)
    else url.searchParams.delete('yt')
    if (gallery?.length) url.searchParams.set('g', gallery.join(','))
    else url.searchParams.delete('g')
    if (/^https?:\/\//i.test(href)) return url.toString()
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return href
  }
}

function trailerSearch(session: { title: string; history?: { title?: string; year?: number | null; kind?: string } } | null) {
  if (!session) return { title: '', year: null as number | null, kind: 'movie' }
  return {
    title: session.history?.title || session.title,
    year: session.history?.year ?? null,
    kind: session.history?.kind ?? 'movie',
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
  const { user } = useAuth()
  const { activeProfile } = useProfiles()
  const overlayRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const ambienceRef = useRef<ReturnType<typeof createWatchAmbience> | null>(null)
  const sessionKey = session ? `${session.startedAt}:${session.href}` : ''
  const peekedYt = youtubeIdFromHit(peekTrailer(trailerSearch(session)))
  const [mediaBySession, setMediaBySession] = useState<{
    key: string
    yt: string | null
    files: string[]
    urls: string[]
  }>({
    key: '',
    yt: null,
    files: [],
    urls: [],
  })
  const ytId = mediaBySession.key === sessionKey ? mediaBySession.yt : peekedYt
  const galleryFiles = mediaBySession.key === sessionKey ? mediaBySession.files : []
  const galleryUrls = mediaBySession.key === sessionKey ? mediaBySession.urls : []
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
  const [speedOpen, setSpeedOpen] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [subs, setSubs] = useState<'off' | 'en'>('off')
  const [audioTrack, setAudioTrack] = useState<'en' | 'ad'>('en')
  const [introSkipped, setIntroSkipped] = useState(false)
  const [recapSkipped, setRecapSkipped] = useState(false)
  const [flash, setFlash] = useState<'play' | 'pause' | 'back' | 'fwd' | null>(null)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)
  const [volOpen, setVolOpen] = useState(false)
  const [barHover, setBarHover] = useState(false)
  const [scrubHint, setScrubHint] = useState<{ ratio: number; x: number } | null>(null)
  const [nextDismissed, setNextDismissed] = useState(false)
  const flashTimer = useRef(0)
  const tapRef = useRef({ at: 0, x: 0, play: 0 })
  const audioRef = useRef({ muted: false, volume: 1 })
  const autoNextRef = useRef('')
  const showChromeRef = useRef<() => void>(() => setChrome(true))

  const runtimeSec = Math.max(60, (session?.history?.runtime ?? 48) * 60)
  const startProgress = session?.history?.progress ?? 0
  const isShow = session?.history?.kind === 'show'
  const keepChrome = paused || episodesOpen || audioOpen || speedOpen || volOpen || barHover

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

  const setVolumeLevel = useCallback(
    (next: number) => {
      const clamped = Math.min(1, Math.max(0, next))
      setVolume(clamped)
      if (clamped <= 0.01) {
        setMuted(true)
        post({ cmd: 'mute', value: true })
        post({ cmd: 'volume', value: 0 })
        ambienceRef.current?.setMuted(true)
      } else {
        setMuted(false)
        post({ cmd: 'mute', value: false })
        post({ cmd: 'volume', value: clamped })
        ambienceRef.current?.setMuted(false)
        ambienceRef.current?.setVolume(clamped)
      }
    },
    [post],
  )

  useEffect(() => {
    audioRef.current = { muted, volume }
  }, [muted, volume])

  useEffect(() => {
    if (!session) return
    setChrome(true)
    setPaused(false)
    setMuted(false)
    setVolume(1)
    setEpisodesOpen(false)
    setAudioOpen(false)
    setSpeedOpen(false)
    setSpeed(1)
    setVolOpen(false)
    setBarHover(false)
    setIntroSkipped(false)
    setRecapSkipped(false)
    setShowDetail(null)
    setSeasonNumber(session.history?.seasonNumber ?? null)
    setCurrent(startProgress * runtimeSec)
    setDuration(runtimeSec)
    setFlash(null)
    setNextDismissed(false)
    const hasVideo = Boolean(youtubeIdFromHit(peekTrailer(trailerSearch(session))))
    try {
      if (hasVideo) {
        ambienceRef.current = null
      } else {
        ambienceRef.current = createWatchAmbience()
        ambienceRef.current.setMuted(false)
        ambienceRef.current.setPlaying(true)
        ambienceRef.current.setVolume(1)
      }
    } catch {
      ambienceRef.current = null
    }
    return () => {
      ambienceRef.current?.stop()
      ambienceRef.current = null
      window.clearTimeout(flashTimer.current)
      window.clearTimeout(tapRef.current.play)
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
    const key = `${session.startedAt}:${session.href}`
    const item = trailerSearch(session)
    const immediate = youtubeIdFromHit(peekTrailer(item))
    setMediaBySession({ key, yt: immediate, files: [], urls: [] })
    const keys = {
      iva: (user?.ivaKey || envKeys().iva).trim(),
      tmdb: (user?.tmdbKey || envKeys().tmdb).trim(),
    }
    if (!keys.tmdb && !keys.iva) return
    let cancelled = false
    Promise.all([
      resolveTrailer(item, keys).catch(() => null),
      keys.tmdb ? findTmdbGallery(item, keys.tmdb).catch(() => [] as string[]) : Promise.resolve([] as string[]),
    ])
      .then(([hit, gallery]) => {
        if (cancelled) return
        const id = youtubeIdFromHit(hit)
        const files = gallery.map((url) => tmdbFileName(url)).filter((file): file is string => Boolean(file))
        setMediaBySession({ key, yt: id ?? immediate, files, urls: gallery })
      })
      .catch(() => {
        /* keep artwork player */
      })
    return () => {
      cancelled = true
    }
  }, [session, user?.ivaKey, user?.tmdbKey])

  useEffect(() => {
    post({ cmd: 'mute', value: muted })
    post({ cmd: 'volume', value: muted ? 0 : volume })
  }, [muted, volume, ytId, post])

  useEffect(() => {
    post({ cmd: 'rate', value: speed })
  }, [speed, ytId, post])

  useEffect(() => {
    if (!session) return
    let timer = 0
    const show = () => {
      setChrome(true)
      window.clearTimeout(timer)
      if (!keepChrome) timer = window.setTimeout(() => setChrome(false), 3200)
    }
    showChromeRef.current = show
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (keepChrome) setChrome(true)
    else timer = window.setTimeout(() => setChrome(false), 3200)
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
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setVolumeLevel((muted ? 0 : volume) + 0.1)
        show()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setVolumeLevel((muted ? 0 : volume) - 0.1)
        show()
      } else if (/^[0-9]$/.test(event.key)) {
        event.preventDefault()
        const length = duration || runtimeSec
        post({ cmd: 'seek', seconds: (Number(event.key) / 10) * length })
        show()
      } else if (event.key.toLowerCase() === 'm') {
        toggleMute()
        show()
      } else if (event.key.toLowerCase() === 'j') {
        event.preventDefault()
        skip(-10)
        show()
      } else if (event.key.toLowerCase() === 'l') {
        event.preventDefault()
        skip(10)
        show()
      } else if (event.key === 'Escape') {
        if (episodesOpen || audioOpen || speedOpen) {
          event.preventDefault()
          event.stopImmediatePropagation()
          setEpisodesOpen(false)
          setAudioOpen(false)
          setSpeedOpen(false)
        }
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFullscreen()
      } else show()
    }
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        source?: string
        type?: string
        kind?: string
        current?: number
        duration?: number
        paused?: boolean
      }
      if (!data || data.source !== PLAYER_SOURCE) return
      if (data.type === 'media' && data.kind === 'youtube') {
        ambienceRef.current?.stop()
        ambienceRef.current = null
        return
      }
      if (data.type !== 'time') return
      if (typeof data.current === 'number') setCurrent(data.current)
      if (typeof data.duration === 'number' && data.duration > 0) setDuration(data.duration)
      if (typeof data.paused === 'boolean') setPaused(data.paused)
    }
    if (!coarse) {
      window.addEventListener('mousemove', show)
      window.addEventListener('pointerdown', show)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('message', onMessage)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', show)
      window.removeEventListener('pointerdown', show)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('message', onMessage)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [session, togglePlay, skip, toggleMute, toggleFullscreen, keepChrome, setVolumeLevel, muted, volume, duration, runtimeSec, post, episodesOpen, audioOpen, speedOpen])

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
  const lengthNow = duration || runtimeSec
  const remainingNow = Math.max(0, lengthNow - current)

  useEffect(() => {
    if (!upcoming || remainingNow > 0.6 || current < 30 || !session?.history) return
    if (nextDismissed) return
    if (activeProfile?.autoplayNext === false) return
    const key = upcoming.episode.id
    if (autoNextRef.current === key) return
    autoNextRef.current = key
    playClick()
    openWatch(upcoming.episode.watch_href, session.history.title, {
      ...session.history,
      watch_href: upcoming.episode.watch_href,
      runtime: upcoming.episode.duration ?? session.history.runtime,
      progress: 0,
      seasonNumber: upcoming.season.season_number,
      episodeNumber: upcoming.episode.number,
      episodeId: upcoming.episode.id,
    })
  }, [remainingNow, current, upcoming, session, openWatch, activeProfile?.autoplayNext, nextDismissed])

  if (!session) return null

  const length = duration || runtimeSec
  const progress = length ? Math.min(1, current / length) : 0
  const remaining = Math.max(0, length - current)
  const episodeLabel = playing
    ? `S${playing.season.season_number}:E${playing.episode.number}`
    : session.history?.seasonNumber && session.history?.episodeNumber
      ? `S${session.history.seasonNumber}:E${session.history.episodeNumber}`
      : null
  const showSkipIntro = isShow && !introSkipped && current < 110 && !episodesOpen && !audioOpen && !speedOpen
  const showSkipRecap = isShow && !recapSkipped && !showSkipIntro && current >= 80 && current < 155 && !episodesOpen && !audioOpen && !speedOpen
  const showNext = Boolean(upcoming && remaining <= 48 && !nextDismissed && !episodesOpen && !audioOpen && !speedOpen && length > 0)
  const nextCount = Math.max(1, Math.ceil(remaining))
  const nextProgress = length ? Math.min(1, remaining / 48) : 0
  const caption = subs === 'en' ? CAPTIONS[Math.floor(current / 9) % CAPTIONS.length] : null

  function ratioFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  }

  function seekFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
    post({ cmd: 'seek', seconds: ratioFromEvent(event) * length })
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
      year: session.history.year,
      watch_href: episode.watch_href,
      runtime: episode.duration ?? session.history.runtime,
      progress: 0,
      seasonNumber: season.season_number,
      episodeNumber: episode.number,
      episodeId: episode.id,
    })
  }

  function onVolume(next: number) {
    setVolumeLevel(next)
  }

  return (
    <div
      ref={overlayRef}
      className={`watch-overlay ${paused ? 'is-paused' : ''} ${chrome ? 'is-chrome' : ''} ${episodesOpen || audioOpen || speedOpen ? 'is-panel' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Player"
      onClick={(event) => {
        if (episodesOpen || audioOpen || speedOpen) {
          event.preventDefault()
          setEpisodesOpen(false)
          setAudioOpen(false)
          setSpeedOpen(false)
          return
        }
        const coarse = window.matchMedia('(pointer: coarse)').matches
        if (!coarse) {
          togglePlay()
          return
        }
        const now = performance.now()
        const x = event.clientX
        const width = overlayRef.current?.clientWidth || window.innerWidth
        window.clearTimeout(tapRef.current.play)
        if (now - tapRef.current.at < 280) {
          event.preventDefault()
          if (x < width * 0.38 || tapRef.current.x < width * 0.38) skip(-10)
          else if (x > width * 0.62 || tapRef.current.x > width * 0.62) skip(10)
          showChromeRef.current()
          tapRef.current = { at: 0, x: 0, play: 0 }
          return
        }
        tapRef.current = { at: now, x, play: 0 }
        if (keepChrome) {
          showChromeRef.current()
          return
        }
        if (chrome) setChrome(false)
        else showChromeRef.current()
      }}
      onDoubleClick={(event) => {
        if (window.matchMedia('(pointer: coarse)').matches) return
        event.preventDefault()
        toggleFullscreen()
      }}
    >
      <iframe
        ref={frameRef}
        className="watch-frame"
        src={playerSrc(session.href, runtimeSec, startProgress, ytId, galleryFiles)}
        title={session.title}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        tabIndex={-1}
        onLoad={() => {
          const audio = audioRef.current
          post({ cmd: 'play' })
          post({ cmd: 'mute', value: audio.muted })
          post({ cmd: 'volume', value: audio.muted ? 0 : audio.volume })
        }}
      />
      {flash ? (
        <div className={`watch-flash is-${flash}`} aria-hidden="true">
          {flash === 'play' ? <PlayIcon className="icon" /> : null}
          {flash === 'pause' ? <PauseIcon className="icon" /> : null}
          {flash === 'back' ? <SkipBackIcon className="icon" /> : null}
          {flash === 'fwd' ? <SkipForwardIcon className="icon" /> : null}
        </div>
      ) : null}
      <div
        className={`watch-topbar ${chrome ? 'is-visible' : ''}`}
        onClick={(event) => event.stopPropagation()}
        onPointerEnter={() => setBarHover(true)}
        onPointerLeave={() => setBarHover(false)}
      >
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
          className="watch-credits is-visible"
          onClick={(event) => {
            event.stopPropagation()
            setNextDismissed(true)
          }}
        >
          Watch Credits
        </button>
      ) : null}
      {showNext && upcoming ? (
        <div
          className="next-ep-card is-visible"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="next-ep-close"
            aria-label="Hide next episode"
            onClick={(event) => {
              event.stopPropagation()
              setNextDismissed(true)
            }}
          >
            <CloseIcon className="icon" />
          </button>
          <span className="next-ep-kicker">
            {activeProfile?.autoplayNext !== false ? (
              <span
                className="next-ep-count"
                style={{ '--p': String(nextProgress) } as CSSProperties}
                aria-hidden="true"
              >
                <span>{nextCount}</span>
              </span>
            ) : null}
            Next Episode
          </span>
          <button
            type="button"
            className="next-ep-body"
            onClick={(event) => {
              event.stopPropagation()
              playEpisode(upcoming.season, upcoming.episode)
            }}
          >
            <span className="next-ep-thumb">
              <MediaImage src={episodeStill(galleryUrls, upcoming.episode.number, upcoming.episode.thumb_url)} alt="" />
              <PlayIcon className="icon" />
            </span>
            <span className="next-ep-copy">
              <em>
                S{upcoming.season.season_number}:E{upcoming.episode.number} {upcoming.episode.title}
              </em>
              {upcoming.episode.synopsis ? <small>{upcoming.episode.synopsis}</small> : null}
            </span>
          </button>
        </div>
      ) : null}
      {caption ? <p className={`watch-caption ${chrome ? 'is-raised' : ''}`}>{caption}</p> : null}
      <div className="watch-center">
        <button
          type="button"
          className="watch-ctrl"
          onClick={(event) => {
            event.stopPropagation()
            skip(-10)
          }}
          aria-label="Back 10 seconds"
        >
          <SkipBackIcon className="icon" />
        </button>
        <button
          type="button"
          className="watch-ctrl watch-center-play"
          onClick={(event) => {
            event.stopPropagation()
            togglePlay()
          }}
          aria-label={paused ? 'Play' : 'Pause'}
        >
          {paused ? <PlayIcon className="icon" /> : <PauseIcon className="icon" />}
        </button>
        <button
          type="button"
          className="watch-ctrl"
          onClick={(event) => {
            event.stopPropagation()
            skip(10)
          }}
          aria-label="Forward 10 seconds"
        >
          <SkipForwardIcon className="icon" />
        </button>
      </div>
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
              const ratio = ratioFromEvent(event)
              const rect = event.currentTarget.getBoundingClientRect()
              setScrubHint({ ratio, x: event.clientX - rect.left })
              if (event.buttons) seekFromEvent(event)
            }}
            onPointerLeave={() => setScrubHint(null)}
          >
            {scrubHint ? (
              <span className="watch-scrub-hint" style={{ left: scrubHint.x }}>
                {formatClock(scrubHint.ratio * length)}
              </span>
            ) : null}
            <div className="watch-progress-fill" style={{ width: `${Math.round(progress * 1000) / 10}%` }}>
              <span className="watch-knob" />
            </div>
          </div>
          <span className="watch-time">{formatClock(remaining, true)}</span>
        </div>
        <div className="watch-controls">
          <div className="watch-controls-left">
            <button type="button" className="watch-ctrl watch-transport" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
              {paused ? <PlayIcon className="icon" /> : <PauseIcon className="icon" />}
            </button>
            <button type="button" className="watch-ctrl watch-transport" onClick={() => skip(-10)} aria-label="Back 10 seconds">
              <SkipBackIcon className="icon" />
            </button>
            <button type="button" className="watch-ctrl watch-transport" onClick={() => skip(10)} aria-label="Forward 10 seconds">
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
          <div className="watch-now-playing">
            <p className="watch-now-title">{session.history?.title || session.title}</p>
            {episodeLabel ? (
              <p className="watch-now-ep">
                {episodeLabel}
                {playing?.episode.title ? ` ${playing.episode.title}` : ''}
              </p>
            ) : null}
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
                  setSpeedOpen(false)
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
                setSpeedOpen(false)
              }}
              aria-label="Audio and subtitles"
            >
              <SubtitlesIcon className="icon" />
            </button>
            <div className={`watch-speed ${speedOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className={`watch-ctrl ${speedOpen || speed !== 1 ? 'is-on' : ''}`}
                onClick={() => {
                  setSpeedOpen((value) => !value)
                  setAudioOpen(false)
                  setEpisodesOpen(false)
                }}
                aria-label="Playback speed"
              >
                <SpeedIcon className="icon" />
              </button>
              {speedOpen ? (
                <div className="watch-speed-menu" role="menu" aria-label="Playback speed">
                  {SPEEDS.map((rate) => (
                    <button
                      type="button"
                      key={rate}
                      className={speed === rate ? 'is-on' : ''}
                      onClick={() => {
                        setSpeed(rate)
                        post({ cmd: 'rate', value: rate })
                        setSpeedOpen(false)
                      }}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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
      {episodesOpen || audioOpen || speedOpen ? (
        <button
          type="button"
          className="watch-scrim"
          aria-label="Close panel"
          onClick={(event) => {
            event.stopPropagation()
            setEpisodesOpen(false)
            setAudioOpen(false)
            setSpeedOpen(false)
          }}
        />
      ) : null}
      {episodesOpen ? (
        <div className="watch-panel watch-episodes" onClick={(event) => event.stopPropagation()}>
          <div className="watch-ep-head">
            <h2>Episodes</h2>
            {showDetail && showDetail.seasons && showDetail.seasons.length > 1 ? (
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
            {activeSeason?.episodes?.length ? (
              activeSeason.episodes.map((episode) => {
              const season = activeSeason
              const active = episode.number === session.history?.episodeNumber && season.season_number === session.history?.seasonNumber
              const watched = session.history
                ? watchForEpisode({ ...session.history, watchedAt: 0 }, season.season_number, episode)
                : undefined
              const epProgress = active ? progress : (watched?.progress ?? 0)
              return (
                <button
                  type="button"
                  key={episode.id}
                  className={`watch-ep ${active ? 'is-on' : ''}`}
                  onClick={() => playEpisode(season, episode)}
                >
                  <span className="watch-ep-num">{episode.number}</span>
                    <span className="watch-ep-thumb" style={{ '--focal': stillFocus(episode.number) } as CSSProperties}>
                    <MediaImage src={episodeStill(galleryUrls, episode.number, episode.thumb_url)} alt="" />
                    <PlayIcon className="icon" />
                    {epProgress > 0.05 && epProgress < 0.92 ? (
                      <div className="progress-track watch-ep-progress">
                        <div style={{ width: `${Math.round(Math.min(1, epProgress) * 100)}%` }} />
                      </div>
                    ) : null}
                  </span>
                  <span className="watch-ep-copy">
                    <em>
                      {episode.title}
                      {episode.duration ? <small>{episode.duration}m</small> : null}
                      {active ? <small className="watch-ep-playing">Playing</small> : null}
                    </em>
                    {episode.synopsis ? <span>{episode.synopsis}</span> : null}
                  </span>
                </button>
              )
            })
            ) : (
              <p className="watch-ep-empty">{showDetail ? 'No episodes available.' : 'Loading episodes…'}</p>
            )}
          </div>
        </div>
      ) : null}
      {audioOpen ? (
        <div className="watch-panel watch-audio" onClick={(event) => event.stopPropagation()}>
          <div>
            <h2>Audio</h2>
            <button type="button" className={audioTrack === 'en' ? 'is-on' : ''} onClick={() => setAudioTrack('en')}>
              {audioTrack === 'en' ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
              English
            </button>
            <button type="button" className={audioTrack === 'ad' ? 'is-on' : ''} onClick={() => setAudioTrack('ad')}>
              {audioTrack === 'ad' ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
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
