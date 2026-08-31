/** Clean messy source-site titles so TMDB can match them. Display still uses the catalog title. */

const TAG =
  /\b(?:1080p|720p|480p|2160p|4k|uhd|hdr|webrip|web-dl|bluray|blu-ray|bdrip|brrip|dvdrip|hdrip|x264|x265|h264|h265|hevc|aac|dts|truehd|atmos|yify|yts|extended|unrated|remux|repack|proper|limited|internal|multi|dubbed|subbed|hc)\b/gi

export function parseCatalogTitle(raw: string): { title: string; year: number | null } {
  let value = String(raw ?? '').trim()
  if (!value) return { title: '', year: null }

  if (/[._]/.test(value) && !/\s/.test(value)) {
    value = value.replace(/[._]+/g, ' ')
  }

  value = value.replace(TAG, ' ')

  let year: number | null = null
  const paren = value.match(/\((\d{4})\)/)
  const trailing = value.match(/(?:^|[\s.\-_])((?:19|20)\d{2})\s*$/)
  const found = paren ?? trailing
  if (found) {
    const parsed = Number(found[1])
    if (parsed >= 1900 && parsed <= 2100) {
      year = parsed
      value = value.replace(found[0], ' ')
    }
  }

  value = value
    .replace(/[\[\](){}]/g, ' ')
    .replace(/\s+[-–—]+\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return { title: value || String(raw).trim(), year }
}

export function tmdbSearchTitle(item: { title?: string; year?: number | null }): {
  title: string
  year?: number
} {
  const parsed = parseCatalogTitle(item.title ?? '')
  return {
    title: parsed.title,
    year: item.year || parsed.year || undefined,
  }
}

const TMDB_GENRES: Record<string, string> = {
  'Science Fiction': 'Sci-Fi',
  'Sci Fi': 'Sci-Fi',
  'TV Movie': 'Drama',
}

export function mapTmdbGenres(names: Array<string | undefined | null>): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const name of names) {
    const mapped = TMDB_GENRES[name?.trim() ?? ''] ?? name?.trim() ?? ''
    if (!mapped || seen.has(mapped)) continue
    seen.add(mapped)
    out.push(mapped)
  }
  return out
}

export function weakCopy(value?: string | null): boolean {
  const text = value?.trim() ?? ''
  if (text.length < 40) return true
  if (/^(watch|stream|download)\b/i.test(text)) return true
  return false
}
