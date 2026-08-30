import { useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

const PATHS = ['/movies', '/shows', '/catalog/movies', '/catalog/shows']

function formatMbps(value: number) {
  if (value >= 100) return String(Math.round(value))
  if (value >= 10) return value.toFixed(0)
  return value.toFixed(1)
}

function streamLabel(mbps: number) {
  if (mbps >= 15) return 'Ultra HD'
  if (mbps >= 5) return 'Full HD'
  if (mbps >= 3) return 'HD'
  return 'SD'
}

async function measure(onTick: (mbps: number) => void, signal: AbortSignal) {
  let bytes = 0
  const start = performance.now()
  for (let round = 0; round < 3; round += 1) {
    for (const path of PATHS) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const join = path.includes('?') ? '&' : '?'
      const response = await fetch(`${API_BASE}${path}${join}_=${Date.now()}-${round}`, {
        cache: 'no-store',
        signal,
      })
      const buffer = await response.arrayBuffer()
      bytes += buffer.byteLength
      const seconds = Math.max((performance.now() - start) / 1000, 0.05)
      onTick((bytes * 8) / seconds / 1_000_000)
    }
  }
}

export function SpeedTest() {
  const [running, setRunning] = useState(true)
  const [mbps, setMbps] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)

  function start() {
    const id = ++runId.current
    const ac = new AbortController()
    setRunning(true)
    setDone(false)
    setError(null)
    setMbps(0)
    void measure((next) => {
      if (runId.current === id) setMbps(next)
    }, ac.signal)
      .then(() => {
        if (runId.current !== id) return
        setRunning(false)
        setDone(true)
      })
      .catch((err: unknown) => {
        if (runId.current !== id || (err instanceof DOMException && err.name === 'AbortError')) return
        setRunning(false)
        setError('Could not measure this connection.')
      })
    return () => {
      ac.abort()
    }
  }

  useEffect(() => {
    return start()
  }, [])

  return (
    <main className="page-pad speed-page">
      <p className="speed-kicker">FLIX Speed Test</p>
      {error ? <p className="speed-error">{error}</p> : null}
      <p className="speed-readout" aria-live="polite">
        <strong>{formatMbps(mbps)}</strong>
        <span>Mbps</span>
      </p>
      {done && !error ? (
        <p className="speed-quality">This connection can stream up to {streamLabel(mbps)}.</p>
      ) : (
        <p className="speed-quality">{running ? 'Measuring this browser…' : 'Ready'}</p>
      )}
      <p className="speed-note">
        This measures how fast catalog data loads on this device. Playback still stays in this browser. FLIX does not
        use a third-party speed test.
      </p>
      <button type="button" className="speed-again" onClick={() => start()} disabled={running}>
        {running ? 'Testing…' : 'Again'}
      </button>
    </main>
  )
}
