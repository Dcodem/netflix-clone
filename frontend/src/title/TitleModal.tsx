import { useEffect, useMemo, useState } from 'react'
import { getCatalogMany, getMovie, getShow } from '../api/client'
import type { Episode, MovieDetail, MovieListItem, Season, ShowDetail } from '../api/types'
import { ErrorState } from '../components/ErrorState'
import { CatalogImage } from '../components/CatalogImage'
import { MediaImage } from '../components/MediaImage'
import { MediaRow } from '../components/MediaRow'
import { Spinner } from '../components/Spinner'
import { TitleActions } from '../components/TitleActions'
import { useFetch } from '../hooks/useFetch'
import { formatRuntime, genresOf, isShow, uniqueById } from '../lib/media'
import { filterForProfile, isKidsSafe, matchPercent, maturityLabel } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { rankByTaste, similarByGenres } from '../profiles/taste'
import { TrailerPreview } from '../trailers/TrailerPreview'
import { useTitleModal } from './TitleModalContext'
import { useWatch } from '../watch/WatchContext'

function isShowDetail(detail: MovieDetail): detail is ShowDetail {
  return isShow(detail)
}

export function TitleModal() {
  const { item, closeTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const { activeProfile } = useProfiles()
  const last = activeProfile?.history.find((entry) => entry.id === item?.id)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)

  useEffect(() => {
    setSeasonNumber(last?.seasonNumber ?? null)
  }, [item?.id, last?.seasonNumber])

  useEffect(() => {
    if (!item) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTitle()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [item, closeTitle])

  const detailFetch = useFetch(
    () => (item ? (isShow(item) ? getShow(item.id) : getMovie(item.id)) : Promise.resolve(null)),
    item ? `modal-${item.id}` : 'modal-none',
    { enabled: Boolean(item) },
  )
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies', 3).catch(() => [] as MovieListItem[]),
      getCatalogMany('shows', 3).catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'modal-similar', { enabled: Boolean(item) })

  const similar = useMemo(() => {
    if (!item || !catalog.data) return []
    const pool = filterForProfile(catalog.data, activeProfile)
    const byGenre = similarByGenres(item, pool, 12)
    if (byGenre.length >= 12) return byGenre
    const seen = new Set([item.id, ...byGenre.map((entry) => entry.id)])
    const rest = activeProfile
      ? rankByTaste(
          pool.filter((entry) => !seen.has(entry.id)),
          activeProfile,
        )
      : pool.filter((entry) => !seen.has(entry.id))
    return uniqueById([...byGenre, ...rest]).slice(0, 12)
  }, [item, catalog.data, activeProfile])

  useEffect(() => {
    if (item && activeProfile?.kids && !isKidsSafe(item)) closeTitle()
  }, [item, activeProfile?.kids, closeTitle])

  if (!item) return null

  const detail = detailFetch.data
  const seasons = detail && isShowDetail(detail) ? (detail.seasons ?? []) : []
  const activeSeason: Season | undefined =
    seasons.find((season) => season.season_number === seasonNumber) ?? seasons[0]
  const match = matchPercent(item, activeProfile)
  const maturity = maturityLabel(item)
  const genres = genresOf(detail ?? item)
  const runtime = formatRuntime(detail?.runtime)
  const resumeEpisode = activeSeason?.episodes?.find(
    (episode) => episode.id === last?.episodeId || episode.number === last?.episodeNumber,
  )
  const watchHref = isShow(item)
    ? last?.watch_href || resumeEpisode?.watch_href || activeSeason?.episodes?.[0]?.watch_href || detail?.watch_href
    : detail?.watch_href
  const continueMode = Boolean(last?.progress && last.progress > 0.05)

  function playEpisode(episode: Episode, season: Season) {
    if (!detail) return
    closeTitle()
    openWatch(episode.watch_href, `${detail.title} · S${season.season_number}E${episode.number}`, {
      id: detail.id,
      kind: 'show',
      title: detail.title,
      poster_url: detail.poster_url ?? null,
      genres,
      watch_href: episode.watch_href,
      runtime: episode.duration ?? detail.runtime ?? null,
      seasonNumber: season.season_number,
      episodeNumber: episode.number,
      episodeId: episode.id,
    })
  }

  return (
    <div className="title-modal-backdrop" onClick={closeTitle} role="presentation">
      <div
        className="title-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="title-modal-close" onClick={closeTitle} aria-label="Close">
          ×
        </button>
        <div className="title-modal-hero">
          <CatalogImage item={{ ...item, backdrop_url: detail?.backdrop_url }} alt="" prefer="backdrop" />
          <TrailerPreview title={item.title} year={item.year} kind={item.kind} className="title-modal-trailer" />
          <div className="title-modal-hero-body">
            <h1>{item.title}</h1>
            <TitleActions item={item} detail={detail} watchHref={watchHref} showMore={false} continueMode={continueMode} />
          </div>
        </div>
        <div className="title-modal-main">
          {detailFetch.loading && !detail ? <Spinner label="Loading" /> : null}
          {detailFetch.error ? <ErrorState message={detailFetch.error} onRetry={detailFetch.retry} /> : null}
          <div className="jawbone-meta">
            <span className="match">{match}% Match</span>
            {item.year ? <span>{item.year}</span> : null}
            <span className="maturity">{maturity}</span>
            {runtime ? <span>{runtime}</span> : null}
            {isShow(item) && seasons.length ? <span>{seasons.length} Seasons</span> : null}
            {item.quality ? <span>{item.quality}</span> : null}
          </div>
          {genres.length ? <div className="jawbone-genres">{genres.join(' · ')}</div> : null}
          {detail?.synopsis ? <p className="title-modal-syn">{detail.synopsis}</p> : null}
          {detail?.cast?.length ? (
            <p className="title-modal-cast">
              <span>Cast</span> {detail.cast.join(', ')}
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
            <div className="episodes modal-episodes">
              {activeSeason.episodes.map((episode) => (
                <button
                  type="button"
                  key={episode.id}
                  className={`episode episode-btn ${resumeEpisode?.id === episode.id ? 'is-resume' : ''}`}
                  onClick={() => playEpisode(episode, activeSeason)}
                >
                  <MediaImage src={episode.thumb_url} alt="" className="ep-thumb" />
                  <div className="ep-info">
                    <div className="ep-label">
                      E{episode.number} {episode.title}
                    </div>
                    {episode.duration ? <div className="ep-meta">{episode.duration} min</div> : null}
                    {episode.synopsis ? <p className="ep-syn">{episode.synopsis}</p> : null}
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {similar.length ? (
            <div className="more-like">
              <MediaRow title="More like this" items={similar.slice(0, 10)} hoverable={false} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
