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
    playProfileSting()
  } catch {
    /* autoplay / closed context */
  }
}

/** Plays when a profile is chosen, like Netflix entering browse. */
export function playProfileSting() {
  try {
    const ac = audio()
    const now = ac.currentTime
    tone(ac, 98, now, 0.28, 0.09, 'sine')
    tone(ac, 196, now, 0.22, 0.05, 'triangle')
    tone(ac, 294, now + 0.16, 0.42, 0.07, 'triangle')
    tone(ac, 440, now + 0.16, 0.36, 0.035, 'sine')
    sessionStorage.setItem(STING_KEY, '1')
  } catch {
    /* autoplay / closed context */
  }
}

export function playWhoosh() {
  try {
    const ac = audio()
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const filter = ac.createBiquadFilter()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(210, now)
    osc.frequency.exponentialRampToValueAtTime(72, now + 0.24)
    filter.type = 'lowpass'
    filter.frequency.value = 820
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    osc.connect(filter).connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.32)
  } catch {
    /* ignore */
  }
}

export function playClick() {
  try {
    const ac = audio()
    tone(ac, 1480, ac.currentTime, 0.04, 0.012, 'sine')
  } catch {
    /* ignore */
  }
}

export type WatchAmbience = {
  setMuted: (muted: boolean) => void
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  stop: () => void
}

export function createWatchAmbience(): WatchAmbience {
  const ac = new AudioContext()
  if (ac.state === 'suspended') void ac.resume()
  const osc = ac.createOscillator()
  const fifth = ac.createOscillator()
  const filter = ac.createBiquadFilter()
  const gain = ac.createGain()
  const lfo = ac.createOscillator()
  const lfoGain = ac.createGain()
  osc.type = 'sawtooth'
  osc.frequency.value = 49
  fifth.type = 'triangle'
  fifth.frequency.value = 73.5
  filter.type = 'lowpass'
  filter.frequency.value = 220
  lfo.type = 'sine'
  lfo.frequency.value = 0.13
  lfoGain.gain.value = 40
  gain.gain.value = 0
  osc.connect(filter)
  fifth.connect(filter)
  lfo.connect(lfoGain).connect(filter.frequency)
  filter.connect(gain).connect(ac.destination)
  osc.start()
  fifth.start()
  lfo.start()

  let muted = false
  let playing = true
  let volume = 1

  function apply() {
    const target = muted || !playing ? 0 : 0.035 * volume
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
    setVolume(next) {
      volume = Math.min(1, Math.max(0, next))
      apply()
    },
    stop() {
      try {
        osc.stop()
        fifth.stop()
        lfo.stop()
        void ac.close()
      } catch {
        /* already closed */
      }
    },
  }
}
