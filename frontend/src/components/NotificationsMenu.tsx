import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { useHoverMenu } from '../hooks/useHoverMenu'
import { catalogNotices, filterByMaturity, noticeGroup } from '../lib/netflix'
import { noticeKey, withNotifySeen, writeNotifySeen } from '../lib/notifySeen'
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
  const [seenTick, setSeenTick] = useState(0)
  const openKeys = useRef<string[]>([])
  const movies = useFetch(() => getMovies(), 'home-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...catalogMovies, ...catalogShows])
  }, 'notify-catalog')
  const catalog = uniqueById([...(movies.data ?? []), ...(extras.data ?? [])])
  const rawNotices = useMemo(
    () => catalogNotices(filterByMaturity(catalog, activeProfile), activeProfile, 8),
    [catalog, activeProfile],
  )
  const notices = useMemo(
    () => withNotifySeen(rawNotices, activeProfile?.id),
    [rawNotices, activeProfile?.id, seenTick],
  )
  const unread = notices.some((notice) => notice.unread)
  const groups = useMemo(() => {
    const buckets: Record<'Today' | 'Yesterday' | 'Earlier', typeof notices> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }
    for (const notice of notices) buckets[noticeGroup(notice.stamp)].push(notice)
    return (['Today', 'Yesterday', 'Earlier'] as const)
      .filter((label) => buckets[label].length)
      .map((label) => ({ label, items: buckets[label] }))
  }, [notices])

  useEffect(() => {
    if (open) {
      openKeys.current = rawNotices.map(noticeKey)
      return
    }
    if (!activeProfile?.id || !openKeys.current.length) return
    writeNotifySeen(activeProfile.id, openKeys.current)
    openKeys.current = []
    setSeenTick((tick) => tick + 1)
  }, [open, activeProfile?.id, rawNotices])

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
        <div className="notify-dropdown" role="menu" aria-label="Notifications">
          {groups.length ? (
            <div className="notify-list">
              {groups.map((group) => (
                <section className="notify-group" key={group.label}>
                  <h3>{group.label}</h3>
                  {group.items.map(({ item, kicker, stamp, unread: isUnread }) => (
                    <button
                      type="button"
                      key={`${kicker}-${item.id}`}
                      className={`notify-row ${isUnread ? 'is-unread' : ''}`}
                      onClick={(event) => {
                        setOpen(false)
                        openTitle(item, event.currentTarget)
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
              ))}
            </div>
          ) : (
            <p>No recent notifications.</p>
          )}
          <Link className="notify-foot" to="/browse/my-netflix" onClick={() => setOpen(false)}>
            Go to My Netflix
          </Link>
        </div>
      ) : null}
    </div>
  )
}
