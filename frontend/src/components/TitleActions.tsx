import type { MovieDetail, MovieListItem } from '../api/types'
import { toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import {
  CaretIcon,
  CheckIcon,
  CloseIcon,
  DoubleThumbUpIcon,
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
  playStyle = 'circle',
}: {
  item: MovieListItem
  detail?: MovieDetail | null
  watchHref?: string | null
  size?: 'sm' | 'md'
  showMore?: boolean
  continueMode?: boolean
  playStyle?: 'circle' | 'labeled'
}) {
  const { openWatch } = useWatch()
  const { openTitle, closeTitle } = useTitleModal()
  const { activeProfile, toggleMyList, rateTitle, hideContinue } = useProfiles()
  const likedItem = toLiked(item)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const loved = activeProfile?.lovedIds?.includes(item.id) ?? false
  const liked = (activeProfile?.liked.some((entry) => entry.id === item.id) ?? false) && !loved
  const disliked = activeProfile?.dislikedIds.includes(item.id) ?? false
  const history = activeProfile?.history.find((entry) => entry.id === item.id)
  const session = buildWatchSession(item, detail, history, false, watchHref)
  const href = session?.href

  function play(restart = false) {
    const next = buildWatchSession(item, detail, history, restart, watchHref)
    if (!next) return
    playClick()
    closeTitle()
    openWatch(next.href, item.title, next.payload)
  }

  return (
    <div className={`title-actions size-${size} play-${playStyle}`}>
      {playStyle === 'labeled' ? (
        <button type="button" className="btn btn-play" onClick={() => play(false)} disabled={!href}>
          <PlayIcon className="icon" />
          {continueMode ? 'Resume' : 'Play'}
        </button>
      ) : (
        <button
          type="button"
          className="circle-btn circle-play"
          onClick={() => play(false)}
          disabled={!href}
          aria-label={continueMode ? 'Resume' : 'Play'}
        >
          <PlayIcon className="icon" />
        </button>
      )}
      {continueMode && playStyle !== 'labeled' ? (
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
      {size === 'sm' ? (
        <div className="thumbs-pop">
          <button
            type="button"
            className={`circle-btn thumbs-face ${liked || loved || disliked ? 'is-on' : ''}`}
            onClick={() => rateTitle(likedItem, liked || loved ? null : 'up')}
            aria-label={loved ? 'Loved' : liked ? 'Liked' : disliked ? 'Not for me' : 'Rate'}
          >
            {disliked ? (
              <ThumbDownIcon className="icon" />
            ) : loved ? (
              <DoubleThumbUpIcon className="icon" />
            ) : (
              <ThumbUpIcon className="icon" />
            )}
          </button>
          <div className="thumbs-menu" role="group" aria-label="Rate title">
            <button
              type="button"
              className={`circle-btn ${disliked ? 'is-on' : ''}`}
              onClick={() => rateTitle(likedItem, disliked ? null : 'down')}
              aria-label="Not for me"
            >
              <ThumbDownIcon className="icon" />
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
              className={`circle-btn ${loved ? 'is-on' : ''}`}
              onClick={() => rateTitle(likedItem, loved ? null : 'love')}
              aria-label="Love"
            >
              <DoubleThumbUpIcon className="icon" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={`circle-btn ${disliked ? 'is-on' : ''}`}
            onClick={() => rateTitle(likedItem, disliked ? null : 'down')}
            aria-label="Not for me"
          >
            <ThumbDownIcon className="icon" />
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
            className={`circle-btn ${loved ? 'is-on' : ''}`}
            onClick={() => rateTitle(likedItem, loved ? null : 'love')}
            aria-label="Love"
          >
            <DoubleThumbUpIcon className="icon" />
          </button>
        </>
      )}
      {continueMode && playStyle !== 'labeled' ? (
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
