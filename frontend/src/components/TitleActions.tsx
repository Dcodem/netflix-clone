import type { MovieDetail, MovieListItem } from '../api/types'
import { genresOf } from '../lib/media'
import { toLiked } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import {
  CaretIcon,
  CheckIcon,
  CloseIcon,
  PlayIcon,
  PlusIcon,
  RestartIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from './Icons'

export function TitleActions({
  item,
  detail,
  watchHref,
  size = 'md',
  showMore = true,
  continueMode = false,
}: {
  item: MovieListItem
  detail?: MovieDetail | null
  watchHref?: string | null
  size?: 'sm' | 'md'
  showMore?: boolean
  continueMode?: boolean
}) {
  const { openWatch } = useWatch()
  const { openTitle, closeTitle } = useTitleModal()
  const { activeProfile, toggleMyList, rateTitle, hideContinue } = useProfiles()
  const likedItem = toLiked(item)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const liked = activeProfile?.liked.some((entry) => entry.id === item.id) ?? false
  const disliked = activeProfile?.dislikedIds.includes(item.id) ?? false
  const history = activeProfile?.history.find((entry) => entry.id === item.id)
  const href = watchHref || history?.watch_href || detail?.watch_href
  const genres = genresOf(detail ?? item)

  function play(restart = false) {
    if (!href) return
    closeTitle()
    openWatch(href, item.title, {
      id: item.id,
      kind: item.kind ?? 'movie',
      title: item.title,
      poster_url: item.poster_url ?? null,
      genres,
      watch_href: href,
      runtime: detail?.runtime ?? history?.runtime ?? null,
      progress: restart ? 0 : history?.progress,
      seasonNumber: history?.seasonNumber,
      episodeNumber: history?.episodeNumber,
      episodeId: history?.episodeId,
    })
  }

  return (
    <div className={`title-actions size-${size}`}>
      <button
        type="button"
        className="circle-btn circle-play"
        onClick={() => play(false)}
        disabled={!href}
        aria-label={continueMode ? 'Resume' : 'Play'}
      >
        <PlayIcon className="icon" />
      </button>
      {continueMode ? (
        <button type="button" className="circle-btn" onClick={() => play(true)} disabled={!href} aria-label="Play from beginning">
          <RestartIcon className="icon" />
        </button>
      ) : null}
      <button
        type="button"
        className={`circle-btn ${onList ? 'is-on' : ''}`}
        onClick={() => toggleMyList(likedItem)}
        aria-label={onList ? 'Remove from My List' : 'Add to My List'}
      >
        {onList ? <CheckIcon className="icon" /> : <PlusIcon className="icon" />}
      </button>
      <button
        type="button"
        className={`circle-btn ${liked ? 'is-on' : ''}`}
        onClick={() => rateTitle(likedItem, liked ? null : 'up')}
        aria-label="Like"
      >
        <ThumbUpIcon className="icon" />
      </button>
      <button
        type="button"
        className={`circle-btn ${disliked ? 'is-on' : ''}`}
        onClick={() => rateTitle(likedItem, disliked ? null : 'down')}
        aria-label="Not for me"
      >
        <ThumbDownIcon className="icon" />
      </button>
      {continueMode ? (
        <button
          type="button"
          className="circle-btn"
          onClick={() => hideContinue(item.id)}
          aria-label="Remove from Continue Watching"
        >
          <CloseIcon className="icon" />
        </button>
      ) : null}
      {showMore ? (
        <button type="button" className="circle-btn circle-more" onClick={() => openTitle(item)} aria-label="More info">
          <CaretIcon className="icon" />
        </button>
      ) : null}
    </div>
  )
}
