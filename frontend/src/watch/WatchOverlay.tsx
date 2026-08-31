import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { getShow } from '../api/client'
import type { Episode, Season, ShowDetail } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import {
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  EpisodesIcon,
  FlagIcon,
  FullscreenIcon,
  PipIcon,
  NextEpisodeIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SkipIntroIcon,
  SpeakerIcon,
  LockIcon,
  SpeedIcon,
  SubtitlesIcon,
} from '../components/Icons'
import { AvatarArt } from '../components/AvatarArt'
import { CastMenu } from '../components/CastMenu'
import { MediaImage } from '../components/MediaImage'
import { SeasonMenu } from '../components/SeasonMenu'
import { TitleLogo } from '../components/TitleLogo'
import { createWatchAmbience, playClick, playIdentBump, playWhoosh } from '../lib/sounds'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor } from '../profiles/types'
import { watchForEpisode } from '../lib/episodeProgress'
import { stillFocus, episodeStill } from '../lib/media'
import { skipMarks } from '../lib/skipMarks'
import {
  readPlayerPrefs,
  writePlayerPrefs,
  type CaptionBg,
  type CaptionColor,
  type CaptionFont,
  type CaptionSize,
} from '../lib/playerPrefs'
import { peekTrailer, resolveTrailer, youtubeIdFromHit } from '../trailers/resolve'
import { findTmdbGallery, tmdbFileName } from '../trailers/tmdb'
import { envKeys } from '../trailers/types'
import { useWatch } from './WatchContext'

const PLAYER_SOURCE = 'flix-player'
const NEXT_CARD_AT = 16
const AUTO_IN = 5
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
const CAPTIONS = [
  'The city never really sleeps.',
  'Stay close. We move on my mark.',
  'This is the last chance we get.',
  'Don’t look back.',
]

function captionLines(text?: string | null): string[] {
  if (!text?.trim()) return CAPTIONS
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 8)
  return parts.length ? parts : CAPTIONS
}

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

