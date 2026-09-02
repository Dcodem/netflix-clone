import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCatalogMany, getMovie, getMovies, getShow } from '../api/client'
import type { MovieListItem } from '../api/types'
import { AvatarArt } from '../components/AvatarArt'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { CaretIcon, DownloadIcon, ShuffleIcon } from '../components/Icons'
import { MediaRow } from '../components/MediaRow'
import { useAuth } from '../auth/AuthContext'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { isComingSoon } from '../lib/comingSoon'
import { historyToListItems, likedToItems, stillWatching } from '../lib/homeRows'
import { isShow, sortByRating, uniqueById } from '../lib/media'
import { catalogNotices, filterByMaturity } from '../lib/netflix'
import { withNotifySeen } from '../lib/notifySeen'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { becauseYouWatchedRows, rankByTaste } from '../profiles/taste'
import { avatarFor, downloadQualityLabel, usesPersonalizedRecs } from '../profiles/types'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { useCatalogEnrichment } from '../trailers/useCatalogEnrichment'

export function MyNetflix() {
  const { user, logout } = useAuth()
  const { activeProfile, clearActive } = useProfiles()
  const { openTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const desktop = useMediaQuery('(min-width: 768px)')
  const navigate = useNavigate()
  const movies = useFetch(() => getMovies(), 'home-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...catalogMovies, ...catalogShows])
  }, 'mynetflix-catalog')
  const source = useMemo(
    () => filterByMaturity(uniqueById([...(movies.data ?? []), ...(extras.data ?? [])]), activeProfile),
    [movies.data, extras.data, activeProfile],
  )
  const catalog = useCatalogEnrichment(source)
  const continueItems = historyToListItems(
    (activeProfile?.history ?? []).filter(
      (item) => stillWatching(item) && !activeProfile?.hiddenContinueIds.includes(item.id),
    ),
  )
  const progressById = Object.fromEntries(
    (activeProfile?.history ?? [])
      .filter((item) => item.progress)
      .map((item) => [item.id, item.progress as number]),
  )
  const listItems = likedToItems(activeProfile?.myList ?? [])
  const downloadItems = likedToItems(activeProfile?.downloads ?? [])
  const notices = withNotifySeen(catalogNotices(catalog, activeProfile, 8), activeProfile?.id)
  const because = useMemo(
    () =>
      activeProfile && usesPersonalizedRecs(activeProfile)
        ? becauseYouWatchedRows(catalog, activeProfile.history, 1)
        : [],
    [catalog, activeProfile],
  )
  const suggested = useMemo(() => {
    if (!activeProfile || !catalog.length) return []
    const skip = new Set([
      ...continueItems.map((item) => item.id),
      ...listItems.map((item) => item.id),
      ...because.flatMap((row) => row.items.map((item) => item.id)),
    ])
    const pool = usesPersonalizedRecs(activeProfile)
      ? rankByTaste(catalog, activeProfile)
      : sortByRating(catalog)
    return uniqueById(pool.filter((item) => !skip.has(item.id))).slice(0, 24)
  }, [activeProfile, because, catalog, continueItems, listItems])
  const avatar = activeProfile ? avatarFor(activeProfile) : null

  if (!activeProfile || !avatar) {
    return <EmptyState title="Choose a profile" detail="Pick who’s watching to see My Netflix." />
  }

  async function playSomething() {
    const pool = catalog.filter((item) => !isComingSoon(item))
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
      <h1 className="my-netflix-title">My Netflix</h1>
      <header className="my-netflix-head">
        <button
          type="button"
          className="my-netflix-profile"
          aria-label={`Switch profiles, ${activeProfile.name}`}
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
            {notices.map(({ item, kicker, stamp, unread }) => (
              <button
                type="button"
                key={item.id}
                className={`notify-card ${unread ? 'is-unread' : ''}`}
                onClick={(event) => openTitle(item, event.currentTarget)}
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
          <p className="section-sub">No recent notifications.</p>
        )}
      </section>

      {continueItems.length ? (
        <MediaRow
          title={activeProfile?.name ? `Continue Watching for ${activeProfile.name}` : 'Continue Watching'}
          items={continueItems}
          progressById={progressById}
          continueMode
          hoverable={desktop}
          variant="continue"
        />
      ) : null}

      <section className="my-netflix-downloads">
        <h2 className="section-title">Downloads</h2>
        {downloadItems.length ? (
          <ul className="download-list">
            {downloadItems.map((item) => (
              <li key={item.id}>
                <button type="button" className="download-row" onClick={(event) => openTitle(item, event.currentTarget)}>
                  <span className="download-still">
                    <CatalogImage item={item} prefer="backdrop" alt="" />
                  </span>
                  <span className="download-copy">
                    <strong>{item.title}</strong>
                    <em>
                      Download complete · {downloadQualityLabel(activeProfile.downloadQuality)}
                      {activeProfile.smartDownloads !== false ? ' · Smart Downloads' : ''}
                    </em>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
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
        )}
      </section>

      {listItems.length ? <MediaRow title="My List" items={listItems} hoverable={desktop} /> : null}
      {because.map((row) => (
        <MediaRow key={row.id} title={row.title} items={row.items} seed={row.seed} hoverable={desktop} />
      ))}
      {suggested.length ? (
        <MediaRow
          title={usesPersonalizedRecs(activeProfile) ? 'We Think You’ll Like These' : 'Popular on FLIX'}
          items={suggested}
          hoverable={desktop}
        />
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
