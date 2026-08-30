import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { deviceFromCode, formatTvCode, loadCastDevices, saveCastDevices } from '../lib/cast'

export function TvPair() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [linked, setLinked] = useState<string | null>(null)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const device = deviceFromCode(code)
    if (!device) {
      setError('Enter the 8-character code shown on your TV.')
      setLinked(null)
      return
    }
    const existing = loadCastDevices()
    saveCastDevices([device, ...existing.filter((entry) => entry.id !== device.id)])
    setError(null)
    setLinked(device.name)
    setCode('')
  }

  return (
    <main className="page-pad account-page help-page">
      <h1>Enter your TV code</h1>
      <p className="help-lead">
        On a TV or stick that shows a FLIX code, type that code here. This demo only remembers the device on this
        browser. Playback still stays on this device.
      </p>
      <form className="tv-pair-form" onSubmit={onSubmit}>
        <label className="help-search tv-pair-field">
          <span className="tv-pair-label">TV code</span>
          <input
            value={formatTvCode(code)}
            onChange={(event) => {
              setCode(event.target.value)
              setError(null)
              setLinked(null)
            }}
            placeholder="ABCD-1234"
            autoComplete="off"
            spellCheck={false}
            aria-label="TV code"
          />
        </label>
        {error ? <p className="help-empty">{error}</p> : null}
        {linked ? <p className="help-lead">Linked {linked}. Open Cast to see it.</p> : null}
        <button type="submit" className="btn btn-primary">
          Link TV
        </button>
      </form>
      <p className="help-foot">
        Looking for devices on this Wi-Fi? Use Cast in the header, then choose Link with a TV code.
      </p>
      <p className="help-foot">
        <Link to="/browse">Back to Home</Link>
      </p>
    </main>
  )
}
