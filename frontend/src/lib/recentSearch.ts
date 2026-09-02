const STORAGE_KEY = 'flix.search.recent.v1'
const LIMIT = 5

function looksLikeUrl(value: string) {
  return (
    /^https?:\/\//i.test(value) ||
    /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value) ||
    /\d{1,3}(?:\.\d{1,3}){3}/.test(value) ||
    /:\d{2,5}\//.test(value)
  )
}

export function isLiveSearchInput(value: string) {
  const query = value.trim()
  return query.length >= 2 && !looksLikeUrl(query)
}

export function isRecentSearchQuery(value: string) {
  const query = value.trim()
  if (query.length < 3 || !isLiveSearchInput(query)) return false
  if (/(.)\1{3,}/.test(query)) return false
  return true
}

export function listRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string' && isRecentSearchQuery(entry))
      : []
  } catch {
    return []
  }
}

export function pushRecentSearch(query: string) {
  const value = query.trim()
  if (!isRecentSearchQuery(value)) return
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

export function removeRecentSearch(query: string) {
  const needle = query.trim().toLowerCase()
  const next = listRecentSearches().filter((entry) => entry.toLowerCase() !== needle)
  if (next.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  else localStorage.removeItem(STORAGE_KEY)
}

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY)
}
