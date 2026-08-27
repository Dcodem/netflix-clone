import { useEffect, useMemo, useRef, useState } from 'react'
import { getCatalogMany, getMovie, getShow } from '../api/client'
import type { Episode, MovieDetail, MovieListItem, Season, ShowDetail } from '../api/types'
import { CatalogImage } from '../components/CatalogImage'
import { EpisodeList } from '../components/EpisodeList'
import { ErrorState } from '../components/ErrorState'
import { CloseIcon, SpeakerIcon } from '../components/Icons'
import { MoreLikeGrid } from '../components/MoreLikeGrid'
import { Spinner } from '../components/Spinner'
import { TitleActions } from '../components/TitleActions'
import { useFetch } from '../hooks/useFetch'
import { watchForEpisode } from '../lib/episodeProgress'
import { formatRuntime, genresOf, isShow, uniqueById } from '../lib/media'
import { filterForProfile, isKidsSafe, matchPercent, maturityLabel, moodTags, qualityBadge } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { useProfiles } from '../profiles/ProfileContext'
import { rankByTaste, similarByGenres } from '../profiles/taste'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTmdbGallery } from '../trailers/useTmdbGallery'
import { useTitleModal } from './TitleModalContext'
import { useWatch } from '../watch/WatchContext'

function isShowDetail(detail: MovieDetail): detail is ShowDetail {
  return isShow(detail)
}

