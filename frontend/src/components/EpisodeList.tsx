import { useEffect, useState, type CSSProperties } from 'react'
import type { Episode, Season } from '../api/types'
import { isEpisodeStarted, isEpisodeWatched, seasonStats, watchForEpisode } from '../lib/episodeProgress'
import type { WatchHistoryItem } from '../profiles/types'
import { stillFocus } from '../lib/media'
import { PlayIcon } from './Icons'
import { MediaImage } from './MediaImage'

export function EpisodeList({
  seasons,
  history,
  onPlay,
}: {
  seasons: Season[]
  history?: WatchHistoryItem
  onPlay: (episode: Episode, season: Season) => void
}) {
  const [seasonNumber, setSeasonNumber] = useState(history?.seasonNumber ?? seasons[0]?.season_number ?? 1)

  useEffect(() => {
    if (history?.seasonNumber) setSeasonNumber(history.seasonNumber)
  }, [history?.seasonNumber, history?.episodeId])

  if (!seasons.length) return null

  const activeSeason = seasons.find((season) => season.season_number === seasonNumber) ?? seasons[0]

  return (
    <section className="episode-panel">
      <div className="episode-header">
        <h2 className="episode-heading">Episodes</h2>
        {seasons.length > 1 ? (
          <label className="season-select-wrap">
            <span className="visually-hidden">Season</span>
            <select
              className="season-select"
              value={activeSeason.season_number}
              onChange={(event) => setSeasonNumber(Number(event.target.value))}
            >
              {seasons.map((season) => {
                const stats = seasonStats(history, season)
                const watched =
                  stats.started > 0 ? ` · ${stats.started} of ${stats.total} watched` : ` · ${stats.total} episodes`
                return (
                  <option key={season.season_number} value={season.season_number}>
                    Season {season.season_number}
                    {watched}
                  </option>
                )
              })}
            </select>
          </label>
        ) : (
          <span className="season-count">{activeSeason.episodes?.length ?? 0} Episodes</span>
        )}
      </div>
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
                className={`episode episode-btn ${isResume ? 'is-resume' : ''} ${started ? 'has-progress' : ''} ${done ? 'is-watched' : ''}`}
                onClick={() => onPlay(episode, activeSeason)}
              >
                <span className="ep-num">{episode.number}</span>
                <div className="ep-thumb-wrap" style={{ '--focal': stillFocus(episode.number) } as CSSProperties}>
                  <MediaImage src={episode.thumb_url} alt="" className="ep-thumb" />
                  <span className="ep-play">
                    <PlayIcon className="icon" />
                  </span>
                  {started ? (
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