const REPORT_REASONS = [
  { id: 'play', label: 'Video won’t play' },
  { id: 'buffering', label: 'Buffering or loading' },
  { id: 'picture', label: 'Picture quality' },
  { id: 'sound', label: 'Sound' },
  { id: 'subs', label: 'Subtitles or captions' },
  { id: 'other', label: 'Something else' },
] as const

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
  const initialPrefs = readPlayerPrefs()
  const [muted, setMuted] = useState(initialPrefs.muted)
  const [volume, setVolume] = useState(initialPrefs.volume)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null)
  const [episodesOpen, setEpisodesOpen] = useState(false)
  const [audioOpen, setAudioOpen] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [speed, setSpeed] = useState(initialPrefs.speed)
  const [subs, setSubs] = useState(initialPrefs.subs)
  const [captionSize, setCaptionSize] = useState<CaptionSize>(initialPrefs.captionSize)
  const [captionBg, setCaptionBg] = useState<CaptionBg>(initialPrefs.captionBg)
  const [captionFont, setCaptionFont] = useState<CaptionFont>(initialPrefs.captionFont)
  const [captionColor, setCaptionColor] = useState<CaptionColor>(initialPrefs.captionColor)
  const [audioTrack, setAudioTrack] = useState(initialPrefs.audioTrack)
  const [introSkipped, setIntroSkipped] = useState(false)
  const [recapSkipped, setRecapSkipped] = useState(false)
  const [flash, setFlash] = useState<'play' | 'pause' | 'back' | 'fwd' | null>(null)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)
  const [volOpen, setVolOpen] = useState(false)
  const [barHover, setBarHover] = useState(false)
  const [scrubHint, setScrubHint] = useState<{ ratio: number; x: number } | null>(null)
  const [nextDismissed, setNextDismissed] = useState(false)
  const [stillWatching, setStillWatching] = useState(false)
  const [identOn, setIdentOn] = useState(true)
  const [identPhase, setIdentPhase] = useState<'logo' | 'title' | 'off'>('logo')
  const [helpOpen, setHelpOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<(typeof REPORT_REASONS)[number]['id']>('buffering')
  const [reportSent, setReportSent] = useState(false)
  const [locked, setLocked] = useState(false)
  const [pip, setPip] = useState(false)
  const pipRef = useRef(false)
  pipRef.current = pip
  const [clockKey, setClockKey] = useState('')
  const flashTimer = useRef(0)
  const tapRef = useRef({ at: 0, x: 0, play: 0 })
  const audioRef = useRef({ muted: initialPrefs.muted, volume: initialPrefs.volume })
  const currentRef = useRef(0)
  const autoNextRef = useRef('')
  const streakRef = useRef(0)
  const showIdRef = useRef('')
  const showChromeRef = useRef<() => void>(() => setChrome(true))

  const runtimeSec = Math.max(60, (session?.history?.runtime ?? 48) * 60)
  const startProgress = session?.history?.progress ?? 0
  const isShow = session?.history?.kind === 'show'
  if (sessionKey && clockKey !== sessionKey) {
    const showId = session?.history?.id ?? sessionKey
    if (showIdRef.current && showIdRef.current !== showId) streakRef.current = 0
    showIdRef.current = showId
    autoNextRef.current = ''
    setClockKey(sessionKey)
    setCurrent(startProgress * runtimeSec)
    setDuration(runtimeSec)
    setPaused(false)
    setNextDismissed(false)
    setStillWatching(false)
    setIdentOn(startProgress < 0.02)
    setIdentPhase(startProgress < 0.02 ? (streakRef.current > 0 ? 'title' : 'logo') : 'off')
    setIntroSkipped(false)
    setRecapSkipped(false)
    setHelpOpen(false)
    setReportOpen(false)
    setReportSent(false)
    setReportReason('buffering')
    setLocked(false)
    setPip(false)
  }
  const keepChrome =
    !stillWatching &&
    !locked &&
    (paused || episodesOpen || audioOpen || speedOpen || volOpen || barHover || helpOpen || reportOpen || pip)
  const continueWatchingRef = useRef<() => void>(() => {})
  const playNextRef = useRef<() => void>(() => {})

  const post = useCallback((payload: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage({ source: PLAYER_SOURCE, ...payload }, '*')
  }, [])

  const pulse = useCallback((kind: 'play' | 'pause' | 'back' | 'fwd') => {
    setFlash(kind)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 560)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (pip) {
      setPip(false)
      return
    }
    const el = overlayRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen()
  }, [pip])

  const togglePip = useCallback(() => {
    if (stillWatching || identOn) return
    if (window.matchMedia('(max-width: 767px)').matches) return
    setPip((on) => {
      const next = !on
      if (next) {
        if (document.fullscreenElement) void document.exitFullscreen()
        setEpisodesOpen(false)
        setAudioOpen(false)
        setSpeedOpen(false)
        setHelpOpen(false)
        setReportOpen(false)
        setChrome(true)
      }
      return next
    })
  }, [stillWatching, identOn])

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
    writePlayerPrefs({ muted, volume, speed, subs, captionSize, captionBg, captionFont, captionColor, audioTrack })
  }, [muted, volume, speed, subs, captionSize, captionBg, captionFont, captionColor, audioTrack])

  useEffect(() => {
    currentRef.current = current
  }, [current])

  useEffect(() => {
    if (!session) {
      streakRef.current = 0
      return
    }
    setChrome(true)
    setPaused(false)
    setEpisodesOpen(false)
    setAudioOpen(false)
    setSpeedOpen(false)
    setVolOpen(false)
    setBarHover(false)
    setIntroSkipped(false)
    setRecapSkipped(false)
    setLocked(false)
    setPip(false)
    setSeasonNumber(session.history?.seasonNumber ?? null)
    setFlash(null)
    const hasVideo = Boolean(youtubeIdFromHit(peekTrailer(trailerSearch(session))))
    try {
      if (hasVideo) {
        ambienceRef.current = null
      } else {
        ambienceRef.current = createWatchAmbience()
        ambienceRef.current.setMuted(audioRef.current.muted)
        ambienceRef.current.setPlaying(true)
        ambienceRef.current.setVolume(audioRef.current.volume)
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
    if (!sessionKey) return
    const fromStart = startProgress < 0.02
    const bingeTitle = fromStart && streakRef.current > 0
    setIdentOn(fromStart)
    setIdentPhase(fromStart ? (bingeTitle ? 'title' : 'logo') : 'off')
    if (!fromStart) {
      showChromeRef.current()
      return
    }
    if (!bingeTitle) playIdentBump()
    const toTitle = bingeTitle ? 0 : window.setTimeout(() => setIdentPhase('title'), 3200)
    const timer = window.setTimeout(() => {
      setIdentOn(false)
      setIdentPhase('off')
      showChromeRef.current()
    }, bingeTitle ? 2200 : 6000)
    return () => {
      if (toTitle) window.clearTimeout(toTitle)
      window.clearTimeout(timer)
    }
  }, [sessionKey, startProgress])

  useEffect(() => {
    if (!session?.history?.id || session.history.kind !== 'show') {
      setShowDetail(null)
      return
    }
    const id = session.history.id
    let cancelled = false
    getShow(id)
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
      if (locked) {
        setChrome(false)
        return
      }
      setChrome(true)
      window.clearTimeout(timer)
      if (!keepChrome) timer = window.setTimeout(() => setChrome(false), 2800)
    }
    showChromeRef.current = show
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (locked) setChrome(false)
    else if (keepChrome) setChrome(true)
    else timer = window.setTimeout(() => setChrome(false), 2800)
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement)?.tagName === 'INPUT' || (event.target as HTMLElement)?.tagName === 'SELECT'
      if (typing) return
      if (locked) {
        if (event.key === 'Escape' || event.code === 'Space') {
          event.preventDefault()
          setLocked(false)
        }
        return
      }
      if (event.key === 'Escape') {
        if (reportOpen) {
          event.preventDefault()
          event.stopImmediatePropagation()
          setReportOpen(false)
          setReportSent(false)
          return
        }
        if (helpOpen) {
          event.preventDefault()
          event.stopImmediatePropagation()
          setHelpOpen(false)
          return
        }
        if (episodesOpen || audioOpen || speedOpen) {
          event.preventDefault()
          event.stopImmediatePropagation()
          setEpisodesOpen(false)
          setAudioOpen(false)
          setSpeedOpen(false)
          return
        }
        if (pipRef.current) {
          event.preventDefault()
          event.stopImmediatePropagation()
          setPip(false)
          return
        }
        event.preventDefault()
        event.stopImmediatePropagation()
        closeWatch()
        return
      }
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault()
        setHelpOpen((open) => !open)
        return
      }
      if (stillWatching) {
        if (event.code === 'Space' || event.key === 'Enter' || event.key.toLowerCase() === 'k') {
          event.preventDefault()
          continueWatchingRef.current()
        }
        return
      }
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
      } else if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        setSubs((current) => (current === 'off' ? 'en' : current === 'en' ? 'cc' : 'off'))
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
      } else if (
        event.key.toLowerCase() === 's' &&
        isShow &&
        !introSkipped &&
        currentRef.current < skipMarks(runtimeSec, session?.history?.genres).introUntil
      ) {
        event.preventDefault()
        setIntroSkipped(true)
        post({ cmd: 'seek', seconds: skipMarks(runtimeSec, session?.history?.genres).introAt })
        show()
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFullscreen()
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        togglePip()
        show()
      } else if (event.key.toLowerCase() === 'n' && isShow) {
        event.preventDefault()
        playNextRef.current()
        show()
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
      const takeDuration = (next?: number) => {
        if (typeof next !== 'number' || next <= 0) return
        if (next < runtimeSec * 0.45) return
        setDuration(next)
      }
      if (data.type === 'ended') {
        if (typeof data.current === 'number') setCurrent(data.current)
        takeDuration(data.duration)
        setPaused(true)
        return
      }
      if (data.type !== 'time') return
      if (typeof data.current === 'number') setCurrent(data.current)
      takeDuration(data.duration)
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
  }, [session, togglePlay, skip, toggleMute, toggleFullscreen, togglePip, keepChrome, setVolumeLevel, muted, volume, duration, runtimeSec, post, episodesOpen, audioOpen, speedOpen, stillWatching, isShow, introSkipped, helpOpen, reportOpen, locked, closeWatch, pip])

  useEffect(() => {
    if (stillWatching || identOn) setPip(false)
  }, [stillWatching, identOn])

  useEffect(() => {
    if (!pip) return
    const previous = document.body.style.overflow
    document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = previous
    }
  }, [pip])

  useEffect(() => {
    const length = duration || runtimeSec
    if (length) reportProgress(current / length)
  }, [current, duration, runtimeSec, reportProgress])

  const playing = currentEpisode(showDetail, session?.history?.seasonNumber, session?.history?.episodeNumber)
  const upcoming = useMemo(
    () =>
      nextEpisode(
        showDetail,
        playing?.season.season_number ?? session?.history?.seasonNumber,
        playing?.episode.number ?? session?.history?.episodeNumber,
      ),
    [
      showDetail,
      playing?.season.season_number,
      playing?.episode.number,
      session?.history?.seasonNumber,
      session?.history?.episodeNumber,
    ],
  )
  const activeSeason =
    showDetail?.seasons?.find((season) => season.season_number === (seasonNumber ?? session?.history?.seasonNumber)) ??
    showDetail?.seasons?.[0]
  const clockSynced = clockKey === sessionKey
  const lengthNow = (clockSynced ? duration : runtimeSec) || runtimeSec
  const playhead = clockSynced ? current : startProgress * runtimeSec
  const remainingNow = Math.max(0, lengthNow - playhead)

  useEffect(() => {
    if (!session || !isShow || !activeProfile?.skipIntros) return
    if (identPhase === 'logo' || paused || stillWatching) return
    const marks = skipMarks(runtimeSec, session.history?.genres)
    if (!introSkipped && current > 2.4 && current < marks.introUntil) {
      setIntroSkipped(true)
      post({ cmd: 'seek', seconds: marks.introAt })
      return
    }
    if (
      marks.recapUntil > marks.recapAt &&
      !recapSkipped &&
      !identOn &&
      current >= marks.introUntil &&
      current < marks.recapUntil
    ) {
      setRecapSkipped(true)
      setIntroSkipped(true)
      post({ cmd: 'seek', seconds: marks.recapAt })
    }
  }, [
    session,
    isShow,
    activeProfile?.skipIntros,
    identPhase,
    identOn,
    paused,
    stillWatching,
    introSkipped,
    recapSkipped,
    current,
    runtimeSec,
    post,
  ])

  useEffect(() => {
    if (!upcoming || !session?.history) return
    if (nextDismissed || stillWatching) return
    if (activeProfile?.autoplayNext === false) return
    const ended = lengthNow > 0 && remainingNow <= 2.2
    const nearStart = playhead < 8 && remainingNow > 8
    if (!ended || nearStart) return
    const href = upcoming.episode.watch_href
    if (!href) return
    const key = upcoming.episode.id
    if (autoNextRef.current === key) return
    if (streakRef.current >= 2) {
      setStillWatching(true)
      setPaused(true)
      post({ cmd: 'pause' })
      ambienceRef.current?.setPlaying(false)
      return
    }
    autoNextRef.current = key
    streakRef.current += 1
    playClick()
    openWatch(href, session.history.title, {
      ...session.history,
      watch_href: upcoming.episode.watch_href,
      runtime: upcoming.episode.duration ?? session.history.runtime,
      progress: 0,
      seasonNumber: upcoming.season.season_number,
      episodeNumber: upcoming.episode.number,
      episodeId: upcoming.episode.id,
    })
  }, [remainingNow, playhead, lengthNow, upcoming, session, openWatch, activeProfile?.autoplayNext, nextDismissed, stillWatching, post])

  const continueWatching = useCallback(() => {
    if (!session?.history) {
      streakRef.current = 0
      setStillWatching(false)
      return
    }
    if (upcoming) {
      streakRef.current = 0
      setStillWatching(false)
      playClick()
      openWatch(upcoming.episode.watch_href, session.history.title, {
        ...session.history,
        year: session.history.year,
        watch_href: upcoming.episode.watch_href,
        runtime: upcoming.episode.duration ?? session.history.runtime,
        progress: 0,
        seasonNumber: upcoming.season.season_number,
        episodeNumber: upcoming.episode.number,
        episodeId: upcoming.episode.id,
      })
      return
    }
    streakRef.current = 0
    setStillWatching(false)
    setPaused(false)
    post({ cmd: 'play' })
    ambienceRef.current?.setPlaying(true)
  }, [session, upcoming, openWatch, post])

  useEffect(() => {
    continueWatchingRef.current = continueWatching
  }, [continueWatching])

  if (!session) return null

  const length = duration || runtimeSec
  const progress = length ? Math.min(1, current / length) : 0
  const remaining = Math.max(0, length - current)
  const episodeLabel = playing
    ? `S${playing.season.season_number}:E${playing.episode.number}`
    : isShow
      ? `S${session.history?.seasonNumber ?? 1}:E${session.history?.episodeNumber ?? 1}`
      : null
  const marks = skipMarks(runtimeSec, session.history?.genres)
  const showSkipIntro =
    isShow &&
    identPhase !== 'logo' &&
    !introSkipped &&
    !activeProfile?.skipIntros &&
    current > 2.4 &&
    current < marks.introUntil &&
    !episodesOpen &&
    !audioOpen &&
    !speedOpen
  const showSkipRecap =
    isShow &&
    marks.recapUntil > marks.recapAt &&
    !recapSkipped &&
    !identOn &&
    !showSkipIntro &&
    !activeProfile?.skipIntros &&
    current >= marks.introUntil &&
    current < marks.recapUntil &&
    !episodesOpen &&
    !audioOpen &&
    !speedOpen
  const showNext = Boolean(upcoming && remaining <= NEXT_CARD_AT && !nextDismissed && !episodesOpen && !audioOpen && !speedOpen && !stillWatching && length > 0)
  const countingDown = remaining <= AUTO_IN && activeProfile?.autoplayNext !== false
  const nextCount = countingDown ? Math.max(1, Math.ceil(remaining)) : null
  const nextProgress = countingDown ? Math.min(1, remaining / AUTO_IN) : 1
  const captionPool = captionLines(playing?.episode.synopsis)
  const caption = subs === 'off' ? null : captionPool[Math.floor(current / 9) % captionPool.length]

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
    post({ cmd: 'seek', seconds: marks.introAt })
  }

  function skipRecap(event: { stopPropagation: () => void }) {
    event.stopPropagation()
    playClick()
    playWhoosh()
    setRecapSkipped(true)
    setIntroSkipped(true)
    post({ cmd: 'seek', seconds: marks.recapAt })
  }

  function playEpisode(season: Season, episode: Episode, binge = false) {
    if (!session?.history) return
    if (binge) {
      if (streakRef.current >= 2) {
        setStillWatching(true)
        setPaused(true)
        post({ cmd: 'pause' })
        ambienceRef.current?.setPlaying(false)
        return
      }
      streakRef.current += 1
    } else {
      streakRef.current = 0
    }
    setStillWatching(false)
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

  playNextRef.current = () => {
    if (upcoming) playEpisode(upcoming.season, upcoming.episode, true)
  }

  function onVolume(next: number) {
    setVolumeLevel(next)
  }

  return (
    <div
      ref={overlayRef}
      className={`watch-overlay ${paused ? 'is-paused' : ''} ${chrome ? 'is-chrome' : ''} ${episodesOpen || audioOpen ? 'is-panel' : ''} ${speedOpen ? 'is-speed' : ''} ${stillWatching ? 'is-still' : ''} ${identOn && !stillWatching ? 'is-ident' : ''} ${identPhase === 'logo' && !stillWatching ? 'is-ident-logo' : ''} ${showNext ? 'is-next' : ''} ${helpOpen ? 'is-help' : ''} ${reportOpen ? 'is-report' : ''} ${locked ? 'is-locked' : ''} ${pip ? 'is-pip' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Player"
      onClick={(event) => {
        if (locked) {
          event.preventDefault()
          return
        }
        if (stillWatching) {
          event.preventDefault()
          return
        }
        if (reportOpen) {
          event.preventDefault()
          setReportOpen(false)
          setReportSent(false)
          return
        }
        if (helpOpen) {
          event.preventDefault()
          setHelpOpen(false)
          return
        }
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
      <div className="watch-letterbox" aria-hidden="true" />
      {locked ? (
        <button
          type="button"
          className="watch-unlock"
          aria-label="Unlock"
          onClick={(event) => {
            event.stopPropagation()
            setLocked(false)
            setChrome(true)
          }}
        >
          <LockIcon className="icon" />
        </button>
      ) : null}
      {flash ? (
        <div className={`watch-flash is-${flash}`} aria-hidden="true">
          {flash === 'play' ? <PlayIcon className="icon" /> : null}
          {flash === 'pause' ? <PauseIcon className="icon" /> : null}
          {flash === 'back' ? <SkipBackIcon className="icon" /> : null}
          {flash === 'fwd' ? <SkipForwardIcon className="icon" /> : null}
        </div>
      ) : null}
      {stillWatching ? null : identPhase === 'logo' ? (
        <div className="watch-ident-bump" aria-hidden="true">
          <strong>FLIX</strong>
        </div>
      ) : (
        <div className={`watch-ident ${chrome && !identOn ? 'is-raised' : ''} ${identOn ? 'is-on' : ''}`} aria-hidden="true">
          <TitleLogo
            item={trailerSearch(session)}
            className="watch-ident-logo"
            titleClassName="watch-ident-title"
          />
          {isShow ? (
            <p className="watch-ident-ep">
              {episodeLabel}
              {playing?.episode.title ? ` ${playing.episode.title}` : ''}
            </p>
          ) : null}
        </div>
      )}
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
        <button
          type="button"
          className={`watch-report-btn ${reportOpen ? 'is-on' : ''}`}
          aria-label="Report a problem"
          aria-expanded={reportOpen}
          onClick={(event) => {
            event.stopPropagation()
            playClick()
            setHelpOpen(false)
            setEpisodesOpen(false)
            setAudioOpen(false)
            setSpeedOpen(false)
            setReportOpen((open) => {
              if (open) {
                setReportSent(false)
                return false
              }
              return true
            })
          }}
        >
          <FlagIcon className="icon" />
        </button>
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
        <div className="watch-end-cluster">
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
                <span key={nextCount ?? 'go'}>{nextCount != null ? nextCount : <PlayIcon className="icon" />}</span>
              </span>
            ) : null}
            Next Episode
          </span>
          <button
            type="button"
            className="next-ep-body"
            onClick={(event) => {
              event.stopPropagation()
              playEpisode(upcoming.season, upcoming.episode, true)
            }}
          >
            <span className="next-ep-thumb">
              <MediaImage src={episodeStill(galleryUrls, upcoming.episode.number, upcoming.episode.thumb_url)} alt="" />
              <PlayIcon className="icon" />
            </span>
            <span className="next-ep-copy">
              {session.history?.title ? <strong className="next-ep-show">{session.history.title}</strong> : null}
              <em>{upcoming.episode.title}</em>
              <span className="next-ep-code">
                S{upcoming.season.season_number}:E{upcoming.episode.number}
                {upcoming.episode.duration ? ` · ${upcoming.episode.duration}m` : ''}
              </span>
            </span>
          </button>
        </div>
        </div>
      ) : null}
      {caption ? (
        <p
          className={`watch-caption is-${captionSize} is-bg-${captionBg} is-font-${captionFont} is-color-${captionColor} ${chrome ? 'is-raised' : ''} ${subs === 'cc' ? 'is-cc' : ''}`}
        >
          {caption}
        </p>
      ) : null}
      <div className="watch-center">
        <button
          type="button"
          className="watch-ctrl"
          onClick={(event) => {
            event.stopPropagation()
            skip(-10)
          }}
          aria-label="Skip Back 10 Seconds"
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
          aria-label="Skip Forward 10 Seconds"
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
              <span className={`watch-scrub-hint ${galleryUrls.length ? 'has-art' : ''}`} style={{ left: scrubHint.x }}>
                {galleryUrls.length ? (
                  <MediaImage
                    src={galleryUrls[Math.min(galleryUrls.length - 1, Math.floor(scrubHint.ratio * galleryUrls.length))]}
                    alt=""
                  />
                ) : null}
                {formatClock(scrubHint.ratio * length)}
              </span>
            ) : null}
            {isShow && length > 0 && marks.introUntil > 0 ? (
              <span
                className="watch-mark is-intro"
                style={{ left: `${Math.min(100, (marks.introUntil / length) * 100)}%` }}
                aria-hidden="true"
              />
            ) : null}
            {isShow && length > 0 && marks.recapUntil > marks.recapAt ? (
              <span
                className="watch-mark is-recap"
                style={{ left: `${Math.min(100, (marks.recapUntil / length) * 100)}%` }}
                aria-hidden="true"
              />
            ) : null}
            <div className="watch-progress-fill" style={{ width: `${Math.round(progress * 1000) / 10}%` }}>
              <span className="watch-knob" />
            </div>
          </div>
          <span className="watch-time">{formatClock(remaining, true)}</span>
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
        <div className="watch-controls">
          <div className="watch-controls-left">
            <button
              type="button"
              className="watch-ctrl watch-lock"
              onClick={() => {
                setLocked(true)
                setChrome(false)
                setEpisodesOpen(false)
                setAudioOpen(false)
                setSpeedOpen(false)
              }}
              aria-label="Lock screen"
            >
              <LockIcon className="icon" />
            </button>
            <button type="button" className="watch-ctrl watch-transport" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
              {paused ? <PlayIcon className="icon" /> : <PauseIcon className="icon" />}
            </button>
            <button type="button" className="watch-ctrl watch-transport" onClick={() => skip(-10)} aria-label="Skip Back 10 Seconds">
              <SkipBackIcon className="icon" />
            </button>
            <button type="button" className="watch-ctrl watch-transport" onClick={() => skip(10)} aria-label="Skip Forward 10 Seconds">
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
                <SpeakerIcon muted={muted || volume <= 0.01} level={muted ? 0 : volume} className="icon" />
              </button>
              <div
                className="watch-vol-rail"
                role="slider"
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round((muted ? 0 : volume) * 100)}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  setVolOpen(true)
                  const rect = event.currentTarget.getBoundingClientRect()
                  const inset = 8
                  const height = Math.max(1, rect.height - inset * 2)
                  onVolume(1 - Math.min(1, Math.max(0, (event.clientY - rect.top - inset) / height)))
                }}
                onPointerMove={(event) => {
                  if (!event.buttons) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  const inset = 8
                  const height = Math.max(1, rect.height - inset * 2)
                  onVolume(1 - Math.min(1, Math.max(0, (event.clientY - rect.top - inset) / height)))
                }}
              >
                <span className="watch-vol-track">
                  <span className="watch-vol-fill" style={{ height: `${Math.round((muted ? 0 : volume) * 100)}%` }}>
                    <span className="watch-vol-knob" />
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="watch-controls-right">
            {isShow && upcoming ? (
              <button
                type="button"
                className="watch-ctrl"
                onClick={() => playEpisode(upcoming.season, upcoming.episode, true)}
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
              aria-label="Audio & Subtitles"
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
                aria-label="Playback Speed"
              >
                <SpeedIcon className="icon" />
              </button>
              {speedOpen ? (
                <div
                  className="watch-speed-menu"
                  role="menu"
                  aria-label="Playback Speed"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="watch-sheet-handle" aria-hidden="true" />
                  <p className="watch-speed-label">Playback Speed</p>
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
                      {speed === rate ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <CastMenu
              variant="player"
              onOpen={() => {
                setAudioOpen(false)
                setEpisodesOpen(false)
                setSpeedOpen(false)
              }}
            />
            <button
              type="button"
              className={`watch-ctrl watch-pip ${pip ? 'is-on' : ''}`}
              onClick={() => {
                togglePip()
              }}
              aria-label={pip ? 'Exit Miniplayer' : 'Miniplayer'}
            >
              <PipIcon exit={pip} className="icon" />
            </button>
            <button
              type="button"
              className="watch-ctrl"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              <FullscreenIcon exit={fullscreen} className="icon" />
            </button>
          </div>
        </div>
      </div>
      {episodesOpen || audioOpen || speedOpen ? (
        <button
          type="button"
          className={`watch-scrim ${speedOpen && !episodesOpen && !audioOpen ? 'is-clear' : ''}`}
          aria-label="Close panel"
          onClick={(event) => {
            event.stopPropagation()
            setEpisodesOpen(false)
            setAudioOpen(false)
            setSpeedOpen(false)
          }}
        />
      ) : null}
      {reportOpen ? (
        <div
          className="watch-help watch-report"
          role="dialog"
          aria-labelledby="watch-report-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="watch-help-head">
            <h2 id="watch-report-title">Report a Problem</h2>
            <button
              type="button"
              className="watch-help-close"
              onClick={() => {
                setReportOpen(false)
                setReportSent(false)
              }}
              aria-label="Close"
            >
              <CloseIcon className="icon" />
            </button>
          </div>
          {reportSent ? (
            <p className="watch-report-thanks">Thanks for reporting. Playback stays on this device.</p>
          ) : (
            <form
              className="watch-report-form"
              onSubmit={(event) => {
                event.preventDefault()
                playClick()
                setReportSent(true)
              }}
            >
              <p className="watch-report-lead">What’s wrong with playback?</p>
              {REPORT_REASONS.map((reason) => (
                <label className="watch-report-check" key={reason.id}>
                  <input
                    type="radio"
                    name="watch-report"
                    checked={reportReason === reason.id}
                    onChange={() => setReportReason(reason.id)}
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
              <button type="submit" className="watch-report-submit">
                Submit
              </button>
            </form>
          )}
        </div>
      ) : null}
      {helpOpen ? (
        <div
          className="watch-help"
          role="dialog"
          aria-labelledby="watch-help-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="watch-help-head">
            <h2 id="watch-help-title">Keyboard Shortcuts</h2>
            <button type="button" className="watch-help-close" onClick={() => setHelpOpen(false)} aria-label="Close">
              <CloseIcon className="icon" />
            </button>
          </div>
          <dl>
            <div>
              <dt>Seek Backward</dt>
              <dd>
                <kbd>J</kbd>
                <kbd>←</kbd>
              </dd>
            </div>
            <div>
              <dt>Seek Forward</dt>
              <dd>
                <kbd>L</kbd>
                <kbd>→</kbd>
              </dd>
            </div>
            <div>
              <dt>Play / Pause</dt>
              <dd>
                <kbd>K</kbd>
                <kbd>Space</kbd>
              </dd>
            </div>
            <div>
              <dt>Captions</dt>
              <dd>
                <kbd>C</kbd>
              </dd>
            </div>
            <div>
              <dt>Mute</dt>
              <dd>
                <kbd>M</kbd>
              </dd>
            </div>
            <div>
              <dt>Volume</dt>
              <dd>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
              </dd>
            </div>
            <div>
              <dt>Full Screen</dt>
              <dd>
                <kbd>F</kbd>
              </dd>
            </div>
            <div>
              <dt>Miniplayer</dt>
              <dd>
                <kbd>P</kbd>
              </dd>
            </div>
            {isShow ? (
              <div>
                <dt>Skip Intro</dt>
                <dd>
                  <kbd>S</kbd>
                </dd>
              </div>
            ) : null}
            {isShow ? (
              <div>
                <dt>Next Episode</dt>
                <dd>
                  <kbd>N</kbd>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Seek</dt>
              <dd>
                <kbd>0</kbd>
                <span className="watch-help-sep">–</span>
                <kbd>9</kbd>
              </dd>
            </div>
            <div>
              <dt>Back</dt>
              <dd>
                <kbd>Esc</kbd>
              </dd>
            </div>
            <div>
              <dt>Shortcuts</dt>
              <dd>
                <kbd>?</kbd>
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
      {stillWatching ? (
        <div
          className="watch-still"
          role="dialog"
          aria-label="Are you still watching?"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="watch-still-inner">
            {activeProfile ? (
              <div className="watch-still-profile">
                <span className="watch-still-avatar">
                  <AvatarArt avatar={avatarFor(activeProfile)} alt="" />
                </span>
                <span>{activeProfile.name}</span>
              </div>
            ) : null}
            {session.history?.title ? <p className="watch-still-kicker">{session.history.title}</p> : null}
            {episodeLabel ? (
              <p className="watch-still-ep">
                {episodeLabel}
                {playing?.episode.title ? `  ${playing.episode.title}` : ''}
              </p>
            ) : null}
            <h2>Are you still watching?</h2>
            <div className="watch-still-actions">
              <button type="button" className="btn btn-play" onClick={continueWatching}>
                <PlayIcon className="icon" />
                Continue Watching
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  streakRef.current = 0
                  closeWatch()
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {episodesOpen ? (
        <div className="watch-panel watch-episodes" onClick={(event) => event.stopPropagation()}>
          <span className="watch-sheet-handle" aria-hidden="true" />
          <div className="watch-ep-head">
            <h2>{session.history?.title || session.title}</h2>
            {showDetail && showDetail.seasons && showDetail.seasons.length > 1 ? (
              <SeasonMenu
                seasons={showDetail.seasons}
                history={session.history ? { ...session.history, watchedAt: 0 } : undefined}
                value={activeSeason?.season_number ?? 1}
                onChange={(seasonNumber) => setSeasonNumber(seasonNumber)}
              />
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
              const done = !active && epProgress >= 0.9
              return (
                <button
                  type="button"
                  key={episode.id}
                  className={`watch-ep ${active ? 'is-on' : ''} ${done ? 'is-watched' : ''}`}
                  onClick={() => playEpisode(season, episode)}
                >
                  <span className="watch-ep-num">{episode.number}</span>
                    <span className="watch-ep-thumb" style={{ '--focal': stillFocus(episode.number) } as CSSProperties}>
                    <MediaImage src={episodeStill(galleryUrls, episode.number, episode.thumb_url)} alt="" />
                    {done ? (
                      <span className="watch-ep-watched" aria-hidden="true">
                        <CheckIcon className="icon" />
                      </span>
                    ) : null}
                    <PlayIcon className="icon" />
                    {epProgress > 0.05 && epProgress < 0.9 ? (
                      <div className="progress-track watch-ep-progress">
                        <div style={{ width: `${Math.round(Math.min(1, epProgress) * 100)}%` }} />
                      </div>
                    ) : null}
                  </span>
                  <span className="watch-ep-copy">
                    <em>
                      {episode.title}
                      {active ? <small className="watch-ep-playing">Playing</small> : null}
                    </em>
                    {episode.duration ? <small className="watch-ep-dur">{episode.duration}m</small> : null}
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
        <div
          className="watch-panel watch-audio"
          role="dialog"
          aria-label="Audio & Subtitles"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="watch-audio-head">
            <span className="watch-sheet-handle" aria-hidden="true" />
            <p className="watch-audio-title">{session.history?.title || session.title}</p>
            <p className="watch-audio-label">Audio & Subtitles</p>
          </div>
          <div>
            <h2>Audio</h2>
            <button type="button" className={audioTrack === 'en' ? 'is-on' : ''} onClick={() => setAudioTrack('en')}>
              {audioTrack === 'en' ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
              English [Original]
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
            <button type="button" className={subs === 'cc' ? 'is-on' : ''} onClick={() => setSubs('cc')}>
              {subs === 'cc' ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
              English [CC]
            </button>
            <h2 className="watch-caption-size-label">Size</h2>
            {(
              [
                ['s', 'Small'],
                ['m', 'Medium'],
                ['l', 'Large'],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={captionSize === value ? 'is-on' : ''}
                onClick={() => setCaptionSize(value)}
              >
                {captionSize === value ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
                {label}
              </button>
            ))}
            <h2 className="watch-caption-size-label">Background</h2>
            {(
              [
                ['shadow', 'Drop shadow'],
                ['box', 'Opaque'],
                ['none', 'None'],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={captionBg === value ? 'is-on' : ''}
                onClick={() => setCaptionBg(value)}
              >
                {captionBg === value ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
                {label}
              </button>
            ))}
            <h2 className="watch-caption-size-label">Font</h2>
            {(
              [
                ['default', 'Default'],
                ['casual', 'Casual'],
                ['cursive', 'Cursive'],
                ['smallcaps', 'Small Caps'],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={captionFont === value ? 'is-on' : ''}
                onClick={() => setCaptionFont(value)}
              >
                {captionFont === value ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
                {label}
              </button>
            ))}
            <h2 className="watch-caption-size-label">Font color</h2>
            {(
              [
                ['white', 'White'],
                ['yellow', 'Yellow'],
                ['cyan', 'Cyan'],
                ['green', 'Green'],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={captionColor === value ? 'is-on' : ''}
                onClick={() => setCaptionColor(value)}
              >
                {captionColor === value ? <CheckIcon className="icon" /> : <span className="watch-check-spacer" />}
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
