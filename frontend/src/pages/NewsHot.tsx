import { useMemo, useState } from 'react'
import { getCatalogMany, getMovie, getMovies, getShow } from '../api/client'
import type { MovieListItem } from '../api/types'
import { BellIcon, InfoIcon, PlayIcon } from '../components/Icons'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { genresOf, isShow, sortByRating, sortByYear, uniqueById } from '../lib/media'
import { matchPercent, toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'

const THIS_YEAR = new Date().getFullYear()

function comingSoon(item: MovieListItem) {
  return (item.year ?? 0) >= THIS_YEAR
}

function FeedCard({ item, kicker }: { item: MovieListItem; kicker: string }) {
  const { openTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const { activeProfile, toggleMyList } = useProfiles()
  const [playing, setPlaying] = useState(false)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const genres = genresOf(item).slice(0, 3)
  const upcoming = comingSoon(item)
  const match = matchPercent(item, activeProfile)
  const history = activeProfile?.history.find((entry) => entry.id === item.id)

  async function playNow() {
    if (playing) return
    playClick()
    setPlaying(true)
    try {
      const detail = isShow(item) ? await getShow(item.id) : await getMovie(item.id)
      const session = buildWatchSession(item, detail, history)
      if (session) {
        openWatch(session.href, item.title, session.payload)
        return
      }
    } catch {
      /* fall through to constructed play href */
    } finally {
      setPlaying(false)
    }
    const href = `/watch/play/${item.id}`
    openWatch(href, item.title, {
      id: item.id,
      kind: item.kind ?? 'movie',
      title: item.title,
      year: item.year,
      poster_url: item.poster_url ?? null,
      genres: item.genres ?? [],
      watch_href: href,
    })
  }

  return (
    <article className="news-card">
      <button type="button" className="news-card-art" onClick={() => openTitle(item)} aria-label={item.title}>
        <CatalogImage item={item} alt="" prefer="backdrop" />
      </button>
      <div className="news-card-body">
        <p className="news-kicker">{kicker}</p>
        <h2>{item.title}</h2>
        <p className="news-meta">
          {!upcoming ? <span className="match">{match}% Match</span> : null}
          {item.year ? <span>{item.year}</span> : null}
          {genres.length ? <span>{genres.join(' · ')}</span> : null}
        </p>
        <div className="news-actions">
          {upcoming ? (
            <button
              type="button"
              className={`btn btn-info ${onList ? 'is-on' : ''}`}
              onClick={() => toggleMyList(toLiked(item))}
            >
              <BellIcon className="icon" />
              {onList ? 'Reminded' : 'Remind Me'}
            </button>
          ) : (
            <button type="button" className="btn btn-play" onClick={() => void playNow()} disabled={playing}>
              <PlayIcon className="icon" />
              Play
            </button>
          )}
          <button
            type="button"
            className="btn btn-info"
            onClick={() => {
              playClick()
              openTitle(item)
            }}
          >
            <InfoIcon className="icon" />
            More Info
          </button>
        </div>
      </div>
    </article>
  )
}

export function NewsHot() {
  const movies = useFetch(() => getMovies(), 'news-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...catalogMovies, ...catalogShows])
  }, 'news-catalog')

  const catalog = useMemo(
    () => uniqueById([...(movies.data ?? []), ...(extras.data ?? [])]),
    [movies.data, extras.data],
  )
  const coming = useMemo(() => sortByYear(catalog.filter(comingSoon)).slice(0, 12), [catalog])
  const watching = useMemo(() => {
    const seen = new Set(coming.map((item) => item.id))
    return sortByRating(catalog.filter((item) => !seen.has(item.id))).slice(0, 12)
  }, [catalog, coming])

  if ((movies.loading || extras.loading) && !catalog.length) {
    return <Spinner label="Loading titles" />
  }
  if (!catalog.length && movies.error) {
    return <ErrorState message={movies.error} onRetry={movies.retry} />
  }
  if (!coming.length && !watching.length) {
    return <EmptyState title="Nothing new right now" detail="Check Home for more titles." />
  }

  return (
    <main className="page page-pad news-hot-page">
      {coming.length ? (
        <section className="news-feed">
          <h1 className="page-title">Coming Soon</h1>
          {coming.map((item) => (
            <FeedCard key={item.id} item={item} kicker="Coming Soon" />
          ))}
        </section>
      ) : null}
      {watching.length ? (
        <section className="news-feed">
          <h2 className="page-title">Everyone’s Watching</h2>
          {watching.map((item) => (
            <FeedCard key={item.id} item={item} kicker="Everyone’s Watching" />
          ))}
        </section>
      ) : null}
    </main>
  )
}
