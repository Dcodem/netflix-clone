import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { useHoverMenu } from '../hooks/useHoverMenu'
import { catalogNotices, filterByMaturity } from '../lib/netflix'
import { uniqueById } from '../lib/media'
import { useFetch } from '../hooks/useFetch'
import { useTitleModal } from '../title/TitleModalContext'
import { useProfiles } from '../profiles/ProfileContext'
import { CatalogImage } from './CatalogImage'
import { BellIcon } from './Icons'

export function NotificationsMenu() {
  const { openTitle } = useTitleModal()
  const { activeProfile } = useProfiles()
  const { open, setOpen, rootRef, onEnter, onLeave, toggle } = useHoverMenu()
  const movies = useFetch(() => getMovies(), 'home-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...catalogMovies, ...catalogShows])
  }, 'notify-catalog')
  const catalog = uniqueById([...(movies.data ?? []), ...(extras.data ?? [])])
  const notices = catalogNotices(filterByMaturity(catalog, activeProfile), activeProfile, 8)
  const unread = notices.some((notice) => notice.unread)

  return (
    <div
      className={`notify-menu ${open ? 'is-open' : ''}`}
      ref={rootRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        className="notify-toggle"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={toggle}
      >
        <BellIcon className="icon" />
        {unread ? <span className="notify-dot" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <div className="notify-dropdown" role="menu">
          {notices.length ? (
            <div className="notify-list">
              {notices.map(({ item, kicker, stamp, unread: isUnread }) => (
                <button
                  type="button"
                  key={item.id}
                  className={`notify-row ${isUnread ? 'is-unread' : ''}`}
                  onClick={() => {
                    setOpen(false)
                    openTitle(item)
                  }}
                >
                  <CatalogImage item={item} prefer="backdrop" alt="" />
                  <span>
                    <strong>{kicker}</strong>
                    <em>{item.title}</em>
                    <small>{stamp}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p>No recent notifications.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
