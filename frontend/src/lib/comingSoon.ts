import type { MovieListItem } from '../api/types'

const THIS_YEAR = new Date().getFullYear()

export function isComingSoon(item: { year?: number | null }) {
  return (item.year ?? 0) >= THIS_YEAR
}

export function comingDate(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + 4 + (hash % 42))
  return date
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
  return `Coming ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

export function comingLineFor(item: { id: string; year?: number | null }) {
  if (!isComingSoon(item)) return null
  return comingLine(comingDate(item.id))
}

export function sortByComingDate(items: MovieListItem[]) {
  return [...items].sort((a, b) => comingDate(a.id).getTime() - comingDate(b.id).getTime())
}