export function TitleModal() {
  const { item, closeTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const { activeProfile } = useProfiles()
  const last = activeProfile?.history.find((entry) => entry.id === item?.id)
  const trailerRef = useRef<TrailerHandle>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const episodesRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const jumpingRef = useRef(false)
  const stills = useTmdbGallery(item)
  const [muted, setMuted] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)
  const [tab, setTab] = useState<'episodes' | 'more' | 'about' | null>(null)

  useEffect(() => {
    setMuted(true)
    setTrailerReady(false)
    setTab(null)
  }, [item?.id])

  useEffect(() => {
    if (!item) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTitle()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [item, closeTitle])

  const detailFetch = useFetch(
    () => (item ? (isShow(item) ? getShow(item.id) : getMovie(item.id)) : Promise.resolve(null)),
    item ? `modal-${item.id}` : 'modal-none',
    { enabled: Boolean(item) },
  )
  const catalog = useFetch(async () => {
    const [movies, shows] = await Promise.all([
      getCatalogMany('movies', 3).catch(() => [] as MovieListItem[]),
      getCatalogMany('shows', 3).catch(() => [] as MovieListItem[]),
    ])
    return uniqueById([...movies, ...shows])
  }, 'modal-similar', { enabled: Boolean(item) })

  const similar = useMemo(() => {
    if (!item || !catalog.data) return []
    const pool = filterForProfile(catalog.data, activeProfile)
    const byGenre = similarByGenres(item, pool, 12)
    if (byGenre.length >= 12) return byGenre
    const seen = new Set([item.id, ...byGenre.map((entry) => entry.id)])
    const rest = activeProfile
      ? rankByTaste(
          pool.filter((entry) => !seen.has(entry.id)),
          activeProfile,
        )
      : pool.filter((entry) => !seen.has(entry.id))
    return uniqueById([...byGenre, ...rest]).slice(0, 12)
  }, [item, catalog.data, activeProfile])

  useEffect(() => {
    if (item && activeProfile?.kids && !isKidsSafe(item)) closeTitle()
  }, [item, activeProfile?.kids, closeTitle])

  useEffect(() => {
    if (!item) return
    const root = backdropRef.current
    const targets = [episodesRef.current, moreRef.current, aboutRef.current].filter(Boolean) as HTMLElement[]
    if (!root || !targets.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumpingRef.current) return
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!hit) return
        if (hit.target === episodesRef.current) setTab('episodes')
        else if (hit.target === moreRef.current) setTab('more')
        else if (hit.target === aboutRef.current) setTab('about')
      },
      { root, threshold: [0.18, 0.4, 0.65], rootMargin: '-64px 0px -42% 0px' },
    )
    targets.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [item, similar.length, detailFetch.data])

  if (!item) return null

  const detail = detailFetch.data
  const seasons = detail && isShowDetail(detail) ? (detail.seasons ?? []) : []
  const resumeSeason =
    seasons.find((season) => season.season_number === last?.seasonNumber) ?? seasons[0]
  const resumeEpisode =
    resumeSeason?.episodes?.find(
      (episode) => episode.id === last?.episodeId || episode.number === last?.episodeNumber,
    ) ?? resumeSeason?.episodes?.[0]
  const match = matchPercent(item, activeProfile)
  const maturity = maturityLabel(item)
  const genres = genresOf(detail ?? item)
  const moods = moodTags(detail ?? item)
  const runtime = formatRuntime(detail?.runtime)
  const quality = qualityBadge(item.quality || detail?.quality)
  const watchHref = isShow(item)
    ? last?.watch_href || resumeEpisode?.watch_href || detail?.watch_href
    : detail?.watch_href
  const continueMode = Boolean(last?.progress && last.progress > 0.05)
  const activeTab = tab ?? (isShow(item) ? 'episodes' : 'more')

  function jump(next: 'episodes' | 'more' | 'about') {
    setTab(next)
    jumpingRef.current = true
    const node = next === 'episodes' ? episodesRef.current : next === 'more' ? moreRef.current : aboutRef.current
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      jumpingRef.current = false
    }, 650)
  }

  function playEpisode(episode: Episode, season: Season) {
    if (!detail) return
    playClick()
    const watch = watchForEpisode(last, season.season_number, episode)
    closeTitle()
    openWatch(episode.watch_href, `${detail.title} · S${season.season_number}E${episode.number}`, {
      id: detail.id,
      kind: 'show',
      title: detail.title,
      year: detail.year,
      poster_url: detail.poster_url ?? null,
      genres,
      watch_href: episode.watch_href,
      runtime: episode.duration ?? detail.runtime ?? null,
      progress: watch?.progress,
      seasonNumber: season.season_number,
      episodeNumber: episode.number,
      episodeId: episode.id,
    })
  }

  function toggleMute() {
    const next = !muted
    trailerRef.current?.setMuted(next)
    setMuted(next)
  }

  return (
    <div className="title-modal-backdrop" onClick={closeTitle} role="presentation" ref={backdropRef}>
      <div
        className="title-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="title-modal-close" onClick={closeTitle} aria-label="Close">
          <CloseIcon className="icon" />
        </button>
        <div className={`title-modal-hero ${trailerReady ? 'is-playing' : ''}`}>
          <CatalogImage item={{ ...item, backdrop_url: detail?.backdrop_url }} alt="" prefer="backdrop" />
          <TrailerPreview
            ref={trailerRef}
            title={item.title}
            year={item.year}
            kind={item.kind}
            className="title-modal-trailer"
            muted={muted}
            onReady={() => setTrailerReady(true)}
          />
          <div className="title-modal-hero-body">
            <h1>{item.title}</h1>
            <TitleActions
              item={item}
              detail={detail}
              watchHref={watchHref}
              showMore={false}
              continueMode={continueMode}
              playStyle="labeled"
            />
          </div>
          <div className="hero-controls-right">
            <button
              type="button"
              className="hero-mute"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute preview' : 'Mute preview'}
            >
              <SpeakerIcon muted={muted} className="icon" />
            </button>
            <span className="maturity-flag">{maturity}</span>
          </div>
        </div>
        <div className="title-modal-main">
          {detailFetch.loading && !detail ? <Spinner label="Loading" /> : null}
          {detailFetch.error ? <ErrorState message={detailFetch.error} onRetry={detailFetch.retry} /> : null}
          <div className="title-modal-split">
            <div className="title-modal-split-main">
              <div className="jawbone-meta">
                <span className="match">{match}% Match</span>
                {item.year ? <span>{item.year}</span> : null}
                <span className="maturity">{maturity}</span>
                {runtime ? <span>{runtime}</span> : null}
                {isShow(item) && seasons.length ? (
                  <span>
                    {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
                  </span>
                ) : null}
                {quality ? <span className="quality-badge">{quality}</span> : null}
              </div>
              {detail?.synopsis ? <p className="title-modal-syn">{detail.synopsis}</p> : null}
            </div>
            <div className="title-modal-split-side">
              {detail?.cast?.length ? (
                <p className="title-modal-cast">
                  <span>Cast:</span> {detail.cast.join(', ')}
                </p>
              ) : null}
              {genres.length ? (
                <p className="title-modal-cast">
                  <span>Genres:</span> {genres.join(', ')}
                </p>
              ) : null}
              {moods.length ? (
                <p className="title-modal-cast">
                  <span>This {isShow(item) ? 'show' : 'movie'} is:</span> {moods.join(', ')}
                </p>
              ) : null}
            </div>
          </div>

          <nav className="title-tabs" aria-label="Title sections">
            {seasons.length ? (
              <button type="button" className={activeTab === 'episodes' ? 'is-on' : ''} onClick={() => jump('episodes')}>
                Episodes
              </button>
            ) : null}
            {similar.length ? (
              <button type="button" className={activeTab === 'more' ? 'is-on' : ''} onClick={() => jump('more')}>
                More Like This
              </button>
            ) : null}
            <button type="button" className={activeTab === 'about' ? 'is-on' : ''} onClick={() => jump('about')}>
              About
            </button>
          </nav>

          {seasons.length ? (
            <div ref={episodesRef} className="title-section">
              <EpisodeList seasons={seasons} history={last} stills={stills} onPlay={playEpisode} />
            </div>
          ) : null}

          {similar.length ? (
            <div ref={moreRef} className="title-section">
              <MoreLikeGrid items={similar} />
            </div>
          ) : null}

          <section ref={aboutRef} className="title-about title-section">
            <h2>About {item.title}</h2>
            {detail?.synopsis ? <p>{detail.synopsis}</p> : null}
            {detail?.cast?.length ? (
              <p>
                <span>Cast:</span> {detail.cast.join(', ')}
              </p>
            ) : null}
            {genres.length ? (
              <p>
                <span>Genres:</span> {genres.join(', ')}
              </p>
            ) : null}
            {moods.length ? (
              <p>
                <span>This {isShow(item) ? 'show' : 'movie'} is:</span> {moods.join(', ')}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
