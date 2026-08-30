import type { AccountDevice } from './types'

const DEVICE_KEY = 'flix.deviceId'

export function currentDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    return 'this-browser'
  }
}

export function currentDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'This browser'
  const ua = navigator.userAgent
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'Mac'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'this device'
  return `${browser} on ${os}`
}

export function upsertCurrentDevice(devices: AccountDevice[] | undefined, now = Date.now()): AccountDevice[] {
  const id = currentDeviceId()
  const label = currentDeviceLabel()
  const rest = (devices ?? []).filter((device) => device.id !== id)
  return [{ id, label, lastUsed: now }, ...rest].slice(0, 8)
}

export function formatDeviceUsed(at: number): string {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (at >= start.getTime()) return 'Today'
  if (at >= start.getTime() - 86400000) return 'Yesterday'
  return new Date(at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
