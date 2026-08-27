import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, FullscreenIcon } from '../components/Icons'
import { useWatch } from './WatchContext'

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

export function WatchOverlay() {
  const { session, closeWatch } = useWatch()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [chrome, setChrome] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const [fullscreen, setFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    const el = overlayRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen()
  }, [])

  useEffect(() => {
    if (!session) return
    setChrome(true)
    setNow(Date.now())
    let timer = window.setTimeout(() => setChrome(false), 3200)
    const show = () => {
      setChrome(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setChrome(false), 3200)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFullscreen()
      } else show()
    }
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    window.addEventListener('mousemove', show)
    window.addEventListener('pointerdown', show)
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', show)
      window.removeEventListener('pointerdown', show)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [session, closeWatch, toggleFullscreen])

  useEffect(() => {
    if (!session || !chrome) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [session, chrome])

  if (!session) return null

  const runtimeSec = Math.max(60, (session.history?.runtime ?? 48) * 60)
  const previous = session.history?.progress ?? 0
  const elapsed = (now - session.startedAt) / 1000
  const progress = Math.min(0.98, Math.max(0, previous + elapsed / runtimeSec))
  const remaining = runtimeSec * (1 - progress)
  const episode =
    session.history?.seasonNumber && session.history?.episodeNumber
      ? `S${session.history.seasonNumber}:E${session.history.episodeNumber}`
      : null

  return (
    <div ref={overlayRef} className="watch-overlay" role="dialog" aria-modal="true" aria-label="Player">
      <button type="button" className="watch-back" onClick={closeWatch} aria-label="Back">
        <ChevronLeftIcon className="icon" />
      </button>
      <div className={`watch-topbar ${chrome ? 'is-visible' : ''}`}>
        <p className="watch-title">
          {session.title}
          {episode ? <span> {episode}</span> : null}
        </p>
      </div>
      <div className={`watch-bottombar ${chrome ? 'is-visible' : ''}`}>
        <div className="watch-progress" aria-hidden="true">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="watch-controls">
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
      <iframe
        className="watch-frame"
        src={session.href}
        title={session.title}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
