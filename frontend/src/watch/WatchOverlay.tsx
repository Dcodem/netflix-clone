import { useEffect, useState } from 'react'
import { useWatch } from './WatchContext'

export function WatchOverlay() {
  const { session, closeWatch } = useWatch()
  const [chrome, setChrome] = useState(true)

  useEffect(() => {
    if (!session) return
    setChrome(true)
    let timer = window.setTimeout(() => setChrome(false), 2800)
    const show = () => {
      setChrome(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setChrome(false), 2800)
    }
    window.addEventListener('mousemove', show)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', show)
    }
  }, [session])

  if (!session) return null

  return (
    <div className="watch-overlay" role="dialog" aria-modal="true" aria-label="Player">
      <div className={`watch-topbar ${chrome ? 'is-visible' : ''}`}>
        <button type="button" className="watch-back" onClick={closeWatch} aria-label="Back">
          ‹
        </button>
        <p className="watch-title">{session.title}</p>
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
