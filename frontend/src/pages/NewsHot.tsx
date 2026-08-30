import { useEffect, useMemo, useRef, useState } from 'react'
import { getCatalogMany, getMovie, getMovies, getShow } from '../api/client'
import type { MovieListItem } from '../api/types'
import { BellIcon, CheckIcon, InfoIcon, PlayIcon, PlusIcon, ShareIcon } from '../components/Icons'
import { CatalogImage } from '../components/CatalogImage'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { GenreDots } from '../components/GenreDots'
import { Spinner } from '../components/Spinner'
import { TitleLogo } from '../components/TitleLogo'
import { notifyRemind } from '../components/RemindToast'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Home } from './Home'
import { comingDate, comingDayKey, comingLine, isComingSoon, monthLabel } from '../lib/comingSoon'
import { genresOf, isShow, ofKind, sortByRating, sortByYear, uniqueById } from '../lib/media'
import { filterByMaturity, matchPercent, maturityLabel, toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'

const synCache = new Map<string, string>()

type NewsChip = 'coming' | 'watching' | 'worth' | 'new' | 'top-tv' | 'top-movies'
type FeedMode = 'soon' | 'watching' | 'ranked'

async function synopsisForItem(item: MovieListItem): Promise<string> {
  const hit = synCache.get(item.id)
  if (hit) return hit
  const detail = isShow(item) ? await getShow(item.id) : await getMovie(item.id)
  const synopsis = detail.synopsis?.trim() ?? ''
  if (synopsis) synCache.set(item.id, synopsis)
  return synopsis
}

function FeedCard({
  item,
  synopsis,
  mode,
  rank,
  hideDate = false,
  onRemind,
}: {
  item: MovieListItem
  synopsis?: string
  mode: FeedMode
  rank?: number
  hideDate?: boolean
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
  const [shared, setShared] = useState(false)

  async function shareNow() {
    const url = `${window.location.origin}/browse?jbv=${encodeURIComponent(item.id)}`
    playClick()
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url })
        return
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(url)
      setShared(true)
      window.setTimeout(() => setShared(false), 1600)
    } catch {
      /* ignore */
    }
  }

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
      className={`news-card ${mode === 'soon' ? 'is-soon' : ''} ${hideDate ? 'is-same-day' : ''} ${ranked ? 'is-ranked' : ''} ${rank === 10 ? 'is-ten' : ''}`}
    >
      {date ? (
        <div
          className={`news-date ${hideDate ? 'is-repeat' : ''}`}
          aria-hidden={hideDate || undefined}
          aria-label={hideDate ? undefined : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        >
          <em>{monthLabel(date)}</em>
          <strong>{date.getDate()}</strong>
        </div>
      ) : null}
      {ranked ? (
        <div className="news-ranked-media">
          <div className="news-rank" data-rank={rank} aria-hidden="true">
            {rank}
          </div>
          <button type="button" className="news-card-art" onClick={(event) => openTitle(item, event.currentTarget)} aria-label={item.title}>
            <CatalogImage item={item} alt="" prefer="backdrop" />
          </button>
        </div>
      ) : (
        <button type="button" className="news-card-art" onClick={(event) => openTitle(item, event.currentTarget)} aria-label={item.title}>
          <CatalogImage item={item} alt="" prefer="backdrop" />
        </button>
      )}
      <div className="news-card-body">
        <div className="news-title-row">
          <div className="news-title-copy">
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
              <>
                <button
                  type="button"
                  className="news-icon-btn"
                  onClick={(event) => {
                    playClick()
                    openTitle(item, event.currentTarget)
                  }}
                >
                  <span className="news-icon-disc">
                    <InfoIcon className="icon" />
                  </span>
                  Info
                </button>
                <button type="button" className={`news-icon-btn ${shared ? 'is-on' : ''}`} onClick={() => void shareNow()}>
                  <span className="news-icon-disc">
                    <ShareIcon className="icon" />
                  </span>
                  {shared ? 'Copied' : 'Share'}
                </button>
              </>
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
          <p className="news-coming">{comingLine(date)}</p>
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

  function handleRemind(item: MovieListItem, onList: boolean) {
    playClick()
    toggleMyList(toLiked(item))
    notifyRemind(item.title, !onList)
  }
  const catalog = useMemo(
    () => filterByMaturity(uniqueById([...(movies.data ?? []), ...(extras.data ?? [])]), activeProfile),
    [movies.data, extras.data, activeProfile],
  )
  const comingRef = useRef<HTMLElement>(null)
  const watchingRef = useRef<HTMLElement>(null)
  const worthRef = useRef<HTMLElement>(null)
  const newRef = useRef<HTMLElement>(null)
  const topTvRef = useRef<HTMLElement>(null)
  const topMoviesRef = useRef<HTMLElement>(null)
  const chipBtnRefs = useRef<Partial<Record<NewsChip, HTMLButtonElement | null>>>({})
  const jumpingRef = useRef(false)
  const [chip, setChip] = useState<NewsChip | null>(null)
  const coming = useMemo(() => {
    const soon = catalog.filter(isComingSoon)
    const series = soon.filter(isShow)
    const films = soon.filter((item) => !isShow(item))
    return uniqueById([...series.slice(0, 4), ...films.slice(0, 10)]).sort(
      (a, b) => comingDate(a.id).getTime() - comingDate(b.id).getTime(),
    )
  }, [catalog])
  const watching = useMemo(() => {
    const seen = new Set(coming.map((item) => item.id))
    return sortByRating(catalog.filter((item) => !seen.has(item.id) && !isComingSoon(item))).slice(0, 12)
  }, [catalog, coming])
  const worth = useMemo(() => {
    const comingIds = new Set(coming.map((item) => item.id))
    const watchingIds = new Set(watching.map((item) => item.id))
    const leftoverSoon = catalog.filter((item) => isComingSoon(item) && !comingIds.has(item.id))
    const fill = sortByRating(
      catalog.filter((item) => !comingIds.has(item.id) && !watchingIds.has(item.id)),
    )
    return uniqueById([...leftoverSoon, ...fill]).slice(0, 10)
  }, [catalog, coming, watching])
  const newFlix = useMemo(() => {
    const taken = new Set([...coming, ...watching, ...worth].map((item) => item.id))
    return sortByYear(catalog.filter((item) => !isComingSoon(item) && !taken.has(item.id))).slice(0, 10)
  }, [catalog, coming, watching, worth])
  const topTv = useMemo(() => sortByRating(ofKind(catalog, 'shows')).slice(0, 10), [catalog])
  const topMovies = useMemo(() => sortByRating(ofKind(catalog, 'movies')).slice(0, 10), [catalog])
  const chips = useMemo(() => {
    const next: Array<{ id: NewsChip; label: string; show: boolean }> = [
      { id: 'coming', label: 'Coming Soon', show: coming.length > 0 },
      { id: 'watching', label: 'Everyone’s Watching', show: watching.length > 0 },
      { id: 'worth', label: 'Worth the Wait', show: worth.length > 0 },
      { id: 'new', label: 'New on FLIX', show: newFlix.length > 0 },
      { id: 'top-tv', label: 'Top 10 TV Shows', show: topTv.length > 0 },
      { id: 'top-movies', label: 'Top 10 Movies', show: topMovies.length > 0 },
    ]
    return next.filter((entry) => entry.show)
  }, [coming.length, watching.length, worth.length, newFlix.length, topTv.length, topMovies.length])
  const activeChip = chip && chips.some((entry) => entry.id === chip) ? chip : (chips[0]?.id ?? 'coming')
  const [synopses, setSynopses] = useState<Record<string, string>>({})
  const feed = useMemo(
    () => uniqueById([...coming, ...watching, ...worth, ...newFlix, ...topTv, ...topMovies]),
    [coming, watching, worth, newFlix, topTv, topMovies],
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
      ['worth', worthRef.current],
      ['new', newRef.current],
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
  }, [coming.length, watching.length, worth.length, newFlix.length, topTv.length, topMovies.length])

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
          : next === 'worth'
            ? worthRef.current
            : next === 'new'
              ? newRef.current
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
      <h1 className="news-page-title">New &amp; Hot</h1>
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
          <h2 className="news-section-title">Coming Soon</h2>
          {coming.map((item, index) => (
            <FeedCard
              key={item.id}
              item={item}
              mode="soon"
              hideDate={index > 0 && comingDayKey(item.id) === comingDayKey(coming[index - 1].id)}
              synopsis={synopses[item.id]}
              onRemind={handleRemind}
            />
          ))}
        </section>
      ) : null}
      {watching.length ? (
        <section className="news-feed" ref={watchingRef} aria-label="Everyone’s Watching">
          <h2 className="news-section-title">Everyone’s Watching</h2>
          {watching.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              mode="watching"
              synopsis={synopses[item.id]}
            />
          ))}
        </section>
      ) : null}
      {worth.length ? (
        <section className="news-feed" ref={worthRef} aria-label="Worth the Wait">
          <h2 className="news-section-title">Worth the Wait</h2>
          {worth.map((item, index) => {
            const soon = isComingSoon(item)
            const prev = index > 0 ? worth[index - 1] : null
            const hideDate = Boolean(
              soon && prev && isComingSoon(prev) && comingDayKey(item.id) === comingDayKey(prev.id),
            )
            return (
              <FeedCard
                key={item.id}
                item={item}
                mode={soon ? 'soon' : 'watching'}
                hideDate={hideDate}
                synopsis={synopses[item.id]}
                onRemind={soon ? handleRemind : undefined}
              />
            )
          })}
        </section>
      ) : null}
      {newFlix.length ? (
        <section className="news-feed" ref={newRef} aria-label="New on FLIX">
          <h2 className="news-section-title">New on FLIX</h2>
          {newFlix.map((item) => (
            <FeedCard key={item.id} item={item} mode="watching" synopsis={synopses[item.id]} />
          ))}
        </section>
      ) : null}
      {topTv.length ? (
        <section className="news-feed" ref={topTvRef} aria-label="Top 10 TV Shows">
          <h2 className="news-section-title">Top 10 TV Shows</h2>
          {topTv.map((item, index) => (
            <FeedCard key={item.id} item={item} mode="ranked" rank={index + 1} synopsis={synopses[item.id]} />
          ))}
        </section>
      ) : null}
      {topMovies.length ? (
        <section className="news-feed" ref={topMoviesRef} aria-label="Top 10 Movies">
          <h2 className="news-section-title">Top 10 Movies</h2>
          {topMovies.map((item, index) => (
            <FeedCard key={item.id} item={item} mode="ranked" rank={index + 1} synopsis={synopses[item.id]} />
          ))}
        </section>
      ) : null}
    </main>
  )
}
