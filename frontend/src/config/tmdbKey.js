/** TMDB v3 key used by the client, Vite proxy, and Vercel /tmdb function. */
export const BUNDLED_TMDB_API_KEY = '1dd1c4a1a9ac111f790158c69f59b620'

export function tmdbApiKey() {
  let fromEnv = ''
  try {
    if (typeof process !== 'undefined' && process.env) {
      fromEnv = String(process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || '').trim()
    }
  } catch {
    fromEnv = ''
  }
  return fromEnv || BUNDLED_TMDB_API_KEY
}
