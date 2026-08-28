import { getMovies } from '../api/client'
import { useHoverMenu } from '../hooks/useHoverMenu'
import { catalogNotices } from '../lib/netflix'
import { useFetch } from '../hooks/useFetch'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'
import { BellIcon } from './Icons'

export function NotificationsMenu() {
  const { openTitle } = useTitleModal()
  const { open, setOpen, rootRef, onEnter, onLeave, toggle } = useHoverMenu()
  const movies = useFetch(() => getMovies(), 'home-movies')
  const notices = catalogNotices(movies.data ?? [], 8)

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
            <section className="notify-group">
              <h3>Notifications</h3>
              {notices.map(({ item, kicker, stamp }) => (
                <button
                  type="button"
                  key={item.id}
                  className="notify-row"
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
            </section>
          ) : (
            <p>You’re all caught up</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
