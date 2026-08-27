import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  ChevronLeftIcon,
  FullscreenIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SpeakerIcon,
} from '../components/Icons'
import { createWatchAmbience, playClick } from '../lib/sounds'
import { useWatch } from './WatchContext'

const PLAYER_SOURCE = 'flix-player'

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

export function WatchOverlay() {
  const { session, closeWatch } = useWatch()
  const overlayRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const ambienceRef = useRef<ReturnType<typeof createWatchAmbience> | null>(null)
  const [chrome, setChrome] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const runtimeSec = Math.max(60, (session?.history?.runtime ?? 48) * 60)
  const startProgress = session?.history?.progress ?? 0

  const post = useCallback((payload: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage({ source: PLAYER_SOURCE, ...payload }, '*')
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
      return next
    })
  }, [post])

  const skip = useCallback(
    (delta: number) => {
      playClick()
      post({ cmd: 'skip', delta })
    },
    [post],
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
    setCurrent(startProgress * runtimeSec)
    setDuration(runtimeSec)
    try {
      ambienceRef.current = createWatchAmbience()
      ambienceRef.current.setMuted(false)
      ambienceRef.current.setPlaying(true)
    } catch {
      ambienceRef.current = null
    }
    return () => {
      ambienceRef.current?.stop()
      ambienceRef.current = null
    }
  }, [session, runtimeSec, startProgress])

  useEffect(() => {
    if (!session) return
    let timer = window.setTimeout(() => setChrome(false), 3200)
    const show = () => {
      setChrome(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setChrome(false), 3200)
    }
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement)?.tagName === 'INPUT'
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
  }, [session, togglePlay, skip, toggleMute, toggleFullscreen])

  if (!session) return null

  const length = duration || runtimeSec
  const progress = length ? Math.min(1, current / length) : 0
  const remaining = Math.max(0, length - current)
  const episode =
    session.history?.seasonNumber && session.history?.episodeNumber
      ? `S${session.history.seasonNumber}:E${session.history.episodeNumber}`
      : null

  function onSeek(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    post({ cmd: 'seek', seconds: ratio * length })
  }

  return (
    <div
      ref={overlayRef}
      className={`watch-overlay ${paused ? 'is-paused' : ''} ${chrome ? 'is-chrome' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Player"
      onClick={togglePlay}
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
      {paused ? (
        <div className="watch-center" aria-hidden="true">
          <PlayIcon className="icon" />
        </div>
      ) : null}
      <div
        className={`watch-topbar ${chrome ? 'is-visible' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="watch-title">
          {session.title}
          {episode ? <span> {episode}</span> : null}
        </p>
      </div>
      <div
        className={`watch-bottombar ${chrome ? 'is-visible' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="watch-progress"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(length)}
          aria-valuenow={Math.round(current)}
          onPointerDown={onSeek}
        >
          <div style={{ width: `${Math.round(progress * 1000) / 10}%` }} />
        </div>
        <div className="watch-controls">
          <button type="button" className="watch-ctrl" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
            {paused ? <PlayIcon className="icon" /> : <PauseIcon className="icon" />}
          </button>
          <button type="button" className="watch-ctrl" onClick={() => skip(-10)} aria-label="Back 10 seconds">
            <SkipBackIcon className="icon" />
          </button>
          <button type="button" className="watch-ctrl" onClick={() => skip(10)} aria-label="Forward 10 seconds">
            <SkipForwardIcon className="icon" />
          </button>
          <button type="button" className="watch-ctrl" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            <SpeakerIcon muted={muted} className="icon" />
          </button>
          <span className="watch-time">{formatClock(remaining)}</span>
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
  )
}
