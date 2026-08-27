import { useEffect, useMemo, useRef, useState } from 'react'
import { getCatalogMany, getMovie, getMovies, getShow } from '../api/client'
import type { MovieListItem } from '../api/types'
import { BellIcon, InfoIcon, PlayIcon } from '../components/Icons'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { genresOf, isShow, sortByRating, uniqueById } from '../lib/media'
import { matchPercent, toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'

const synCache = new Map<string, string>()
const THIS_YEAR = new Date().getFullYear()

async function synopsisForItem(item: MovieListItem): Promise<string> {
  const hit = synCache.get(item.id)
  if (hit) return hit
  const detail = isShow(item) ? await getShow(item.id) : await getMovie(item.id)
  const synopsis = detail.synopsis?.trim() ?? ''
  if (synopsis) synCache.set(item.id, synopsis)
  return synopsis
}

function comingSoon(item: MovieListItem) {
  return (item.year ?? 0) >= THIS_YEAR
}

function comingDate(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + 4 + (hash % 42))
  return date
}

function monthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
}

function FeedCard({
  item,
  kicker,
  synopsis,
}: {
  item: MovieListItem
  kicker: string
  synopsis?: string
}) {
  const { openTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const { activeProfile, toggleMyList } = useProfiles()
  const [playing, setPlaying] = useState(false)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const genres = genresOf(item).slice(0, 3)
  const upcoming = comingSoon(item)
  const date = upcoming ? comingDate(item.id) : null
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
    <article className={`news-card ${upcoming ? 'is-soon' : ''}`}>
      {date ? (
        <div className="news-date" aria-label={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}>
          <em>{monthLabel(date)}</em>
          <strong>{date.getDate()}</strong>
        </div>
      ) : null}
      <button type="button" className="news-card-art" onClick={() => openTitle(item)} aria-label={item.title}>
        <CatalogImage item={item} alt="" prefer="backdrop" />
      </button>
      <div className="news-card-body">
        {upcoming ? null : <p className="news-kicker">{kicker}</p>}
        <h2>{item.title}</h2>
        <p className="news-meta">
          {!upcoming ? <span className="match">{match}% Match</span> : null}
          {item.year ? <span>{item.year}</span> : null}
          {genres.length ? <span>{genres.join(' • ')}</span> : null}
        </p>
        {synopsis ? <p className="news-syn">{synopsis}</p> : null}
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
  const comingRef = useRef<HTMLElement>(null)
  const watchingRef = useRef<HTMLElement>(null)
  const jumpingRef = useRef(false)
  const [chip, setChip] = useState<'coming' | 'watching' | null>(null)
  const coming = useMemo(
    () =>
      catalog
        .filter(comingSoon)
        .slice()
        .sort((a, b) => comingDate(a.id).getTime() - comingDate(b.id).getTime())
        .slice(0, 12),
    [catalog],
  )
  const watching = useMemo(() => {
    const seen = new Set(coming.map((item) => item.id))
    return sortByRating(catalog.filter((item) => !seen.has(item.id))).slice(0, 12)
  }, [catalog, coming])
  const activeChip = chip ?? (coming.length ? 'coming' : 'watching')
  const [synopses, setSynopses] = useState<Record<string, string>>({})
  const feedIds = useMemo(
    () => [...coming, ...watching].map((item) => item.id).join(','),
    [coming, watching],
  )

  useEffect(() => {
    let cancelled = false
    const feed = [...coming, ...watching]
    const missing = feed.filter((item) => !synCache.has(item.id))
    if (!missing.length) return
    Promise.all(
      missing.map(async (item) => {
        try {
          return [item.id, await synopsisForItem(item)] as const
        } catch {
          return [item.id, ''] as const
        }
      }),
    ).then((rows) => {
      if (!cancelled) setSynopses((prev) => ({ ...prev, ...Object.fromEntries(rows) }))
    })
    return () => {
      cancelled = true
    }
  }, [coming, watching, feedIds])

  useEffect(() => {
    const comingNode = comingRef.current
    const watchingNode = watchingRef.current
    const targets = [comingNode, watchingNode].filter(Boolean) as HTMLElement[]
    if (!targets.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumpingRef.current) return
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!hit) return
        if (hit.target === comingNode) setChip('coming')
        else if (hit.target === watchingNode) setChip('watching')
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.08, 0.2, 0.4] },
    )
    targets.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [coming.length, watching.length])

  function jump(next: 'coming' | 'watching') {
    setChip(next)
    jumpingRef.current = true
    const node = next === 'coming' ? comingRef.current : watchingRef.current
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      jumpingRef.current = false
    }, 700)
  }

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
      <nav className="news-chips" aria-label="New & Popular">
        {coming.length ? (
          <button type="button" className={activeChip === 'coming' ? 'is-on' : ''} onClick={() => jump('coming')}>
            Coming Soon
          </button>
        ) : null}
        {watching.length ? (
          <button type="button" className={activeChip === 'watching' ? 'is-on' : ''} onClick={() => jump('watching')}>
            Everyone’s Watching
          </button>
        ) : null}
      </nav>
      {coming.length ? (
        <section className="news-feed" ref={comingRef} aria-label="Coming Soon">
          <h1 className="visually-hidden">Coming Soon</h1>
          {coming.map((item) => (
            <FeedCard key={item.id} item={item} kicker="Coming Soon" synopsis={synopses[item.id]} />
          ))}
        </section>
      ) : null}
      {watching.length ? (
        <section className="news-feed" ref={watchingRef} aria-label="Everyone’s Watching">
          <h2 className="visually-hidden">Everyone’s Watching</h2>
          {watching.map((item) => (
            <FeedCard key={item.id} item={item} kicker="Everyone’s Watching" synopsis={synopses[item.id]} />
          ))}
        </section>
      ) : null}
    </main>
  )
}
