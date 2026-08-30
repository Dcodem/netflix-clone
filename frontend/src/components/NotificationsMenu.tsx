import { getMovies } from '../api/client'
import { useHoverMenu } from '../hooks/useHoverMenu'
import { catalogNotices, filterByMaturity } from '../lib/netflix'
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
  const notices = catalogNotices(filterByMaturity(movies.data ?? [], activeProfile), 8)

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
        {notices.length ? <span className="notify-dot" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <div className="notify-dropdown" role="menu">
          {notices.length ? (
            <div className="notify-list">
              {notices.map(({ item, kicker, stamp }, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={`notify-row ${index < 3 ? 'is-unread' : ''}`}
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
