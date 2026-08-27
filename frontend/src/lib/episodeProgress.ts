import type { Episode, Season } from '../api/types'
import type { EpisodeWatch, WatchHistoryItem } from '../profiles/types'

export function episodeKey(seasonNumber: number, episode: Pick<Episode, 'id' | 'number'>): string {
  return episode.id || `s${seasonNumber}e${episode.number}`
}

export function watchForEpisode(
  history: WatchHistoryItem | undefined,
  seasonNumber: number,
  episode: Pick<Episode, 'id' | 'number'>,
): EpisodeWatch | undefined {
  if (!history) return undefined
  const key = episodeKey(seasonNumber, episode)
  const mapped = history.episodeProgress?.[key]
  if (mapped) return mapped
  if (
    history.episodeId === episode.id ||
    (history.seasonNumber === seasonNumber && history.episodeNumber === episode.number)
  ) {
    return {
      progress: history.progress ?? 0,
      seasonNumber,
      episodeNumber: episode.number,
      watchedAt: history.watchedAt,
    }
  }
  return undefined
}

export function seasonStats(
  history: WatchHistoryItem | undefined,
  season: Season,
): { started: number; completed: number; total: number } {
  const episodes = season.episodes ?? []
  let started = 0
  let completed = 0
  for (const episode of episodes) {
    const watch = watchForEpisode(history, season.season_number, episode)
    if (!watch || watch.progress < 0.05) continue
    started += 1
    if (watch.progress >= 0.9) completed += 1
  }
  return { started, completed, total: episodes.length }
}

export function isEpisodeStarted(progress?: number): boolean {
  return (progress ?? 0) >= 0.05
}

export function isEpisodeWatched(progress?: number): boolean {
  return (progress ?? 0) >= 0.9
}
