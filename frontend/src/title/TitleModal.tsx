import { useEffect, useMemo, useRef, useState } from 'react'
import { getCatalogMany, getMovie, getShow, proxyImageUrl } from '../api/client'
import type { Episode, MovieDetail, MovieListItem, Season, ShowDetail } from '../api/types'
import { CatalogImage } from '../components/CatalogImage'
import { EpisodeList, SeasonPicker } from '../components/EpisodeList'
import { ErrorState } from '../components/ErrorState'
import { CloseIcon, PlayIcon, RestartIcon, SpeakerIcon } from '../components/Icons'
import { TitleLogo } from '../components/TitleLogo'
import { MoreLikeGrid } from '../components/MoreLikeGrid'
import { Spinner } from '../components/Spinner'
import { TitleActions } from '../components/TitleActions'
import { FeatureBadges } from '../components/FeatureBadges'
import { GenreDots } from '../components/GenreDots'
import { useFetch } from '../hooks/useFetch'
import { watchForEpisode } from '../lib/episodeProgress'
import { formatRuntime, genresOf, isShow, stillUrl, uniqueById } from '../lib/media'
import { matchPercent, maturityBlurb, maturityLabel, moodTags, isNewEpisodes, filterByMaturity } from '../lib/netflix'
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
  const modalRef = useRef<HTMLDivElement>(null)
  const stills = useTmdbGallery(item)
  const [muted, setMuted] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)
  const [trailerEnded, setTrailerEnded] = useState(false)
  const [settled, setSettled] = useState(false)
  const [tab, setTab] = useState<'episodes' | 'more' | 'trailers' | null>(null)
  const [seasonNumber, setSeasonNumber] = useState(1)

  useEffect(() => {
    setMuted(true)
    setTrailerReady(false)
    setTrailerEnded(false)
    setSettled(false)
    setTab(null)
    setSeasonNumber(last?.seasonNumber ?? 1)
  }, [item?.id, last?.seasonNumber])

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

  const trailerPlaying = trailerReady && !trailerEnded
  useEffect(() => {
    if (!item) return
    setSettled(false)
    const timer = window.setTimeout(() => setSettled(true), 6000)
    return () => window.clearTimeout(timer)
  }, [item?.id])

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
    const pool = catalog.data
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
  const similarSafe = useMemo(() => filterByMaturity(similar, activeProfile), [similar, activeProfile])

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
  const watchHref = isShow(item)
    ? last?.watch_href || resumeEpisode?.watch_href || detail?.watch_href
    : detail?.watch_href
  const continueMode = Boolean(last?.progress && last.progress > 0.05)
  const activeTab = tab ?? (isShow(item) ? 'episodes' : 'more')

  function selectTab(next: 'episodes' | 'more' | 'trailers') {
    setTab(next)
    const tabs = modalRef.current?.querySelector('.title-tabs-row')
    if (tabs instanceof HTMLElement && modalRef.current) {
      modalRef.current.scrollTo({ top: Math.max(0, tabs.offsetTop - 8), behavior: 'smooth' })
    }
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

  function replayTrailer() {
    setTrailerEnded(false)
    setTrailerReady(true)
    trailerRef.current?.replay()
  }

  function playTrailerClip() {
    playClick()
    setMuted(false)
    setTrailerEnded(false)
    setTrailerReady(true)
    trailerRef.current?.setMuted(false)
    trailerRef.current?.replay()
    modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="title-modal-backdrop" onClick={closeTitle} role="presentation" ref={backdropRef}>
      <div
        className="title-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="title-modal-handle" aria-hidden="true" />
        <button type="button" className="title-modal-close" onClick={closeTitle} aria-label="Close">
          <CloseIcon className="icon" />
        </button>
        <div
          key={item.id}
          className={`title-modal-hero ${trailerPlaying ? 'is-playing' : 'is-cinematic'} ${settled ? 'is-settled' : ''}`}
        >
          <CatalogImage item={{ ...item, backdrop_url: detail?.backdrop_url }} alt="" prefer="backdrop" />
          <TrailerPreview
            ref={trailerRef}
            title={item.title}
            year={item.year}
            kind={item.kind}
            className="title-modal-trailer"
            muted={muted}
            onReady={() => {
              setTrailerEnded(false)
              setTrailerReady(true)
            }}
            onEnded={() => setTrailerEnded(true)}
          />
          <div className="title-modal-hero-body">
            <TitleLogo item={item} className="title-modal-logo" titleClassName="title-modal-title" />
            <div className="title-modal-desktop-actions">
              <TitleActions
                item={item}
                detail={detail}
                watchHref={watchHref}
                size="sm"
                showMore={false}
                continueMode={continueMode}
                playStyle="labeled"
              />
            </div>
          </div>
          <div className="hero-controls-right">
            {trailerEnded ? (
              <button type="button" className="hero-mute" onClick={replayTrailer} aria-label="Replay">
                <RestartIcon className="icon" />
              </button>
            ) : (
              <button
                type="button"
                className="hero-mute"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute preview' : 'Mute preview'}
              >
                <SpeakerIcon muted={muted} className="icon" />
              </button>
            )}
            <span className="maturity-flag">{maturity}</span>
          </div>
        </div>
        <div className="title-modal-main">
          <div className="title-modal-phone-actions">
            <TitleActions
              item={item}
              detail={detail}
              watchHref={watchHref}
              size="sm"
              showMore={false}
              continueMode={continueMode}
              playStyle="labeled"
              layout="sheet"
            />
          </div>
          {detailFetch.loading && !detail ? (
            <div className="title-modal-loading">
              <Spinner label="Loading" />
            </div>
          ) : null}
          {detailFetch.error ? <ErrorState message={detailFetch.error} onRetry={detailFetch.retry} /> : null}
          <div className="title-modal-split">
            <div className="title-modal-split-main">
              <div className="jawbone-meta">
                <span className="match">{match}% Match</span>
                {isNewEpisodes(item.id, item.kind) ? <span className="now-badge">New Episodes</span> : null}
                {item.year ? <span>{item.year}</span> : null}
                <span className="maturity">{maturity}</span>
                {runtime ? <span>{runtime}</span> : null}
                {isShow(item) && seasons.length ? (
                  <span>
                    {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
                  </span>
                ) : null}
                <FeatureBadges quality={item.quality || detail?.quality} />
              </div>
              {detail?.synopsis ? <p className="title-modal-syn">{detail.synopsis}</p> : null}
            </div>
            <div className="title-modal-split-side">
              {detail?.cast?.length ? (
                <p className="title-modal-cast">
                  <span className="title-kicker">Cast:</span> {detail.cast.join(', ')}
                </p>
              ) : null}
              {genres.length ? (
                <p className="title-modal-cast">
                  <span className="title-kicker">Genres:</span> {genres.join(', ')}
                </p>
              ) : null}
              {moods.length ? (
                <div className="title-modal-cast">
                  <span className="title-kicker">This {isShow(item) ? 'show' : 'movie'} is:</span>
                  <GenreDots genres={moods} className="title-moods" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="title-tabs-row">
            <nav className="title-tabs" aria-label="Title sections">
              {isShow(item) ? (
                <>
                  <button type="button" className={activeTab === 'episodes' ? 'is-on' : ''} onClick={() => selectTab('episodes')}>
                    Episodes
                  </button>
                  <button type="button" className={activeTab === 'trailers' ? 'is-on' : ''} onClick={() => selectTab('trailers')}>
                    Trailers & More
                  </button>
                  <button type="button" className={activeTab === 'more' ? 'is-on' : ''} onClick={() => selectTab('more')}>
                    More Like This
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className={activeTab === 'more' ? 'is-on' : ''} onClick={() => selectTab('more')}>
                    More Like This
                  </button>
                  <button type="button" className={activeTab === 'trailers' ? 'is-on' : ''} onClick={() => selectTab('trailers')}>
                    Trailers & More
                  </button>
                </>
              )}
            </nav>
            {isShow(item) && activeTab === 'episodes' ? (
              <SeasonPicker seasons={seasons} history={last} value={seasonNumber} onChange={setSeasonNumber} />
            ) : null}
          </div>

          {isShow(item) && activeTab === 'episodes' ? (
            <div className="title-section">
              <EpisodeList
                seasons={seasons}
                history={last}
                stills={stills}
                onPlay={playEpisode}
                seasonNumber={seasonNumber}
                onSeasonNumber={setSeasonNumber}
                hideHeader
              />
            </div>
          ) : null}

          {activeTab === 'more' ? (
            <div className="title-section">
              <MoreLikeGrid items={similarSafe} />
            </div>
          ) : null}

          {activeTab === 'trailers' ? (
            <section className="title-trailers title-section">
              {stills.length ? (
                <div className="trailer-card-grid">
                  {stills.slice(0, 8).map((file, index) => {
                    const src = stillUrl(file)
                    if (!src) return null
                    const captions = [
                      `Trailer: ${item.title}`,
                      `Teaser: ${item.title}`,
                      'Clip 1',
                      'Recap',
                      'Featurette',
                      'Clip 2',
                      'Clip 3',
                      'Bonus clip',
                    ]
                    const caption = captions[index] ?? `Clip ${index}`
                    return (
                      <button
                        type="button"
                        className="trailer-card"
                        key={file}
                        onClick={playTrailerClip}
                        aria-label={caption}
                      >
                        <span className="trailer-card-art">
                          <img src={proxyImageUrl(src)} alt="" />
                          <span className="trailer-card-play" aria-hidden="true">
                            <PlayIcon className="icon" />
                          </span>
                        </span>
                        <span className="trailer-card-caption">{caption}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="state">No trailers available.</p>
              )}
            </section>
          ) : null}

          <section className="title-about title-section">
            <h2>About {item.title}</h2>
            {detail?.cast?.length ? (
              <p>
                <span className="title-kicker">Cast:</span> {detail.cast.join(', ')}
              </p>
            ) : null}
            {genres.length ? (
              <p>
                <span className="title-kicker">Genres:</span> {genres.join(', ')}
              </p>
            ) : null}
            {moods.length ? (
              <div className="title-about-row">
                <span className="title-kicker">This {isShow(item) ? 'show' : 'movie'} is:</span>
                <GenreDots genres={moods} className="title-moods" />
              </div>
            ) : null}
            <div className="title-about-maturity">
              <span className="title-kicker">Maturity rating:</span>
              <p>
                <span className="maturity">{maturity}</span>
                {maturityBlurb(maturity)}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
