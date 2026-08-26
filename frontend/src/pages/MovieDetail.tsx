import { Link, useParams } from 'react-router-dom'
import { getMovie } from '../api/client'
import { ErrorState } from '../components/ErrorState'
import { MediaImage } from '../components/MediaImage'
import { Spinner } from '../components/Spinner'
import { TasteButtons } from '../components/TasteButtons'
import { useFetch } from '../hooks/useFetch'
import { formatRating, formatRuntime, genresOf } from '../lib/media'
import { TrailerPreview } from '../trailers/TrailerPreview'
import { useWatch } from '../watch/WatchContext'

export function MovieDetail() {
  const { id = '' } = useParams()
  const { openWatch } = useWatch()
  const { data, error, loading, retry } = useFetch(() => getMovie(id), id)

  if (loading) return <Spinner label="Loading movie" />
  if (error) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <ErrorState message="Movie not found" onRetry={retry} />

  const movie = data
  const rating = formatRating(movie.rating)
  const runtime = formatRuntime(movie.runtime)
  const genres = genresOf(movie)

  const onWatch = () => {
    if (!movie.watch_href) return
    openWatch(movie.watch_href, movie.title, {
      id: movie.id,
      kind: movie.kind ?? 'movie',
      title: movie.title,
      poster_url: movie.poster_url ?? null,
      genres,
      watch_href: movie.watch_href,
    })
  }

  return (
    <main className="page">
      <section className="detail">
        <div className="detail-hero">
          <MediaImage src={data.backdrop_url || data.poster_url} alt="" className="detail-hero-img" />
          <TrailerPreview title={data.title} year={data.year} kind={data.kind ?? 'movie'} className="hero-trailer" />
          <div className="detail-hero-body">
            {data.poster_url ? (
              <MediaImage src={data.poster_url} alt="" className="detail-poster" />
            ) : null}
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
                <button type="button" className="btn btn-primary" onClick={onWatch} disabled={!data.watch_href}>
                  ▶ Watch
                </button>
                <Link className="btn btn-ghost" to="/browse">
                  ← Back
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
