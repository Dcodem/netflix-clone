import { useState } from 'react'
import type { MovieDetail, MovieListItem } from '../api/types'
import { useFineHover } from '../hooks/useFineHover'
import { isComingSoon } from '../lib/comingSoon'
import { toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { notifyRemind } from './RemindToast'
import {
  BellIcon,
  CaretIcon,
  CheckIcon,
  DoubleThumbUpIcon,
  DownloadIcon,
  PlayIcon,
  PlusIcon,
  RestartIcon,
  ShareIcon,
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
  layout = 'default',
}: {
  item: MovieListItem
  detail?: MovieDetail | null
  watchHref?: string | null
  size?: 'sm' | 'md'
  showMore?: boolean
  continueMode?: boolean
  playStyle?: 'circle' | 'labeled'
  layout?: 'default' | 'sheet'
}) {
  const { openWatch } = useWatch()
  const { openTitle, closeTitle } = useTitleModal()
  const { activeProfile, toggleMyList, toggleDownload, rateTitle } = useProfiles()
  const fineHover = useFineHover()
  const [rateOpen, setRateOpen] = useState(false)
  const likedItem = toLiked(item)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const downloaded = activeProfile?.downloads?.some((entry) => entry.id === item.id) ?? false
  const loved = activeProfile?.lovedIds?.includes(item.id) ?? false
  const liked = (activeProfile?.liked.some((entry) => entry.id === item.id) ?? false) && !loved
  const disliked = activeProfile?.dislikedIds.includes(item.id) ?? false
  const history = activeProfile?.history.find((entry) => entry.id === item.id)
  const session = buildWatchSession(item, detail, history, false, watchHref)
  const href = session?.href
  const sheet = layout === 'sheet'
  const soon = isComingSoon(item)
  const [copied, setCopied] = useState(false)

  function remind() {
    playClick()
    toggleMyList(likedItem)
    notifyRemind(item.title, !onList)
  }

  async function shareTitle() {
    const url = `${window.location.origin}/browse?jbv=${encodeURIComponent(item.id)}`
    playClick()
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url })
        return
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  function play(restart = false) {
    const next = buildWatchSession(item, detail, history, restart, watchHref)
    if (!next) return
    playClick()
    closeTitle()
    openWatch(next.href, item.title, next.payload)
  }

  const rateControl = (
    <div
      className={`thumbs-pop ${rateOpen ? 'is-open' : ''} ${sheet ? 'title-sheet-tool' : ''}`}
      onMouseLeave={() => setRateOpen(false)}
    >
      <button
        type="button"
        className={`${sheet ? 'title-sheet-btn' : 'circle-btn'} thumbs-face ${liked || loved || disliked ? 'is-on' : ''}`}
        onClick={() => {
          if (!fineHover) {
            setRateOpen((value) => !value)
            return
          }
          rateTitle(likedItem, liked || loved ? null : 'up')
        }}
        aria-label={loved ? 'Loved' : liked ? 'Liked' : disliked ? 'Not for me' : 'Rate'}
        aria-expanded={rateOpen}
      >
        {disliked ? (
          <ThumbDownIcon className="icon" />
        ) : loved ? (
          <DoubleThumbUpIcon className="icon" />
        ) : (
          <ThumbUpIcon className="icon" />
        )}
        {sheet ? <span>Rate</span> : null}
      </button>
      <div className="thumbs-menu" role="group" aria-label="Rate title">
        <button
          type="button"
          className={`circle-btn ${disliked ? 'is-on' : ''}`}
          onClick={() => {
            rateTitle(likedItem, disliked ? null : 'down')
            setRateOpen(false)
          }}
          aria-label="Not for me"
        >
          <ThumbDownIcon className="icon" />
        </button>
        <button
          type="button"
          className={`circle-btn ${liked ? 'is-on' : ''}`}
          onClick={() => {
            rateTitle(likedItem, liked ? null : 'up')
            setRateOpen(false)
          }}
          aria-label="Like"
        >
          <ThumbUpIcon className="icon" />
        </button>
        <button
          type="button"
          className={`circle-btn ${loved ? 'is-on' : ''}`}
          onClick={() => {
            rateTitle(likedItem, loved ? null : 'love')
            setRateOpen(false)
          }}
          aria-label="Love"
        >
          <DoubleThumbUpIcon className="icon" />
        </button>
      </div>
    </div>
  )

  return (
    <div className={`title-actions size-${size} play-${playStyle} ${sheet ? 'is-sheet' : ''}`}>
      {soon ? (
        playStyle === 'labeled' ? (
          <button
            type="button"
            className={`btn ${onList ? 'btn-reminded' : 'btn-play'}`}
            onClick={remind}
            aria-pressed={onList}
          >
            {onList ? <CheckIcon className="icon" /> : <BellIcon className="icon" />}
            {onList ? 'Reminded' : 'Remind Me'}
          </button>
        ) : (
          <button
            type="button"
            className={`circle-btn ${onList ? 'is-on' : ''}`}
            onClick={remind}
            aria-label={onList ? 'Reminded' : 'Remind Me'}
            aria-pressed={onList}
          >
            {onList ? <CheckIcon className="icon" /> : <BellIcon className="icon" />}
          </button>
        )
      ) : playStyle === 'labeled' ? (
        <button type="button" className="btn btn-play" onClick={() => play(false)} disabled={!href}>
          <PlayIcon className="icon" />
          Play
        </button>
      ) : (
        <button
          type="button"
          className="circle-btn circle-play"
          onClick={() => play(false)}
          disabled={!href}
          aria-label="Play"
        >
          <PlayIcon className="icon" />
        </button>
      )}
      {sheet && !soon ? (
        <button
          type="button"
          className={`btn btn-download ${downloaded ? 'is-on' : ''}`}
          onClick={() => {
            playClick()
            toggleDownload(likedItem)
          }}
        >
          {downloaded ? <CheckIcon className="icon" /> : <DownloadIcon className="icon" />}
          {downloaded ? 'Downloaded' : 'Download'}
        </button>
      ) : null}
      {continueMode && !sheet && !soon && playStyle !== 'labeled' ? (
        <button type="button" className="circle-btn" onClick={() => play(true)} disabled={!href} aria-label="Play from beginning">
          <RestartIcon className="icon" />
        </button>
      ) : null}
      {sheet ? (
        <div className="title-sheet-tools">
          {soon ? null : (
          <button
            type="button"
            className={`title-sheet-btn ${onList ? 'is-on' : ''}`}
            onClick={() => toggleMyList(likedItem)}
          >
            {onList ? <CheckIcon className="icon" /> : <PlusIcon className="icon" />}
            <span>My List</span>
          </button>
          )}
          {rateControl}
          <button type="button" className={`title-sheet-btn ${copied ? 'is-on' : ''}`} onClick={() => void shareTitle()}>
            <ShareIcon className="icon" />
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      ) : soon ? null : (
        <button
          type="button"
          className={`circle-btn ${onList ? 'is-on' : ''}`}
          onClick={() => toggleMyList(likedItem)}
          aria-label={onList ? 'Remove from My List' : 'Add to My List'}
        >
          {onList ? <CheckIcon className="icon" /> : <PlusIcon className="icon" />}
        </button>
      )}
      {sheet ? null : size === 'sm' ? (
        rateControl
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
      {!sheet && showMore ? (
        <button type="button" className="circle-btn circle-more" onClick={(event) => openTitle(item, event.currentTarget)} aria-label="More info">
          <CaretIcon className="icon" />
        </button>
      ) : null}
    </div>
  )
}
