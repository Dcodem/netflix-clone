import { useHoverMenu } from '../hooks/useHoverMenu'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { BellIcon } from './Icons'

function timeAgo(stamp: number) {
  const delta = Math.max(0, Date.now() - stamp)
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

export function NotificationsMenu() {
  const { activeProfile } = useProfiles()
  const { openTitle } = useTitleModal()
  const { open, setOpen, rootRef, onEnter, onLeave, toggle } = useHoverMenu()
  const items = (activeProfile?.history ?? []).slice(0, 6)

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
        {items.length ? <span className="notify-dot" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <div className="notify-dropdown" role="menu">
          {items.length ? (
            items.map((item) => (
              <button
                type="button"
                key={`${item.id}-${item.watchedAt}`}
                className="notify-row"
                onClick={() => {
                  setOpen(false)
                  openTitle({
                    id: item.id,
                    title: item.title,
                    kind: item.kind,
                    genres: item.genres,
                    poster_url: item.poster_url,
                    href: item.kind === 'show' ? `/show/${item.id}` : `/movie/${item.id}`,
                  })
                }}
              >
                {item.poster_url ? <img src={item.poster_url} alt="" /> : <span className="notify-art-fallback" />}
                <span>
                  <strong>{item.progress && item.progress > 0.05 ? 'Continue Watching' : 'Recently watched'}</strong>
                  <em>{item.title}</em>
                  <small>{timeAgo(item.watchedAt)}</small>
                </span>
              </button>
            ))
          ) : (
            <p>No recent notifications</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
