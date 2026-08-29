import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getShow } from '../api/client'
import type { Episode, Season } from '../api/types'
import { CatalogImage } from '../components/CatalogImage'
import { EpisodeList } from '../components/EpisodeList'
import { ErrorState } from '../components/ErrorState'
import { PlayIcon, SpeakerIcon } from '../components/Icons'
import { Spinner } from '../components/Spinner'
import { TasteButtons } from '../components/TasteButtons'
import { useFetch } from '../hooks/useFetch'
import { watchForEpisode } from '../lib/episodeProgress'
import { stillWatching } from '../lib/homeRows'
import { formatRating, formatRuntime, genresOf } from '../lib/media'
import { useProfiles } from '../profiles/ProfileContext'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTmdbGallery } from '../trailers/useTmdbGallery'
import { useWatch } from '../watch/WatchContext'

export function ShowDetail() {
  const { id = '' } = useParams()
  const { openWatch } = useWatch()
  const { activeProfile } = useProfiles()
  const { data, error, loading, retry } = useFetch(() => getShow(id), id)
  const last = activeProfile?.history.find((entry) => entry.id === id)
  const trailerRef = useRef<TrailerHandle>(null)
  const [muted, setMuted] = useState(true)
  const stills = useTmdbGallery(data)

  const seasons = useMemo(() => data?.seasons ?? [], [data])
  const resumeSeason = useMemo(() => {
    if (!seasons.length) return undefined
    return seasons.find((season) => season.season_number === last?.seasonNumber) ?? seasons[0]
  }, [seasons, last?.seasonNumber])

  if (loading) return <Spinner label="Loading show" />
  if (error) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <ErrorState message="Show not found" onRetry={retry} />

  const show = data
  const rating = formatRating(show.rating)
  const runtime = formatRuntime(show.runtime)
  const genres = genresOf(show)
  const resumeEpisode =
    resumeSeason?.episodes?.find(
      (episode) => episode.id === last?.episodeId || episode.number === last?.episodeNumber,
    ) ?? resumeSeason?.episodes?.[0]
  const watchHref = last?.watch_href || resumeEpisode?.watch_href || show.watch_href

  const onWatchShow = () => {
    if (!watchHref) return
    openWatch(watchHref, show.title, {
      id: show.id,
      kind: 'show',
      title: show.title,
      year: show.year,
      poster_url: show.poster_url ?? null,
      genres,
      watch_href: watchHref,
      runtime: resumeEpisode?.duration ?? show.runtime ?? null,
      seasonNumber: last?.seasonNumber ?? resumeSeason?.season_number,
      episodeNumber: last?.episodeNumber ?? resumeEpisode?.number,
      episodeId: last?.episodeId ?? resumeEpisode?.id,
      progress: last?.progress,
    })
  }

  const onWatchEpisode = (episode: Episode, season: Season) => {
    const watch = watchForEpisode(last, season.season_number, episode)
    openWatch(episode.watch_href, `${show.title} · S${season.season_number}E${episode.number}`, {
      id: show.id,
      kind: 'show',
      title: show.title,
      year: show.year,
      poster_url: show.poster_url ?? null,
      genres,
      watch_href: episode.watch_href,
      runtime: episode.duration ?? show.runtime ?? null,
      seasonNumber: season.season_number,
      episodeNumber: episode.number,
      episodeId: episode.id,
      progress: watch?.progress,
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
          <CatalogImage item={show} alt="" className="detail-hero-img" prefer="backdrop" />
          <TrailerPreview
            ref={trailerRef}
            title={show.title}
            year={show.year}
            kind="show"
            className="hero-trailer"
            muted={muted}
          />
          <div className="detail-hero-body">
            <CatalogImage item={show} alt="" className="detail-poster" />
            <div>
              <h1 className="detail-title">{show.title}</h1>
              <div className="detail-meta">
                {show.year ? <span>{show.year}</span> : null}
                {rating ? <span>★ {rating}</span> : null}
                {show.quality ? <span>{show.quality}</span> : null}
                {runtime ? <span>{runtime}</span> : null}
                {seasons.length ? (
                  <span>
                    {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
                  </span>
                ) : null}
              </div>
              {genres.length ? <div className="detail-genres">{genres.join(' · ')}</div> : null}
              <div className="detail-actions">
                <button type="button" className="btn btn-play" onClick={onWatchShow} disabled={!watchHref}>
                  <PlayIcon className="icon" />
                  {last && stillWatching(last) ? 'Resume' : 'Play'}
                </button>
                <Link className="btn btn-info" to="/browse">
                  Back
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
        </div>
        {show.synopsis ? <p className="detail-synopsis">{show.synopsis}</p> : null}
        {show.cast?.length ? (
          <p className="detail-cast">
            <strong>Cast</strong> {show.cast.join(', ')}
          </p>
        ) : null}
        <EpisodeList seasons={seasons} history={last} stills={stills} onPlay={onWatchEpisode} />
      </section>
    </main>
  )
}
