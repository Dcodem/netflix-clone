import { useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getMovie } from '../api/client'
import { CatalogImage } from '../components/CatalogImage'
import { ErrorState } from '../components/ErrorState'
import { PlayIcon, SpeakerIcon } from '../components/Icons'
import { Spinner } from '../components/Spinner'
import { TasteButtons } from '../components/TasteButtons'
import { useFetch } from '../hooks/useFetch'
import { formatRating, formatRuntime, genresOf } from '../lib/media'
import { isKidsSafe } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useWatch } from '../watch/WatchContext'

export function MovieDetail() {
  const { id = '' } = useParams()
  const { openWatch } = useWatch()
  const { activeProfile } = useProfiles()
  const { data, error, loading, retry } = useFetch(() => getMovie(id), id)
  const trailerRef = useRef<TrailerHandle>(null)
  const [muted, setMuted] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)

  if (loading) return <Spinner label="Loading movie" />
  if (error) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <ErrorState message="Movie not found" onRetry={retry} />
  if (activeProfile?.kids && !isKidsSafe(data)) return <Navigate to="/browse" replace />

  const movie = data
  const rating = formatRating(movie.rating)
  const runtime = formatRuntime(movie.runtime)
  const genres = genresOf(movie)
  const last = activeProfile?.history.find((entry) => entry.id === movie.id)

  const onWatch = () => {
    if (!movie.watch_href) return
    openWatch(movie.watch_href, movie.title, {
      id: movie.id,
      kind: movie.kind ?? 'movie',
      title: movie.title,
      year: movie.year,
      poster_url: movie.poster_url ?? null,
      genres,
      watch_href: movie.watch_href,
      progress: last?.progress,
    })
  }

  function toggleMute() {
    const next = !muted
    trailerRef.current?.setMuted(next)
    setMuted(next)
  }

  return (
    <main className="page">
      <section className="detail">
        <div className="detail-hero">
          <CatalogImage item={data} alt="" className="detail-hero-img" prefer="backdrop" />
          <TrailerPreview
            ref={trailerRef}
            title={data.title}
            year={data.year}
            kind={data.kind ?? 'movie'}
            className="hero-trailer"
            muted={muted}
            onReady={() => setTrailerReady(true)}
          />
          <div className="detail-hero-body">
            <CatalogImage item={data} alt="" className="detail-poster" />
            <div>
              <h1 className="detail-title">{data.title}</h1>
              <div className="detail-meta">
                {data.year ? <span>{data.year}</span> : null}
                {rating ? <span>★ {rating}</span> : null}
                {data.quality ? <span>{data.quality}</span> : null}
                {runtime ? <span>{runtime}</span> : null}
              </div>
              {genres.length ? <div className="detail-genres">{genres.join(' · ')}</div> : null}
              <div className="detail-actions">
                <button type="button" className="btn btn-play" onClick={onWatch} disabled={!data.watch_href}>
                  <PlayIcon className="icon" />
                  {last?.progress && last.progress > 0.05 ? 'Resume' : 'Play'}
                </button>
                <Link className="btn btn-info" to="/browse">
                  Back
                </Link>
                <TasteButtons
                  item={{
                    id: movie.id,
                    kind: movie.kind ?? 'movie',
                    title: movie.title,
                    poster_url: movie.poster_url ?? null,
                    genres,
                  }}
                />
              </div>
            </div>
          </div>
          {trailerReady ? (
            <div className="hero-controls-right">
              <button
                type="button"
                className="hero-mute"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute preview' : 'Mute preview'}
              >
                <SpeakerIcon muted={muted} className="icon" />
              </button>
            </div>
          ) : null}
        </div>
        {data.synopsis ? <p className="detail-synopsis">{data.synopsis}</p> : null}
        {data.cast?.length ? (
          <p className="detail-cast">
            <strong>Cast</strong> {data.cast.join(', ')}
          </p>
        ) : null}
      </section>
    </main>
  )
}
