const STING_KEY = 'flix.sting'

let ctx: AudioContext | null = null

function audio() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  ac: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = 'triangle',
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(gainValue, start + 0.018)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

/** Original two-note sting (not Netflix's ta-dum). Plays once per tab. */
export function playBrowseSting() {
  try {
    if (sessionStorage.getItem(STING_KEY) === '1') return
    sessionStorage.setItem(STING_KEY, '1')
    const ac = audio()
    const now = ac.currentTime
    tone(ac, 220, now, 0.2, 0.07, 'sine')
    tone(ac, 330, now + 0.14, 0.32, 0.08, 'triangle')
  } catch {
    /* autoplay / closed context */
  }
}

export function playClick() {
  try {
    const ac = audio()
    tone(ac, 920, ac.currentTime, 0.045, 0.028, 'square')
  } catch {
    /* ignore */
  }
}

export type WatchAmbience = {
  setMuted: (muted: boolean) => void
  setPlaying: (playing: boolean) => void
  stop: () => void
}

export function createWatchAmbience(): WatchAmbience {
  const ac = new AudioContext()
  if (ac.state === 'suspended') void ac.resume()
  const osc = ac.createOscillator()
  const filter = ac.createBiquadFilter()
  const gain = ac.createGain()
  osc.type = 'sawtooth'
  osc.frequency.value = 52
  filter.type = 'lowpass'
  filter.frequency.value = 180
  gain.gain.value = 0
  osc.connect(filter).connect(gain).connect(ac.destination)
  osc.start()

  let muted = false
  let playing = true

  function apply() {
    const target = muted || !playing ? 0 : 0.035
    gain.gain.cancelScheduledValues(ac.currentTime)
    gain.gain.linearRampToValueAtTime(target, ac.currentTime + 0.12)
  }

  return {
    setMuted(next) {
      muted = next
      apply()
    },
    setPlaying(next) {
      playing = next
      apply()
    },
    stop() {
      try {
        osc.stop()
        void ac.close()
      } catch {
        /* already closed */
      }
    },
  }
}
