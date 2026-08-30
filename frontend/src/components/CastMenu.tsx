import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  deviceFromCode,
  formatTvCode,
  loadCastDevices,
  saveCastDevices,
  type CastDevice,
} from '../lib/cast'
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
  const [pairing, setPairing] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<CastDevice[]>(() => loadCastDevices())
  const [activeId, setActiveId] = useState<string | null>(null)
  const player = variant === 'player'

  useEffect(() => {
    if (!open) return
    setSearching(true)
    setLearnMore(false)
    setPairing(false)
    setCode('')
    setError(null)
    setDevices(loadCastDevices())
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

  function linkCode(event: FormEvent) {
    event.preventDefault()
    const device = deviceFromCode(code)
    if (!device) {
      setError('Enter the 8-character code shown on your TV.')
      return
    }
    const next = [device, ...devices.filter((entry) => entry.id !== device.id)]
    saveCastDevices(next)
    setDevices(next)
    setActiveId(device.id)
    setCode('')
    setError(null)
    setPairing(false)
    playClick()
  }

  const active = devices.find((device) => device.id === activeId) ?? null

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
                {active ? (
                  <p className="cast-sheet-status">
                    Connected to {active.name}. Playback still stays on this device.
                  </p>
                ) : devices.length ? (
                  <p className="cast-sheet-status">Choose a linked device</p>
                ) : (
                  <p className="cast-sheet-status">No devices found</p>
                )}
                {devices.length ? (
                  <ul className="cast-device-list">
                    {devices.map((device) => {
                      const on = device.id === activeId
                      return (
                        <li key={device.id}>
                          <button
                            type="button"
                            className={`cast-device ${on ? 'is-on' : ''}`}
                            onClick={() => {
                              playClick()
                              setActiveId(on ? null : device.id)
                            }}
                          >
                            <strong>{device.name}</strong>
                            <em>{on ? 'Connected' : device.kind === 'speaker' ? 'Speaker' : 'TV'}</em>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="cast-sheet-hint">
                    Make sure your TV or speaker is on and connected to the same Wi-Fi as this device.
                  </p>
                )}
                {pairing ? (
                  <form className="cast-pair-form" onSubmit={linkCode}>
                    <label>
                      TV code
                      <input
                        value={formatTvCode(code)}
                        onChange={(event) => {
                          setCode(event.target.value)
                          setError(null)
                        }}
                        placeholder="ABCD-1234"
                        autoComplete="off"
                        spellCheck={false}
                        aria-label="TV code"
                      />
                    </label>
                    {error ? <p className="cast-sheet-hint">{error}</p> : null}
                    <button type="submit" className="cast-sheet-more">
                      Link TV
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="cast-sheet-more"
                    onClick={() => {
                      setPairing(true)
                      setLearnMore(false)
                    }}
                  >
                    Link with a TV code
                  </button>
                )}
                <Link to="/tv" className="cast-sheet-more" onClick={() => setOpen(false)}>
                  Enter a code on this device
                </Link>
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
                    FLIX can remember a TV you link with an 8-character code. There is no Chromecast session, so
                    sound and picture stay on this browser.
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
