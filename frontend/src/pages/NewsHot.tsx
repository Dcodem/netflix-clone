import { useEffect, useMemo, useRef, useState } from 'react'
import { getCatalogMany, getMovie, getMovies, getShow } from '../api/client'
import type { MovieListItem } from '../api/types'
import { BellIcon, CheckIcon, InfoIcon, PlayIcon, PlusIcon } from '../components/Icons'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { GenreDots } from '../components/GenreDots'
import { Spinner } from '../components/Spinner'
import { TitleLogo } from '../components/TitleLogo'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Home } from './Home'
import { genresOf, isShow, ofKind, sortByRating, uniqueById } from '../lib/media'
import { filterByMaturity, matchPercent, maturityLabel, toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'

const synCache = new Map<string, string>()
const THIS_YEAR = new Date().getFullYear()

type NewsChip = 'coming' | 'watching' | 'top-tv' | 'top-movies'
type FeedMode = 'soon' | 'watching' | 'ranked'

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
  mode,
  rank,
  onRemind,
}: {
  item: MovieListItem
  kicker?: string
  synopsis?: string
  mode: FeedMode
  rank?: number
  onRemind?: (item: MovieListItem, onList: boolean) => void
}) {
  const { openTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const { activeProfile, toggleMyList } = useProfiles()
  const [playing, setPlaying] = useState(false)
  const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
  const genres = genresOf(item).slice(0, 3)
  const date = mode === 'soon' ? comingDate(item.id) : null
  const match = matchPercent(item, activeProfile)
  const maturity = maturityLabel(item)
  const history = activeProfile?.history.find((entry) => entry.id === item.id)
  const ranked = mode === 'ranked' && typeof rank === 'number'

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
      /* fall through to the title preview */
    } finally {
      setPlaying(false)
    }
    openTitle(item)
  }

  return (
    <article
      className={`news-card ${mode === 'soon' ? 'is-soon' : ''} ${ranked ? 'is-ranked' : ''} ${rank === 10 ? 'is-ten' : ''}`}
    >
      {date ? (
        <div className="news-date" aria-label={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}>
          <em>{monthLabel(date)}</em>
          <strong>{date.getDate()}</strong>
          <span className="news-kind">{isShow(item) ? 'Series' : 'Film'}</span>
        </div>
      ) : null}
      {ranked ? (
        <div className="news-rank" data-rank={rank} aria-hidden="true">
          {rank}
        </div>
      ) : null}
      <button type="button" className="news-card-art" onClick={() => openTitle(item)} aria-label={item.title}>
        <CatalogImage item={item} alt="" prefer="backdrop" />
      </button>
      <div className="news-card-body">
        <div className="news-title-row">
          <div className="news-title-copy">
            {mode === 'watching' && kicker ? <p className="news-kicker">{kicker}</p> : null}
            <TitleLogo item={item} className="news-title-logo" titleClassName="news-title-text" />
          </div>
          <div className="news-icon-actions">
            {mode === 'soon' ? (
              <button
                type="button"
                className={`news-icon-btn ${onList ? 'is-on' : ''}`}
                aria-pressed={onList}
                onClick={() => {
                  if (onRemind) onRemind(item, onList)
                  else toggleMyList(toLiked(item))
                }}
              >
                <span className="news-icon-disc">
                  {onList ? <CheckIcon className="icon" /> : <BellIcon className="icon" />}
                </span>
                {onList ? 'Reminded' : 'Remind Me'}
              </button>
            ) : (
              <button type="button" className="news-icon-btn is-play" onClick={() => void playNow()} disabled={playing}>
                <span className="news-icon-disc">
                  <PlayIcon className="icon" />
                </span>
                Play
              </button>
            )}
            {mode === 'soon' ? (
              <button
                type="button"
                className="news-icon-btn"
                onClick={() => {
                  playClick()
                  openTitle(item)
                }}
              >
                <span className="news-icon-disc">
                  <InfoIcon className="icon" />
                </span>
                Info
              </button>
            ) : (
              <button
                type="button"
                className={`news-icon-btn ${onList ? 'is-on' : ''}`}
                onClick={() => toggleMyList(toLiked(item))}
              >
                <span className="news-icon-disc">
                  {onList ? <CheckIcon className="icon" /> : <PlusIcon className="icon" />}
                </span>
                My List
              </button>
            )}
          </div>
        </div>
        {date ? (
          <p className="news-coming">
            Coming {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        ) : null}
        <p className="news-meta">
          {mode !== 'soon' ? <span className="match">{match}% Match</span> : null}
          <span className="maturity">{maturity}</span>
          {item.year && mode !== 'soon' ? <span>{item.year}</span> : null}
        </p>
        {synopsis ? <p className="news-syn">{synopsis}</p> : null}
        {genres.length ? <GenreDots genres={genres} className="news-genres" /> : null}
      </div>
    </article>
  )
}

