import { useState } from 'react'
import { getMovie, getShow } from '../api/client'
import type { MovieListItem } from '../api/types'
import { isComingSoon } from '../lib/comingSoon'
import { isShow } from '../lib/media'
import { maturityLabel, toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { notifyRemind } from './RemindToast'
import { CatalogImage } from './CatalogImage'
import { BellIcon, CheckIcon, PlayIcon } from './Icons'

export function SearchHitsList({
  items,
  ranked = false,
}: {
  items: MovieListItem[]
  ranked?: boolean
}) {
  const { openTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const { activeProfile, toggleMyList } = useProfiles()
  const [playingId, setPlayingId] = useState<string | null>(null)

  function remindNow(item: MovieListItem) {
    const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
    playClick()
    toggleMyList(toLiked(item))
    notifyRemind(item.title, !onList)
  }

  async function playNow(item: MovieListItem) {
    if (playingId) return
    playClick()
    setPlayingId(item.id)
    try {
      const detail = isShow(item) ? await getShow(item.id) : await getMovie(item.id)
      const history = activeProfile?.history.find((entry) => entry.id === item.id)
      const session = buildWatchSession(item, detail, history)
      if (session) {
        openWatch(session.href, item.title, session.payload)
        return
      }
    } catch {
      /* fall through to the title preview */
    } finally {
      setPlayingId(null)
    }
    openTitle(item)
  }

  return (
    <ul className={`search-top ${ranked ? 'is-ranked' : ''}`}>
      {items.map((item, index) => (
        <li key={item.id}>
          <button type="button" className="search-top-hit" onClick={(event) => openTitle(item, event.currentTarget)} aria-label={item.title}>
            {ranked ? <span className="search-top-rank">{index + 1}</span> : null}
            <span className="search-top-still">
              <CatalogImage item={item} alt="" prefer="backdrop" />
            </span>
            <span className="search-top-copy">
              <span className="search-top-title">{item.title}</span>
              <span className="search-top-meta">
                {item.year ? <span>{item.year}</span> : null}
                <span>{maturityLabel(item)}</span>
                <span>{isShow(item) ? 'TV Show' : 'Movie'}</span>
              </span>
            </span>
          </button>
          {ranked ? null : (isComingSoon(item) && item.playable !== true) ? (
            <button
              type="button"
              className="search-top-play"
              aria-label={
                activeProfile?.myList.some((entry) => entry.id === item.id)
                  ? `Reminded for ${item.title}`
                  : `Remind Me for ${item.title}`
              }
              onClick={() => remindNow(item)}
            >
              {activeProfile?.myList.some((entry) => entry.id === item.id) ? (
                <CheckIcon className="icon" />
              ) : (
                <BellIcon className="icon" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="search-top-play"
              aria-label={`Play ${item.title}`}
              disabled={playingId === item.id}
              onClick={() => void playNow(item)}
            >
              <PlayIcon className="icon" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
