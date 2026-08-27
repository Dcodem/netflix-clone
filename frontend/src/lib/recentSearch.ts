const STORAGE_KEY = 'flix.search.recent.v1'
const LIMIT = 8

export function listRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : []
  } catch {
    return []
  }
}

export function pushRecentSearch(query: string) {
  const value = query.trim()
  if (value.length < 3) return
  const needle = value.toLowerCase()
  const next = [
    value,
    ...listRecentSearches().filter((entry) => {
      const existing = entry.toLowerCase()
      return existing !== needle && !needle.startsWith(existing) && !existing.startsWith(needle)
    }),
  ].slice(0, LIMIT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY)
}
