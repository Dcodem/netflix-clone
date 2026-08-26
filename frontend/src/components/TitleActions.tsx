import type { MovieDetail, MovieListItem } from '../api/types'
import { genresOf } from '../lib/media'
import { toLiked } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'

export function TitleActions({
  item,
  detail,
  watchHref,
  size = 'md',
  showMore = true,
}: {
  item: MovieListItem
  detail?: MovieDetail | null
  watchHref?: string | null
  size?: 'sm' | 'md'
  showMore?: boolean
}) {
  const { openWatch } = useWatch()
  const { openTitle, closeTitle } = useTitleModal()
  const { activeProfile, toggleMyList, rateTitle } = useProfiles()
  const likedItem = toLiked(item)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const liked = activeProfile?.liked.some((entry) => entry.id === item.id) ?? false
  const disliked = activeProfile?.dislikedIds.includes(item.id) ?? false
  const href = watchHref || detail?.watch_href
  const genres = genresOf(detail ?? item)

  function play() {
    if (!href) return
    closeTitle()
    openWatch(href, item.title, {
      id: item.id,
      kind: item.kind ?? 'movie',
      title: item.title,
      poster_url: item.poster_url ?? null,
      genres,
      watch_href: href,
      runtime: detail?.runtime ?? null,
    })
  }

  return (
    <div className={`title-actions size-${size}`}>
      <button type="button" className="circle-btn circle-play" onClick={play} disabled={!href} aria-label="Play">
        ▶
      </button>
      <button
        type="button"
        className={`circle-btn ${onList ? 'is-on' : ''}`}
        onClick={() => toggleMyList(likedItem)}
        aria-label={onList ? 'Remove from My List' : 'Add to My List'}
      >
        {onList ? '✓' : '+'}
      </button>
      <button
        type="button"
        className={`circle-btn ${liked ? 'is-on' : ''}`}
        onClick={() => rateTitle(likedItem, liked ? null : 'up')}
        aria-label="Like"
      >
        👍
      </button>
      <button
        type="button"
        className={`circle-btn ${disliked ? 'is-on' : ''}`}
        onClick={() => rateTitle(likedItem, disliked ? null : 'down')}
        aria-label="Not for me"
      >
        👎
      </button>
      {showMore ? (
        <button type="button" className="circle-btn circle-more" onClick={() => openTitle(item)} aria-label="More info">
          ▾
        </button>
      ) : null}
    </div>
  )
}
