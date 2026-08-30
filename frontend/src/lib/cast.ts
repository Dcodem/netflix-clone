export type CastDevice = {
  id: string
  name: string
  kind: 'tv' | 'speaker'
  code: string
  linkedAt: number
}

const KEY = 'flix.castDevices.v1'

const NAMES = ['Living Room TV', 'Bedroom TV', 'Kitchen Display', 'Patio Speaker']

export function loadCastDevices(): CastDevice[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CastDevice[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCastDevices(devices: CastDevice[]) {
  localStorage.setItem(KEY, JSON.stringify(devices))
}

export function normalizeTvCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
}

export function formatTvCode(value: string) {
  const compact = normalizeTvCode(value)
  return compact.length > 4 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact
}

export function deviceFromCode(code: string): CastDevice | null {
  const compact = normalizeTvCode(code)
  if (compact.length < 8) return null
  const index = compact.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % NAMES.length
  return {
    id: `cast-${compact}`,
    name: NAMES[index],
    kind: NAMES[index].includes('Speaker') ? 'speaker' : 'tv',
    code: formatTvCode(compact),
    linkedAt: Date.now(),
  }
}
