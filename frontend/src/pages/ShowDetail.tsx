import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getShow } from '../api/client'
import type { Episode, Season } from '../api/types'
import { ErrorState } from '../components/ErrorState'
import { MediaImage } from '../components/MediaImage'
import { Spinner } from '../components/Spinner'
import { TasteButtons } from '../components/TasteButtons'
import { useFetch } from '../hooks/useFetch'
import { formatRating, formatRuntime, genresOf } from '../lib/media'
import { TrailerPreview } from '../trailers/TrailerPreview'
import { useWatch } from '../watch/WatchContext'

export function ShowDetail() {
  const { id = '' } = useParams()
  const { openWatch } = useWatch()
  const { data, error, loading, retry } = useFetch(() => getShow(id), id)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)

  const seasons = useMemo(() => data?.seasons ?? [], [data])
  const activeSeason: Season | undefined = useMemo(() => {
    if (!seasons.length) return undefined
    return seasons.find((season) => season.season_number === seasonNumber) ?? seasons[0]
  }, [seasons, seasonNumber])

  if (loading) return <Spinner label="Loading show" />
  if (error) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <ErrorState message="Show not found" onRetry={retry} />

  const show = data
  const rating = formatRating(show.rating)
  const runtime = formatRuntime(show.runtime)
  const genres = genresOf(show)
  const firstEpisode = activeSeason?.episodes?.[0]
  const watchHref = firstEpisode?.watch_href || show.watch_href

  const onWatchShow = () => {
    if (!watchHref) return
    openWatch(watchHref, show.title, {
      id: show.id,
      kind: 'show',
      title: show.title,
      poster_url: show.poster_url ?? null,
      genres,
      watch_href: watchHref,
    })
  }

  const onWatchEpisode = (episode: Episode, season: Season) => {
    openWatch(episode.watch_href, `${show.title} · S${season.season_number}E${episode.number}`, {
      id: show.id,
      kind: 'show',
      title: show.title,
      poster_url: show.poster_url ?? null,
      genres,
      watch_href: episode.watch_href,
    })
  }

  return (
    <main className="page">
      <section className="detail">
        <div className="detail-hero">
          <MediaImage src={show.backdrop_url || show.poster_url} alt="" className="detail-hero-img" />
          <TrailerPreview title={show.title} year={show.year} kind="show" className="hero-trailer" />
          <div className="detail-hero-body">
            {show.poster_url ? (
              <MediaImage src={show.poster_url} alt="" className="detail-poster" />
            ) : null}
            <div>
              <h1 className="detail-title">{show.title}</h1>
              <div className="detail-meta">
                {show.year ? <span>{show.year}</span> : null}
                {rating ? <span>★ {rating}</span> : null}
                {show.quality ? <span>{show.quality}</span> : null}
                {runtime ? <span>{runtime}</span> : null}
              </div>
              {genres.length ? <div className="detail-genres">{genres.join(' · ')}</div> : null}
              <div className="detail-actions">
                <button type="button" className="btn btn-primary" onClick={onWatchShow} disabled={!watchHref}>
                  ▶ Watch
                </button>
                <Link className="btn btn-ghost" to="/browse">
                  ← Back
                </Link>
                <TasteButtons
                  item={{
                    id: show.id,
                    kind: 'show',
                    title: show.title,
                    poster_url: show.poster_url ?? null,
                    genres,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {show.synopsis ? <p className="detail-synopsis">{show.synopsis}</p> : null}
        {show.cast?.length ? (
          <p className="detail-cast">
            <strong>Cast</strong> {show.cast.join(', ')}
          </p>
        ) : null}
        {seasons.length ? (
          <div className="season-tabs">
            {seasons.map((season) => (
              <button
                key={season.season_number}
                type="button"
                className={`season-tab ${activeSeason?.season_number === season.season_number ? 'active' : ''}`}
                onClick={() => setSeasonNumber(season.season_number)}
              >
                Season {season.season_number}
              </button>
            ))}
          </div>
        ) : null}
        {activeSeason?.episodes?.length ? (
          <div className="episodes">
            {activeSeason.episodes.map((episode) => (
              <div key={episode.id} className="episode">
                <MediaImage src={episode.thumb_url} alt="" className="ep-thumb" />
                <div className="ep-info">
                  <div className="ep-label">
                    S{activeSeason.season_number} · E{episode.number}
                  </div>
                  <div className="ep-title">{episode.title}</div>
                  {episode.duration ? <div className="ep-meta">{episode.duration} min</div> : null}
                  {episode.synopsis ? <p className="ep-syn">{episode.synopsis}</p> : null}
                </div>
                <button
                  type="button"
                  className="btn btn-primary ep-watch"
                  onClick={() => onWatchEpisode(episode, activeSeason)}
                >
                  Watch
                </button>
              </div>
            ))}
          </div>
        ) : seasons.length ? (
          <p className="state">No episodes available.</p>
        ) : null}
      </section>
    </main>
  )
}
