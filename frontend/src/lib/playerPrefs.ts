const KEY = 'flix.playerPrefs'

export type CaptionSize = 's' | 'm' | 'l'

export type PlayerPrefs = {
  volume: number
  muted: boolean
  subs: 'off' | 'en' | 'cc'
  captionSize: CaptionSize
  audioTrack: 'en' | 'ad'
  speed: number
}

const DEFAULTS: PlayerPrefs = {
  volume: 1,
  muted: false,
  subs: 'off',
  captionSize: 'm',
  audioTrack: 'en',
  speed: 1,
}

const SPEEDS = new Set([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2])

export function readPlayerPrefs(): PlayerPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '') as Partial<PlayerPrefs>
    const volume = typeof raw.volume === 'number' ? Math.min(1, Math.max(0, raw.volume)) : DEFAULTS.volume
    const speed = SPEEDS.has(raw.speed as number) ? (raw.speed as number) : DEFAULTS.speed
    return {
      volume,
      muted: Boolean(raw.muted) || volume <= 0.01,
      subs: raw.subs === 'en' || raw.subs === 'cc' ? raw.subs : 'off',
      captionSize: raw.captionSize === 's' || raw.captionSize === 'l' ? raw.captionSize : 'm',
      audioTrack: raw.audioTrack === 'ad' ? 'ad' : 'en',
      speed,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function writePlayerPrefs(prefs: PlayerPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    /* ignore quota / private mode */
  }
}
