import type { MovieDetail, MovieListItem, ShowDetail } from '../api/types'
import type { WatchHistoryItem } from '../profiles/types'
import { genresOf, isShow } from './media'

export function buildWatchSession(
  item: MovieListItem,
  detail?: MovieDetail | ShowDetail | null,
  history?: WatchHistoryItem,
  restart = false,
  hrefOverride?: string | null,
): { href: string; payload: Omit<WatchHistoryItem, 'watchedAt'> } | null {
  const seasons = isShow(item) ? ((detail as ShowDetail | null | undefined)?.seasons ?? []) : []
  const resumeSeason =
    seasons.find((season) => season.season_number === history?.seasonNumber) ?? seasons[0]
  const resumeEpisode =
    resumeSeason?.episodes?.find(
      (episode) => episode.id === history?.episodeId || episode.number === history?.episodeNumber,
    ) ?? resumeSeason?.episodes?.[0]
  const href =
    hrefOverride ||
    (isShow(item)
      ? history?.watch_href || resumeEpisode?.watch_href || detail?.watch_href
      : detail?.watch_href || history?.watch_href) ||
    undefined
  if (!href) return null
  const replayMovie = !isShow(item) && (history?.progress ?? 0) >= 0.9
  return {
    href,
    payload: {
      id: item.id,
      kind: item.kind ?? 'movie',
      title: item.title,
      year: item.year,
      poster_url: item.poster_url ?? null,
      genres: genresOf(detail ?? item),
      tmdb_id: item.tmdb_id ?? detail?.tmdb_id,
      watch_href: href,
      runtime: resumeEpisode?.duration ?? detail?.runtime ?? history?.runtime ?? null,
      progress: restart || replayMovie ? 0 : history?.progress,
      seasonNumber: history?.seasonNumber ?? resumeSeason?.season_number,
      episodeNumber: history?.episodeNumber ?? resumeEpisode?.number,
      episodeId: history?.episodeId ?? resumeEpisode?.id,
    },
  }
}
