import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMovie, getMovies, getShow } from '../api/client'
import { AvatarArt } from '../components/AvatarArt'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { CaretIcon, DownloadIcon, ShuffleIcon } from '../components/Icons'
import { MediaRow } from '../components/MediaRow'
import { useAuth } from '../auth/AuthContext'
import { useFetch } from '../hooks/useFetch'
import { useFineHover } from '../hooks/useFineHover'
import { historyToListItems, likedToItems } from '../lib/homeRows'
import { isShow, uniqueById } from '../lib/media'
import { catalogNotices, filterByMaturity } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { becauseYouWatchedRows, rankByTaste } from '../profiles/taste'
import { avatarFor } from '../profiles/types'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'

export function MyNetflix() {
  const { user, logout } = useAuth()
  const { activeProfile, clearActive } = useProfiles()
  const { openTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const fineHover = useFineHover()
  const navigate = useNavigate()
  const movies = useFetch(() => getMovies(), 'home-movies')
  const catalog = filterByMaturity(movies.data ?? [], activeProfile)
  const continueItems = historyToListItems(
    (activeProfile?.history ?? []).filter(
      (item) => item.progress && item.progress > 0.05 && !activeProfile?.hiddenContinueIds.includes(item.id),
    ),
  )
  const progressById = Object.fromEntries(
    (activeProfile?.history ?? [])
      .filter((item) => item.progress)
      .map((item) => [item.id, item.progress as number]),
  )
  const listItems = likedToItems(activeProfile?.myList ?? [])
  const notices = catalogNotices(catalog, 8)
  const because = useMemo(
    () => (activeProfile ? becauseYouWatchedRows(catalog, activeProfile.history, 1) : []),
    [catalog, activeProfile],
  )
  const suggested = useMemo(() => {
    if (!activeProfile || !catalog.length) return []
    const skip = new Set([
      ...continueItems.map((item) => item.id),
      ...listItems.map((item) => item.id),
      ...because.flatMap((row) => row.items.map((item) => item.id)),
    ])
    return uniqueById(rankByTaste(catalog, activeProfile).filter((item) => !skip.has(item.id))).slice(0, 24)
  }, [activeProfile, because, catalog, continueItems, listItems])
  const avatar = activeProfile ? avatarFor(activeProfile) : null

  if (!activeProfile || !avatar) {
    return <EmptyState title="Choose a profile" detail="Pick who’s watching to see My Netflix." />
  }

  async function playSomething() {
    const pool = catalog
    if (!pool.length) return
    const item = pool[Math.floor(Math.random() * pool.length)]
    playClick()
    try {
      const detail = isShow(item) ? await getShow(item.id) : await getMovie(item.id)
      const history = activeProfile?.history.find((entry) => entry.id === item.id)
      const session = buildWatchSession(item, detail, history)
      if (session) {
        openWatch(session.href, item.title, session.payload)
        return
      }
    } catch {
      /* fall through */
    }
    openTitle(item)
  }

  return (
    <main className="page page-pad my-netflix-page">
      <header className="my-netflix-head">
        <button
          type="button"
          className="my-netflix-profile"
          onClick={() => {
            clearActive()
            navigate('/')
          }}
        >
          <span className="avatar-dot my-netflix-avatar" style={{ background: avatar.color }}>
            <AvatarArt avatar={avatar} alt={activeProfile.name} />
          </span>
          <span>
            <strong>{activeProfile.name}</strong>
            <em>Switch Profiles</em>
          </span>
          <CaretIcon className="icon" />
        </button>
        <button type="button" className="play-something" onClick={() => void playSomething()} aria-label="Play Something">
          <span className="play-something-disc">
            <ShuffleIcon className="icon" />
          </span>
          Play Something
        </button>
      </header>

      <section className="my-netflix-notes">
        <h2 className="section-title">Notifications</h2>
        {notices.length ? (
          <div className="notify-rail">
            {notices.map(({ item, kicker, stamp }) => (
              <button type="button" key={item.id} className="notify-card" onClick={() => openTitle(item)}>
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
          <p className="section-sub">No recent notifications.</p>
        )}
      </section>

      <section className="my-netflix-downloads">
        <h2 className="section-title">Downloads</h2>
        <div className="downloads-empty">
          <span className="downloads-empty-icon">
            <DownloadIcon className="icon" />
          </span>
          <strong>Downloads for You</strong>
          <p>Movies and TV shows you download appear here.</p>
          <Link to="/browse" className="downloads-find">
            Find Something to Download
          </Link>
        </div>
      </section>

      {continueItems.length ? (
        <MediaRow
          title={activeProfile?.name ? `Continue Watching for ${activeProfile.name}` : 'Continue Watching'}
          items={continueItems}
          progressById={progressById}
          continueMode
          hoverable={fineHover}
          variant="continue"
        />
      ) : null}
      {listItems.length ? <MediaRow title="My List" items={listItems} hoverable={fineHover} /> : null}
      {because.map((row) => (
        <MediaRow key={row.id} title={row.title} items={row.items} seed={row.seed} hoverable={fineHover} />
      ))}
      {suggested.length ? (
        <MediaRow title="We Think You’ll Like These" items={suggested} hoverable={fineHover} />
      ) : null}

      <div className="my-netflix-links">
        <Link to="/browse/my-list">My List</Link>
        <Link to="/account">Account</Link>
        <Link to="/" state={{ manage: true }}>
          Manage Profiles
        </Link>
        <button
          type="button"
          onClick={() => {
            clearActive()
            logout()
            navigate('/login')
          }}
        >
          Sign out of Flix
        </button>
        {user?.email ? <p className="section-sub">Signed in as {user.email}</p> : null}
      </div>
    </main>
  )
}
