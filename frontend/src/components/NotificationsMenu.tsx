import { useHoverMenu } from '../hooks/useHoverMenu'
import { useProfiles } from '../profiles/ProfileContext'
import type { WatchHistoryItem } from '../profiles/types'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'
import { BellIcon } from './Icons'

function timeAgo(stamp: number) {
  const delta = Math.max(0, Date.now() - stamp)
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function NotifyRows({
  items,
  onPick,
}: {
  items: WatchHistoryItem[]
  onPick: (item: WatchHistoryItem) => void
}) {
  return (
    <>
      {items.map((item) => (
        <button
          type="button"
          key={`${item.id}-${item.watchedAt}`}
          className="notify-row"
          onClick={() => onPick(item)}
        >
          <CatalogImage
            item={{
              title: item.title,
              kind: item.kind,
              year: item.year,
              poster_url: item.poster_url,
            }}
            prefer="backdrop"
            alt=""
          />
          <span>
            <strong>{item.progress && item.progress > 0.05 ? 'Continue Watching' : 'Now on Flix'}</strong>
            <em>{item.title}</em>
            <small>{timeAgo(item.watchedAt)}</small>
          </span>
        </button>
      ))}
    </>
  )
}

export function NotificationsMenu() {
  const { activeProfile } = useProfiles()
  const { openTitle } = useTitleModal()
  const { open, setOpen, rootRef, onEnter, onLeave, toggle } = useHoverMenu()
  const items = (activeProfile?.history ?? []).slice(0, 8)
  const day = 24 * 60 * 60 * 1000
  const today = items.filter((item) => Date.now() - item.watchedAt < day)
  const earlier = items.filter((item) => Date.now() - item.watchedAt >= day)

  function openItem(item: WatchHistoryItem) {
    setOpen(false)
    openTitle({
      id: item.id,
      title: item.title,
      kind: item.kind,
      year: item.year,
      genres: item.genres,
      poster_url: item.poster_url,
      href: item.kind === 'show' ? `/show/${item.id}` : `/movie/${item.id}`,
    })
  }

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
            <>
              {today.length ? (
                <section className="notify-group">
                  <h3>Today</h3>
                  <NotifyRows items={today} onPick={openItem} />
                </section>
              ) : null}
              {earlier.length ? (
                <section className="notify-group">
                  <h3>Earlier</h3>
                  <NotifyRows items={earlier} onPick={openItem} />
                </section>
              ) : null}
            </>
          ) : (
            <p>You’re all caught up</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
