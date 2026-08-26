import { useWatch } from './WatchContext'

export function WatchOverlay() {
  const { session, closeWatch } = useWatch()

  if (!session) return null

  return (
    <div className="watch-overlay" role="dialog" aria-modal="true" aria-label="Player">
      <div className="watch-topbar">
        <button type="button" className="watch-back" onClick={closeWatch}>
          ‹ Back
        </button>
        <span className="watch-title">{session.title}</span>
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
