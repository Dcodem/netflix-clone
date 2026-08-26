import { Link } from 'react-router-dom'
import { MediaRow } from '../components/MediaRow'
import { useProfiles } from '../profiles/ProfileContext'
import { genreWeights, topGenres } from '../profiles/taste'
import { TASTE_GENRES } from '../profiles/types'
import { historyToListItems } from '../lib/homeRows'

export function Taste() {
  const { activeProfile, setFavoriteGenres } = useProfiles()
  if (!activeProfile) return null
  const profile = activeProfile

  const weights = genreWeights(profile.history, profile.favoriteGenres)
  const ranked = Object.entries(weights).sort((a, b) => b[1] - a[1])
  const max = ranked[0]?.[1] || 1
  const favorites = new Set(profile.favoriteGenres)
  const likedItems = profile.liked.map((item) => ({
    id: item.id,
    title: item.title,
    kind: item.kind,
    poster_url: item.poster_url,
    genres: item.genres,
    href: `/${item.kind === 'show' ? 'shows' : 'movies'}/view/${item.id}`,
  }))

  function toggleGenre(genre: string) {
    const next = favorites.has(genre)
      ? profile.favoriteGenres.filter((item) => item !== genre)
      : [...profile.favoriteGenres, genre]
    setFavoriteGenres(next)
  }

  return (
    <main className="page-pad taste-page">
      <h1>{profile.name}&apos;s taste</h1>
      <p className="section-sub account-lead">
        Picks on Home use the genres you choose, titles you like, and what this profile watches. Top signals
        right now: {topGenres(weights, 3).join(', ') || 'add a few genres below'}.
      </p>

      <h2 className="section-title">Favorite genres</h2>
      <div className="taste-chips">
        {TASTE_GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            className={`taste-chip ${favorites.has(genre) ? 'is-on' : ''}`}
            onClick={() => toggleGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      <h2 className="section-title">What this profile leans toward</h2>
      {ranked.length ? (
        <ul className="taste-bars">
          {ranked.slice(0, 8).map(([genre, value]) => (
            <li key={genre}>
              <span>{genre}</span>
              <div className="taste-bar">
                <div style={{ width: `${Math.max(8, (value / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="state">Watch something or pick genres to start a taste profile.</p>
      )}

      <MediaRow title="Titles you liked" items={likedItems} />
      <MediaRow title="Continue Watching" items={historyToListItems(profile.history).slice(0, 18)} />

      <p className="account-hint">
        <Link to="/browse">Back to Home</Link> · likes also live on each title page.
      </p>
    </main>
  )
}
