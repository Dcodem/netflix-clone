import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMovies, getTrending } from '../api/client'
import type { MovieListItem } from '../api/types'
import { useProfiles } from '../profiles/ProfileContext'

const GENRE_CHOICES = [
  'Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Science Fiction',
  'Romance', 'Animation', 'Documentary', 'Family', 'Crime', 'Fantasy',
  'Adventure', 'Mystery', 'War', 'Music',
]

const STEP_LABELS = ['Taste', 'Favorites', 'Done']

/** First-login onboarding: 2 quick questions + a 5-title pick grid. */
export function Onboarding() {
  const navigate = useNavigate()
  const { setFavoriteGenres, rateTitle } = useProfiles()
  const [step, setStep] = useState(0)
  const [genres, setGenres] = useState<string[]>([])
  const [loved, setLoved] = useState<MovieListItem[]>([])
  const [pool, setPool] = useState<MovieListItem[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Seed grid: trending worldwide + a slice of the catalog, so the picks
    // are recognizable faces, not obscure catalog noise.
    Promise.all([getTrending('all').catch(() => []), getMovies().catch(() => [])])
      .then(([trending, home]) => {
        if (cancelled) return
        const merged: MovieListItem[] = []
        const seen = new Set<string>()
        for (const item of [...trending, ...home]) {
          if (seen.has(item.id)) continue
          seen.add(item.id)
          merged.push(item)
          if (merged.length >= 24) break
        }
        setPool(merged)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const canNext = step === 0 ? genres.length >= 3 : loved.length >= 5

  async function finish() {
    setBusy(true)
    try {
      // Seeds into FLIX's existing taste engine: favoriteGenres carry 3.5
      // weight/genre; each loved pick is a 'love' rating (2.4/genre). View
      // history keeps adding weight with recency decay as they watch.
      await setFavoriteGenres(genres)
      for (const item of loved) {
        rateTitle(
          {
            id: item.id,
            title: item.title,
            kind: item.kind ?? 'movie',
            year: item.year ?? null,
            poster_url: item.poster_url ?? null,
            genres: item.genres ?? [],
            tmdb_id: item.tmdb_id ?? null,
          },
          'love',
        )
      }
    } finally {
      setBusy(false)
    }
    navigate('/browse', { replace: true })
  }

  return (
    <main className="onboarding">
      <div className="onboarding-progress" aria-hidden="true">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`onboarding-progress-step ${i <= step ? 'is-done' : ''}`}>
            <span className="onboarding-progress-dot" />
            <span className="onboarding-progress-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="onboarding-card">
        {step === 0 && (
          <>
            <div className="onboarding-brand">F L I X</div>
            <h1>What do you love watching?</h1>
            <p className="onboarding-sub">
              Pick at least three genres — we'll shape your home page around them. You can change
              this any time.
            </p>
            <div className="onboarding-genres">
              {GENRE_CHOICES.map((genre) => {
                const on = genres.includes(genre)
                return (
                  <button
                    key={genre}
                    type="button"
                    className={`onboarding-chip ${on ? 'is-on' : ''}`}
                    onClick={() =>
                      setGenres((prev) => (on ? prev.filter((g) => g !== genre) : [...prev, genre]))
                    }
                  >
                    {genre}
                  </button>
                )
              })}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="onboarding-brand">F L I X</div>
            <h1>Pick five you've loved</h1>
            <p className="onboarding-sub">
              Tap titles you've enjoyed — anywhere, any time. {loved.length}/5 selected
            </p>
            {pool.length === 0 ? (
              <div className="onboarding-loading">Loading picks…</div>
            ) : (
              <div className="onboarding-grid">
                {pool.map((item) => {
                  const on = loved.some((l) => l.id === item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`onboarding-title ${on ? 'is-on' : ''}`}
                      onClick={() =>
                        setLoved((prev) =>
                          on ? prev.filter((l) => l.id !== item.id) : prev.length < 8 ? [...prev, item] : prev,
                        )
                      }
                      aria-label={item.title}
                    >
                      {item.poster_url ? (
                        <img src={item.poster_url} alt="" loading="lazy" />
                      ) : (
                        <span className="onboarding-title-fallback">{item.title}</span>
                      )}
                      <span className="onboarding-title-shade" aria-hidden="true" />
                      <span className="onboarding-title-name">{item.title}</span>
                      {on && (
                        <span className="onboarding-check" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <div className="onboarding-brand">F L I X</div>
            <h1>You're all set.</h1>
            <p className="onboarding-sub">
              Your home page is tuned to {genres.slice(0, 3).join(', ')}
              {loved.length ? `, starting from picks like ${loved.slice(0, 2).map((l) => l.title).join(' and ')}` : ''}.
              It keeps learning every time you watch.
            </p>
          </>
        )}
      </div>
      <div className="onboarding-actions">
        {step > 0 && (
          <button type="button" className="onboarding-btn onboarding-btn-ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            className="onboarding-btn"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button type="button" className="onboarding-btn" disabled={busy} onClick={() => void finish()}>
            {busy ? 'Setting up…' : 'Start watching'}
          </button>
        )}
      </div>
    </main>
  )
}