export function NewsHot() {
  const desktop = useMediaQuery('(min-width: 768px)')
  if (desktop) return <Home filter="popular" />
  return <NewsHotFeed />
}

function NewsHotFeed() {
  const movies = useFetch(() => getMovies(), 'news-movies')
  const extras = useFetch(async () => {
    const [catalogMovies, catalogShows] = await Promise.all([
      getCatalogMany('movies').catch(() => [] as MovieListItem[]),
      getCatalogMany('shows').catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...catalogMovies, ...catalogShows])
  }, 'news-catalog')

  const { activeProfile, toggleMyList } = useProfiles()
  const [remindNote, setRemindNote] = useState<string | null>(null)
  const remindTimer = useRef(0)

  function handleRemind(item: MovieListItem, onList: boolean) {
    playClick()
    toggleMyList(toLiked(item))
    window.clearTimeout(remindTimer.current)
    if (!onList) {
      setRemindNote(`We’ll remind you when ${item.title} is ready to watch.`)
      remindTimer.current = window.setTimeout(() => setRemindNote(null), 4200)
    } else {
      setRemindNote(null)
    }
  }

  useEffect(() => () => window.clearTimeout(remindTimer.current), [])
  const catalog = useMemo(
    () => filterByMaturity(uniqueById([...(movies.data ?? []), ...(extras.data ?? [])]), activeProfile),
    [movies.data, extras.data, activeProfile],
  )
  const comingRef = useRef<HTMLElement>(null)
  const watchingRef = useRef<HTMLElement>(null)
  const topTvRef = useRef<HTMLElement>(null)
  const topMoviesRef = useRef<HTMLElement>(null)
  const chipBtnRefs = useRef<Partial<Record<NewsChip, HTMLButtonElement | null>>>({})
  const jumpingRef = useRef(false)
  const [chip, setChip] = useState<NewsChip | null>(null)
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
  const topTv = useMemo(() => sortByRating(ofKind(catalog, 'shows')).slice(0, 10), [catalog])
  const topMovies = useMemo(() => sortByRating(ofKind(catalog, 'movies')).slice(0, 10), [catalog])
  const chips = useMemo(() => {
    const next: Array<{ id: NewsChip; label: string; show: boolean }> = [
      { id: 'coming', label: 'Coming Soon', show: coming.length > 0 },
      { id: 'watching', label: 'Everyone’s Watching', show: watching.length > 0 },
      { id: 'top-tv', label: 'Top 10 TV Shows', show: topTv.length > 0 },
      { id: 'top-movies', label: 'Top 10 Movies', show: topMovies.length > 0 },
    ]
    return next.filter((entry) => entry.show)
  }, [coming.length, watching.length, topTv.length, topMovies.length])
  const activeChip = chip && chips.some((entry) => entry.id === chip) ? chip : (chips[0]?.id ?? 'coming')
  const [synopses, setSynopses] = useState<Record<string, string>>({})
  const feed = useMemo(
    () => uniqueById([...coming, ...watching, ...topTv, ...topMovies]),
    [coming, watching, topTv, topMovies],
  )
  const feedIds = useMemo(() => feed.map((item) => item.id).join(','), [feed])

  useEffect(() => {
    let cancelled = false
    const missing = feed.filter((item) => !synCache.has(item.id))
    if (!missing.length) {
      setSynopses((prev) => {
        const next = { ...prev }
        for (const item of feed) {
          const hit = synCache.get(item.id)
          if (hit && next[item.id] !== hit) next[item.id] = hit
        }
        return next
      })
      return
    }
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
  }, [feed, feedIds])

  useEffect(() => {
    const nodes: Array<[NewsChip, HTMLElement | null]> = [
      ['coming', comingRef.current],
      ['watching', watchingRef.current],
      ['top-tv', topTvRef.current],
      ['top-movies', topMoviesRef.current],
    ]
    const targets = nodes.filter((entry): entry is [NewsChip, HTMLElement] => Boolean(entry[1]))
    if (!targets.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumpingRef.current) return
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!hit) return
        const match = targets.find(([, node]) => node === hit.target)
        if (match) setChip(match[0])
      },
      { rootMargin: '-18% 0px -58% 0px', threshold: [0.08, 0.2, 0.4] },
    )
    targets.forEach(([, node]) => observer.observe(node))
    return () => observer.disconnect()
  }, [coming.length, watching.length, topTv.length, topMovies.length])

  useEffect(() => {
    const btn = chipBtnRefs.current[activeChip]
    const scroller = btn?.parentElement
    if (!btn || !scroller) return
    const left = btn.offsetLeft - (scroller.clientWidth - btn.offsetWidth) / 2
    scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeChip])

  function jump(next: NewsChip) {
    setChip(next)
    jumpingRef.current = true
    const node =
      next === 'coming'
        ? comingRef.current
        : next === 'watching'
          ? watchingRef.current
          : next === 'top-tv'
            ? topTvRef.current
            : topMoviesRef.current
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      jumpingRef.current = false
    }, 700)
  }

  if ((movies.loading || extras.loading) && !catalog.length) {
    return (
      <main className="page page-pad news-hot-page">
        <Spinner label="Loading titles" />
      </main>
    )
  }
  if (!catalog.length && movies.error) {
    return <ErrorState message={movies.error} onRetry={movies.retry} />
  }
  if (!chips.length) {
    return <EmptyState title="Nothing new right now" detail="Check Home for more titles." />
  }

  return (
    <main className="page page-pad news-hot-page">
      <nav className="news-chips" aria-label="New & Hot">
        {chips.map((entry) => (
          <button
            key={entry.id}
            type="button"
            ref={(node) => {
              chipBtnRefs.current[entry.id] = node
            }}
            className={activeChip === entry.id ? 'is-on' : ''}
            onClick={() => jump(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>
      {coming.length ? (
        <section className="news-feed" ref={comingRef} aria-label="Coming Soon">
          <h1 className="visually-hidden">Coming Soon</h1>
          {coming.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              mode="soon"
              synopsis={synopses[item.id]}
              onRemind={handleRemind}
            />
          ))}
        </section>
      ) : null}
      {watching.length ? (
        <section className="news-feed" ref={watchingRef} aria-label="Everyone’s Watching">
          <h2 className="visually-hidden">Everyone’s Watching</h2>
          {watching.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              mode="watching"
              kicker="Everyone’s Watching"
              synopsis={synopses[item.id]}
            />
          ))}
        </section>
      ) : null}
      {topTv.length ? (
        <section className="news-feed" ref={topTvRef} aria-label="Top 10 TV Shows">
          <h2 className="visually-hidden">Top 10 TV Shows</h2>
          {topTv.map((item, index) => (
            <FeedCard key={item.id} item={item} mode="ranked" rank={index + 1} synopsis={synopses[item.id]} />
          ))}
        </section>
      ) : null}
      {topMovies.length ? (
        <section className="news-feed" ref={topMoviesRef} aria-label="Top 10 Movies">
          <h2 className="visually-hidden">Top 10 Movies</h2>
          {topMovies.map((item, index) => (
            <FeedCard key={item.id} item={item} mode="ranked" rank={index + 1} synopsis={synopses[item.id]} />
          ))}
        </section>
      ) : null}
      {remindNote ? (
        <p className="news-remind-toast" role="alert">
          {remindNote}
        </p>
      ) : null}
    </main>
  )
}
