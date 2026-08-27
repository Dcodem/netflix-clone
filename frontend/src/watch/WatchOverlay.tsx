import { useEffect, useState } from 'react'
import { ChevronLeftIcon } from '../components/Icons'
import { useWatch } from './WatchContext'

export function WatchOverlay() {
  const { session, closeWatch } = useWatch()
  const [chrome, setChrome] = useState(true)

  useEffect(() => {
    if (!session) return
    setChrome(true)
    let timer = window.setTimeout(() => setChrome(false), 3200)
    const show = () => {
      setChrome(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setChrome(false), 3200)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWatch()
      else show()
    }
    window.addEventListener('mousemove', show)
    window.addEventListener('pointerdown', show)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', show)
      window.removeEventListener('pointerdown', show)
      window.removeEventListener('keydown', onKey)
    }
  }, [session, closeWatch])

  if (!session) return null

  return (
    <div className="watch-overlay" role="dialog" aria-modal="true" aria-label="Player">
      <div className={`watch-topbar ${chrome ? 'is-visible' : ''}`}>
        <button type="button" className="watch-back" onClick={closeWatch} aria-label="Back">
          <ChevronLeftIcon className="icon" />
        </button>
        <p className="watch-title">{session.title}</p>
      </div>
      <div className={`watch-bottombar ${chrome ? 'is-visible' : ''}`} />
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
