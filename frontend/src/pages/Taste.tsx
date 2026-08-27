import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCatalogMany, searchTitles } from '../api/client'
import type { MovieListItem } from '../api/types'
import { CatalogImage } from '../components/CatalogImage'
import { MediaRow } from '../components/MediaRow'
import { useFetch } from '../hooks/useFetch'
import { historyToListItems } from '../lib/homeRows'
import { uniqueById } from '../lib/media'
import { filterForProfile, toLiked } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { genreWeights, recommendSimilar, topGenres } from '../profiles/taste'
import { TASTE_GENRES } from '../profiles/types'

export function Taste() {
  const { activeProfile, setFavoriteGenres, rateTitle } = useProfiles()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<MovieListItem[]>([])
  const [searching, setSearching] = useState(false)
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies', 4).catch(() => [] as MovieListItem[]),
      getCatalogMany('shows', 4).catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'taste-catalog')

  useEffect(() => {
    const needle = query.trim()
    if (needle.length < 2) {
      setHits([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = window.setTimeout(() => {
      searchTitles(needle)
        .then((items) => setHits(items))
        .catch(() => setHits([]))
        .finally(() => setSearching(false))
    }, 220)
    return () => window.clearTimeout(timer)
  }, [query])

  const profile = activeProfile
  const pool = useMemo(
    () => filterForProfile(catalog.data ?? [], profile),
    [catalog.data, profile],
  )
  const searchHits = useMemo(() => filterForProfile(hits, profile), [hits, profile])

  if (!profile) return null

  const weights = genreWeights(profile.history, profile.favoriteGenres, profile.liked)
  const ranked = Object.entries(weights).sort((a, b) => b[1] - a[1])
  const max = ranked[0]?.[1] || 1
  const favorites = new Set(profile.favoriteGenres)
  const likedIds = new Set(profile.liked.map((item) => item.id))
  const likedItems = profile.liked.map((item) => ({
    id: item.id,
    title: item.title,
    kind: item.kind,
    poster_url: item.poster_url,
    genres: item.genres,
    href: `/${item.kind === 'show' ? 'shows' : 'movies'}/view/${item.id}`,
  }))
  const similar = recommendSimilar(pool, profile.liked, 18)

  const toggleGenre = (genre: string) => {
    const next = favorites.has(genre)
      ? profile.favoriteGenres.filter((item) => item !== genre)
      : [...profile.favoriteGenres, genre]
    setFavoriteGenres(next)
  }

  return (
    <main className="page-pad taste-page">
      <h1>{profile.name}&apos;s taste</h1>
      <p className="section-sub account-lead">
        Add shows and movies you already like. Home uses those titles to find similar picks, plus the
        genres you choose and what this profile watches. Top signals right now:{' '}
        {topGenres(weights, 3).join(', ') || 'add a few titles or genres below'}.
      </p>

      <h2 className="section-title">Titles you like</h2>
      <p className="section-sub">Search the catalog and tap Add. Home uses those titles to find similar shows and movies.</p>
      <label className="taste-search">
        <span className="visually-hidden">Search titles you like</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a show or movie you like"
          autoComplete="off"
        />
      </label>
      {query.trim().length >= 2 ? (
        <ul className="taste-hits">
          {searching && !searchHits.length ? <li className="state">Searching…</li> : null}
          {!searching && !searchHits.length ? <li className="state">No titles matched that search.</li> : null}
          {searchHits.slice(0, 8).map((item) => {
            const liked = likedIds.has(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`taste-hit ${liked ? 'is-on' : ''}`}
                  onClick={() => rateTitle(toLiked(item), liked ? null : 'up')}
                >
                  <span className="taste-hit-art">
                    <CatalogImage item={item} alt="" />
                  </span>
                  <span className="taste-hit-copy">
                    <strong>{item.title}</strong>
                    <span>
                      {item.kind === 'show' ? 'TV show' : 'Movie'}
                      {item.year ? ` · ${item.year}` : ''}
                    </span>
                  </span>
                  <span className="taste-hit-action">{liked ? 'Added' : 'Add'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

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
        <p className="state">Add titles you like, watch something, or pick genres to start a taste profile.</p>
      )}

      <MediaRow title="Titles you liked" items={likedItems} />
      <MediaRow title="Similar to titles you like" items={similar} />
      <MediaRow title="Continue Watching" items={historyToListItems(profile.history).slice(0, 18)} />

      <p className="account-hint">
        <Link to="/browse">Back to Home</Link> · likes also live on each title page.
      </p>
    </main>
  )
}
