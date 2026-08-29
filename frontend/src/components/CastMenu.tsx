import { useEffect, useState } from 'react'
import { playClick } from '../lib/sounds'
import { CastIcon, CloseIcon } from './Icons'

export function CastMenu() {
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(true)

  useEffect(() => {
    if (!open) return
    setSearching(true)
    const timer = window.setTimeout(() => setSearching(false), 1400)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <div className="cast-menu">
      <button
        type="button"
        className="cast-btn"
        aria-label="Cast"
        onClick={() => {
          playClick()
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
            <div className="cast-sheet-head">
              <h2 id="cast-sheet-title">Cast to a device</h2>
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
                  Make sure your TV or speaker is on and connected to the same Wi-Fi as this phone.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
