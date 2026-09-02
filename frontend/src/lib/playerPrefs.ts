const KEY = 'flix.playerPrefs'

export type CaptionSize = 's' | 'm' | 'l'
export type CaptionBg = 'shadow' | 'box' | 'none'
export type CaptionFont = 'default' | 'casual' | 'cursive' | 'smallcaps'
export type CaptionColor = 'white' | 'yellow' | 'cyan' | 'green'

export type PlayerPrefs = {
  volume: number
  muted: boolean
  subs: 'off' | 'en' | 'cc'
  captionSize: CaptionSize
  captionBg: CaptionBg
  captionFont: CaptionFont
  captionColor: CaptionColor
  audioTrack: 'en' | 'ad'
  speed: number
}

const DEFAULTS: PlayerPrefs = {
  volume: 1,
  muted: false,
  subs: 'off',
  captionSize: 'm',
  captionBg: 'shadow',
  captionFont: 'default',
  captionColor: 'white',
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
      captionBg: raw.captionBg === 'box' || raw.captionBg === 'none' ? raw.captionBg : 'shadow',
      captionFont:
        raw.captionFont === 'casual' || raw.captionFont === 'cursive' || raw.captionFont === 'smallcaps'
          ? raw.captionFont
          : 'default',
      captionColor:
        raw.captionColor === 'yellow' || raw.captionColor === 'cyan' || raw.captionColor === 'green'
          ? raw.captionColor
          : 'white',
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

export function patchPlayerPrefs(partial: Partial<PlayerPrefs>): PlayerPrefs {
  const next = { ...readPlayerPrefs(), ...partial }
  writePlayerPrefs(next)
  return next
}
