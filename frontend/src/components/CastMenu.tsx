import { useEffect, useState } from 'react'
import { playClick } from '../lib/sounds'
import { CastIcon, CloseIcon } from './Icons'

export function CastMenu({
  variant = 'header',
  onOpen,
}: {
  variant?: 'header' | 'player'
  onOpen?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(true)
  const [learnMore, setLearnMore] = useState(false)
  const player = variant === 'player'

  useEffect(() => {
    if (!open) return
    setSearching(true)
    setLearnMore(false)
    const timer = window.setTimeout(() => setSearching(false), 1600)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    if (!player) document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      if (!player) document.body.style.overflow = previous
    }
  }, [open, player])

  return (
    <div className={`cast-menu ${player ? 'is-player' : ''}`}>
      <button
        type="button"
        className={player ? 'watch-ctrl' : 'cast-btn'}
        aria-label="Cast"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          playClick()
          onOpen?.()
          setOpen(true)
        }}
      >
        <CastIcon className="icon" />
      </button>
      {open ? (
        <div className="cast-sheet" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="cast-sheet-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cast-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cast-sheet-handle" aria-hidden="true" />
            <div className="cast-sheet-head">
              <h2 id="cast-sheet-title">Cast to a Device</h2>
              <button type="button" className="cast-sheet-close" onClick={() => setOpen(false)} aria-label="Close">
                <CloseIcon className="icon" />
              </button>
            </div>
            {searching ? (
              <p className="cast-sheet-status">
                <span className="cast-sheet-spin" aria-hidden="true" />
                Looking for devices…
              </p>
            ) : (
              <>
                <p className="cast-sheet-status">No devices found</p>
                <p className="cast-sheet-hint">
                  Make sure your TV or speaker is on and connected to the same Wi-Fi as this device.
                </p>
                <button
                  type="button"
                  className="cast-sheet-more"
                  aria-expanded={learnMore}
                  onClick={() => setLearnMore((next) => !next)}
                >
                  Learn more
                </button>
                {learnMore ? (
                  <p className="cast-sheet-hint is-more">
                    FLIX looks for TVs and speakers on this network. There is no Chromecast pairing in this demo, so
                    playback stays on this device.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
