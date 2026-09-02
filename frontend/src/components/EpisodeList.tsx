import { useEffect, useState, type CSSProperties } from 'react'
import type { Episode, Season } from '../api/types'
import { isEpisodeStarted, isEpisodeWatched, watchForEpisode } from '../lib/episodeProgress'
import type { WatchHistoryItem } from '../profiles/types'
import { episodeStill, stillFocus } from '../lib/media'
import { CheckIcon, PlayIcon } from './Icons'
import { MediaImage } from './MediaImage'
import { SeasonMenu } from './SeasonMenu'

export function SeasonPicker({
  seasons,
  history,
  value,
  onChange,
}: {
  seasons: Season[]
  history?: WatchHistoryItem
  value: number
  onChange: (seasonNumber: number) => void
}) {
  return (
    <SeasonMenu
      seasons={seasons}
      history={history}
      value={value}
      onChange={onChange}
      className="title-tabs-season"
    />
  )
}

export function EpisodeList({
  seasons,
  history,
  stills,
  onPlay,
  seasonNumber,
  onSeasonNumber,
  hideHeader = false,
}: {
  seasons: Season[]
  history?: WatchHistoryItem
  stills?: string[]
  onPlay: (episode: Episode, season: Season) => void
  seasonNumber?: number
  onSeasonNumber?: (seasonNumber: number) => void
  hideHeader?: boolean
}) {
  const [internalSeason, setInternalSeason] = useState(history?.seasonNumber ?? seasons[0]?.season_number ?? 1)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const activeNumber = seasonNumber ?? internalSeason

  useEffect(() => {
    if (seasonNumber !== undefined) return
    if (history?.seasonNumber) setInternalSeason(history.seasonNumber)
  }, [history?.seasonNumber, history?.episodeId, seasonNumber])

  if (!seasons.length) return null

  const activeSeason = seasons.find((season) => season.season_number === activeNumber) ?? seasons[0]

  function setSeason(next: number) {
    setInternalSeason(next)
    onSeasonNumber?.(next)
  }

  return (
    <section className="episode-panel">
      {!hideHeader ? (
        <div className="episode-header">
          <h2 className="episode-heading">Episodes</h2>
          <SeasonPicker seasons={seasons} history={history} value={activeSeason.season_number} onChange={setSeason} />
        </div>
      ) : null}
      {activeSeason?.episodes?.length ? (
        <div className="episodes">
          {activeSeason.episodes.map((episode) => {
            const watch = watchForEpisode(history, activeSeason.season_number, episode)
            const progress = watch?.progress ?? 0
            const started = isEpisodeStarted(progress)
            const done = isEpisodeWatched(progress)
            const isResume = history?.episodeId === episode.id
            return (
              <button
                type="button"
                key={episode.id}
                className={`episode episode-btn ${isResume ? 'is-resume' : ''} ${started ? 'has-progress' : ''} ${done ? 'is-watched' : ''} ${hoverId === episode.id ? 'is-hover' : ''}`}
                onMouseEnter={() => setHoverId(episode.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onPlay(episode, activeSeason)}
              >
                <span className="ep-num">{episode.number}</span>
                <div className="ep-thumb-wrap" style={{ '--focal': stillFocus(episode.number) } as CSSProperties}>
                  <MediaImage src={episodeStill(stills, episode.number, episode.thumb_url)} alt="" className="ep-thumb" />
                  {done ? (
                    <span className="ep-watched-mark" aria-hidden="true">
                      <CheckIcon className="icon" />
                    </span>
                  ) : null}
                  <span className="ep-play">
                    <PlayIcon className="icon" />
                  </span>
                  {started && !done ? (
                    <div className="progress-track ep-progress">
                      <div style={{ width: `${Math.round(Math.min(1, progress) * 100)}%` }} />
                    </div>
                  ) : null}
                </div>
                <div className="ep-info">
                  <div className="ep-title-row">
                    <div className="ep-title">{episode.title}</div>
                    {episode.duration ? <div className="ep-meta">{episode.duration}m</div> : null}
                  </div>
                  {episode.synopsis ? <p className="ep-syn">{episode.synopsis}</p> : null}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="state">No episodes available.</p>
      )}
    </section>
  )
}
