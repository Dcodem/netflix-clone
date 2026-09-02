/**
 * Coming-soon = TMDB says the release/air date is in the future. The date
 * shown to the user is the REAL release date from the API (release_date),
 * never an invented one.
 */
export function releaseDateOf(item: {
  release_date?: string | null
  year?: number | null
}): Date | null {
  const rd = item.release_date
  if (rd && /^\d{4}-\d{2}-\d{2}$/.test(rd)) {
    const d = new Date(rd + 'T12:00:00')
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

export function isComingSoon(item: {
  release_date?: string | null
  year?: number | null
}) {
  const date = releaseDateOf(item)
  if (date) return date.getTime() > Date.now()
  // No date info: fall back to "this year, unverifiable" = treat as out.
  // (Titles from previous years are always considered released.)
  return false
}

export function comingDate(_id: string, item?: { release_date?: string | null }): Date {
  const real = item ? releaseDateOf(item) : null
  if (real) return real
  // Should not happen (coming-soon implies a known future date), but keep a
  // sane fallback: 30 days out, deterministic.
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + 30)
  return date
}

export function comingDayKey(item: { release_date?: string | null; id?: string }) {
  const date = comingDate(item?.id ?? '', item)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function monthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
}

export function comingLine(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const days = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (days >= 0 && days <= 6) {
    return `Coming ${date.toLocaleDateString('en-US', { weekday: 'long' })}`
  }
  return `Coming ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export function sortByComingDate<T extends { release_date?: string | null; year?: number | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const da = releaseDateOf(a)?.getTime() ?? 0
    const dbb = releaseDateOf(b)?.getTime() ?? 0
    return da - dbb
  })
}

/** "Coming Sept 12" style line from the REAL release date, or null if the
 * title isn't coming soon. */
export function comingLineFor(item: {
  release_date?: string | null
  year?: number | null
}): string | null {
  if (!isComingSoon(item)) return null
  const date = releaseDateOf(item)
  return date ? comingLine(date) : 'Coming Soon'
}
