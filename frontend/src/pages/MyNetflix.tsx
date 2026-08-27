import { Link, useNavigate } from 'react-router-dom'
import { getMovie, getMovies, getShow } from '../api/client'
import { AvatarArt } from '../components/AvatarArt'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { CaretIcon, DownloadIcon, ShuffleIcon } from '../components/Icons'
import { MediaRow } from '../components/MediaRow'
import { useAuth } from '../auth/AuthContext'
import { useFetch } from '../hooks/useFetch'
import { historyToListItems, likedToItems } from '../lib/homeRows'
import { isShow } from '../lib/media'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor } from '../profiles/types'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'

export function MyNetflix() {
  const { user, logout } = useAuth()
  const { activeProfile, clearActive } = useProfiles()
  const { openTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const navigate = useNavigate()
  const movies = useFetch(() => getMovies(), 'my-netflix-movies')
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
  const notes = (activeProfile?.history ?? []).slice(0, 8)
  const arrivals = (movies.data ?? []).slice(0, 6)
  const avatar = activeProfile ? avatarFor(activeProfile) : null

  if (!activeProfile || !avatar) {
    return <EmptyState title="Choose a profile" detail="Pick who’s watching to see My Netflix." />
  }

  async function playSomething() {
    const pool = movies.data ?? []
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
            <em>Switch profiles</em>
          </span>
          <CaretIcon className="icon" />
        </button>
        <button type="button" className="play-something" onClick={() => void playSomething()}>
          <ShuffleIcon className="icon" />
          Play Something
        </button>
      </header>

      <section className="my-netflix-notes">
        <h2 className="section-title">Notifications</h2>
        {notes.length ? (
          <div className="notify-feed">
            {notes.map((item) => (
              <button
                type="button"
                key={`${item.id}-${item.watchedAt}`}
                className="notify-row"
                onClick={() =>
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
              >
                <CatalogImage
                  item={{ title: item.title, kind: item.kind, year: item.year, poster_url: item.poster_url }}
                  prefer="backdrop"
                  alt=""
                />
                <span>
                  <strong>{item.progress && item.progress > 0.05 ? 'Continue Watching' : 'Now on Flix'}</strong>
                  <em>{item.title}</em>
                </span>
              </button>
            ))}
          </div>
        ) : arrivals.length ? (
          <div className="notify-feed">
            {arrivals.map((item) => (
              <button type="button" key={item.id} className="notify-row" onClick={() => openTitle(item)}>
                <CatalogImage item={item} prefer="backdrop" alt="" />
                <span>
                  <strong>Recently Added</strong>
                  <em>{item.title}</em>
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
          <DownloadIcon className="icon" />
          <div>
            <strong>Introducing Downloads for You</strong>
            <p>Featured downloads for {activeProfile.name} will appear here on phones and tablets.</p>
          </div>
        </div>
      </section>

      {continueItems.length ? (
        <MediaRow
          title="Continue Watching"
          items={continueItems}
          progressById={progressById}
          continueMode
          hoverable={false}
          variant="continue"
        />
      ) : null}
      {listItems.length ? <MediaRow title="My List" items={listItems} hoverable={false} /> : null}

      <div className="my-netflix-links">
        <Link to="/browse/my-list">My List</Link>
        <Link to="/account">Account</Link>
        <Link
          to="/"
          onClick={() => {
            clearActive()
          }}
        >
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
