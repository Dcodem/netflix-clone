export type TrailerKeys = {
  iva: string
  tmdb: string
}

export type TrailerHit = {
  source: 'iva' | 'tmdb'
  kind: 'video' | 'youtube'
  src: string
  label: string
}

export function envKeys(): TrailerKeys {
  return {
    iva: String(import.meta.env.VITE_IVA_API_KEY ?? '').trim(),
    tmdb: String(import.meta.env.VITE_TMDB_API_KEY ?? '').trim(),
  }
}

export function cacheKey(title: string, year: number | null | undefined, kind: string) {
  return `flix.trailer.v1:${kind}:${title.toLowerCase()}:${year ?? ''}`
}
