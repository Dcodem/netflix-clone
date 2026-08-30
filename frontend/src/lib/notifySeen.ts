export function noticeKey(notice: { kicker: string; item: { id: string } }) {
  return `${notice.kicker}:${notice.item.id}`
}

function storageKey(profileId: string) {
  return `flix.notifySeen.${profileId}`
}

export function readNotifySeen(profileId?: string | null): Set<string> {
  if (!profileId) return new Set()
  try {
    const raw = localStorage.getItem(storageKey(profileId))
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [])
  } catch {
    return new Set()
  }
}

export function writeNotifySeen(profileId: string, keys: string[]) {
  const next = [...new Set([...readNotifySeen(profileId), ...keys])].slice(-80)
  try {
    localStorage.setItem(storageKey(profileId), JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function withNotifySeen<T extends { kicker: string; item: { id: string }; unread?: boolean }>(
  notices: T[],
  profileId?: string | null,
): T[] {
  const seen = readNotifySeen(profileId)
  return notices.map((notice) => ({
    ...notice,
    unread: Boolean(notice.unread) && !seen.has(noticeKey(notice)),
  }))
}
