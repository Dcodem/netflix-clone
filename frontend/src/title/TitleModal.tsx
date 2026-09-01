import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { comingLineFor, isComingSoon } from '../lib/comingSoon'
import { stillWatching } from '../lib/homeRows'
import { formatRuntime, genresOf, isShow, stillUrl, uniqueById } from '../lib/media'
import { audioTracksFor, subtitleTracksFor } from '../lib/languages'
import { matchPercent, maturityBlurb, maturityLabel, moodTags, isNewEpisodes, filterByMaturity } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { useProfiles } from '../profiles/ProfileContext'
import { rankByTaste, similarByGenres } from '../profiles/taste'
import { usesPersonalizedRecs } from '../profiles/types'
import { TrailerPreview, type TrailerHandle } from '../trailers/TrailerPreview'
import { useTmdbGallery } from '../trailers/useTmdbGallery'
import { useTmdbInfo } from '../trailers/useTmdbInfo'
import { useTmdbVideos } from '../trailers/useTmdbVideos'
import { presentCopy } from '../trailers/tmdbOverlay'
import type { TrailerHit } from '../trailers/types'
import { useTitleModal } from './TitleModalContext'
import { useWatch } from '../watch/WatchContext'

function isShowDetail(detail: MovieDetail): detail is ShowDetail {
  return isShow(detail)
}

export function TitleModal() {
  const { item, origin, closeTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const navigate = useNavigate()
  const { activeProfile } = useProfiles()
  const last = activeProfile?.history.find((entry) => entry.id === item?.id)
  const trailerRef = useRef<TrailerHandle>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragYRef = useRef(0)
  const [dragY, setDragY] = useState(0)
  const stills = useTmdbGallery(item)
  const clips = useTmdbVideos(item)
  const tmdbInfo = useTmdbInfo(item)
  const [muted, setMuted] = useState(true)
  const [clipHit, setClipHit] = useState<TrailerHit | null>(null)
  const [heroStill, setHeroStill] = useState<string | null>(null)
  const [trailerReady, setTrailerReady] = useState(false)
  const [trailerEnded, setTrailerEnded] = useState(false)
  const [settled, setSettled] = useState(false)
  const [tab, setTab] = useState<'episodes' | 'more' | 'trailers' | null>(null)
  const [seasonNumber, setSeasonNumber] = useState(1)
  const [trailerHover, setTrailerHover] = useState<number | null>(null)
  const [leaving, setLeaving] = useState(false)
  const leaveTimer = useRef(0)
  const leavingRef = useRef(false)

  useEffect(() => {
    setMuted(true)
    setTrailerReady(false)
    setTrailerEnded(false)
    setClipHit(null)
    setHeroStill(null)
    setSettled(false)
    setTab(null)
    setTrailerHover(null)
    setLeaving(false)
    leavingRef.current = false
    setSeasonNumber(last?.seasonNumber ?? 1)
    setDragY(0)
    dragYRef.current = 0
    dragStartY.current = null
    window.clearTimeout(leaveTimer.current)
  }, [item?.id, last?.seasonNumber])

  useEffect(() => () => window.clearTimeout(leaveTimer.current), [])

  const requestClose = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)
    window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => {
      leavingRef.current = false
      setLeaving(false)
      closeTitle()
    }, 280)
  }, [closeTitle])

  useEffect(() => {
    if (!item) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [item, requestClose])

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
    const rest = usesPersonalizedRecs(activeProfile)
      ? rankByTaste(
          pool.filter((entry) => !seen.has(entry.id)),
          activeProfile,
        )
      : pool.filter((entry) => !seen.has(entry.id))
    return uniqueById([...byGenre, ...rest]).slice(0, 12)
  }, [item, catalog.data, activeProfile])
  const similarSafe = useMemo(() => filterByMaturity(similar, activeProfile), [similar, activeProfile])
  const trailerCards = useMemo(() => {
    const labels = ['Trailer', 'Teaser', 'Clip', 'Recap', 'Featurette', 'Behind the Scenes', 'Clip 2', 'Bonus']
    const count = Math.max(clips.length, Math.min(8, stills.length))
    return Array.from({ length: count }, (_, index) => ({
      label: clips[index]?.label ?? labels[index] ?? `Clip ${index + 1}`,
      key: clips[index]?.key,
      still: stills[index] ?? stills[0],
    }))
  }, [clips, stills])

  if (!item) return null

  const fromTile = Boolean(origin && typeof window !== 'undefined' && window.innerWidth >= 768)
  const fromTileStyle = fromTile && origin
    ? ({
        '--modal-ox': `${origin.left + origin.width / 2 - Math.max(0, (window.innerWidth - Math.min(920, window.innerWidth - 24)) / 2)}px`,
        '--modal-oy': `${Math.max(24, origin.top + origin.height / 2 - 32)}px`,
        '--modal-from': String(Math.max(0.28, Math.min(0.86, origin.width / Math.min(920, window.innerWidth - 24)))),
      } as CSSProperties)
    : undefined

  const detail = detailFetch.data
  const seasons = detail && isShowDetail(detail) ? (detail.seasons ?? []) : []
  const resumeSeason =
    seasons.find((season) => season.season_number === last?.seasonNumber) ?? seasons[0]
  const resumeEpisode =
    resumeSeason?.episodes?.find(
      (episode) => episode.id === last?.episodeId || episode.number === last?.episodeNumber,
    ) ?? resumeSeason?.episodes?.[0]
  const copy = presentCopy(
    {
      synopsis: detail?.synopsis,
      runtime: detail?.runtime,
      year: item.year ?? detail?.year,
      genres: genresOf(detail ?? item),
    },
    tmdbInfo,
  )
  const match = matchPercent(item, activeProfile)
  const maturity = maturityLabel({ ...item, genres: copy.genres })
  const genres = copy.genres
  const moods = moodTags({ ...item, genres: copy.genres })
  const runtime = formatRuntime(copy.runtime)
  const watchHref = isShow(item)
    ? last?.watch_href || resumeEpisode?.watch_href || detail?.watch_href
    : detail?.watch_href
  const continueMode = Boolean(last && stillWatching(last))
  const soon = isComingSoon(item)
  const coming = comingLineFor(item)
  const activeTab = tab ?? (isShow(item) && !soon ? 'episodes' : 'more')

  function selectTab(next: 'episodes' | 'more' | 'trailers') {
    setTab(next)
    const tabs = modalRef.current?.querySelector('.title-tabs-row')
    if (tabs instanceof HTMLElement && modalRef.current) {
      modalRef.current.scrollTo({ top: Math.max(0, tabs.offsetTop - 8), behavior: 'smooth' })
    }
  }

  function playEpisode(episode: Episode, season: Season) {
    if (!detail || soon) return
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

  function onSheetPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.matchMedia('(min-width: 768px)').matches) return
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, [role="tab"]')) return
    const modal = modalRef.current
    const fromHandle = Boolean(target.closest('.title-modal-handle'))
    const top = modal?.getBoundingClientRect().top ?? 0
    const nearTop = event.clientY - top < 140 && (modal?.scrollTop ?? 0) < 8
    if (!fromHandle && !nearTop) return
    dragStartY.current = event.clientY
    dragYRef.current = 0
    setDragY(0)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onSheetPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartY.current == null) return
    const next = Math.max(0, event.clientY - dragStartY.current)
    dragYRef.current = next
    setDragY(next)
  }

  function onSheetPointerUp() {
    if (dragStartY.current == null) return
    const shouldClose = dragYRef.current > 80
    dragStartY.current = null
    dragYRef.current = 0
    if (shouldClose) {
      closeTitle()
      return
    }
    setDragY(0)
  }

  function goSearch(query: string) {
    playClick()
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  function goGenre(genre: string) {
    playClick()
    navigate(`/browse?genre=${encodeURIComponent(genre)}`)
  }

  function playTrailerClip(index: number) {
    playClick()
    const clip = clips[index]
    if (clip) {
      setClipHit({ source: 'tmdb', kind: 'youtube', src: clip.key, label: clip.label })
    }
    if (stills[index]) setHeroStill(stills[index])
    setMuted(false)
    setTrailerEnded(false)
    setTrailerReady(Boolean(clip) || trailerReady)
    trailerRef.current?.setMuted(false)
    if (!clip) trailerRef.current?.replay()
    modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className={`title-modal-backdrop ${leaving ? 'is-leaving' : ''}`}
      onClick={requestClose}
      role="presentation"
      ref={backdropRef}
    >
      <div
        className={`title-modal ${dragY ? 'is-dragging' : ''} ${fromTile ? 'is-from-tile' : ''} ${leaving ? 'is-leaving' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        ref={modalRef}
        style={dragY ? { transform: `translateY(${dragY}px)` } : fromTileStyle}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={onSheetPointerDown}
        onPointerMove={onSheetPointerMove}
        onPointerUp={onSheetPointerUp}
        onPointerCancel={onSheetPointerUp}
      >
        <span className="title-modal-handle" aria-hidden="true" />
        <button type="button" className="title-modal-close" onClick={requestClose} aria-label="Close">
          <CloseIcon className="icon" />
        </button>
        <div
          key={item.id}
          className={`title-modal-hero ${trailerPlaying ? 'is-playing' : 'is-cinematic'} ${settled ? 'is-settled' : ''}`}
        >
          <CatalogImage
            item={{ ...item, backdrop_url: heroStill || detail?.backdrop_url }}
            alt=""
            prefer="backdrop"
          />
          <TrailerPreview
            key={item.id}
            ref={trailerRef}
            title={item.title}
            year={item.year}
            kind={item.kind}
            tmdb_id={item.tmdb_id}
            className="title-modal-trailer"
            muted={muted}
            overrideHit={clipHit}
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
                {soon && coming ? <span className="jawbone-coming">{coming}</span> : <span className="match">{match}% Match</span>}
                {soon ? null : isNewEpisodes(item.id, item.kind) ? <span className="now-badge">New Episodes</span> : null}
                {copy.year ? <span>{copy.year}</span> : null}
                <span className="maturity">{maturity}</span>
                {soon ? null : isShow(item) && seasons.length ? (
                  <span>
                    {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
                  </span>
                ) : runtime ? (
                  <span>{runtime}</span>
                ) : null}
                {soon ? null : <FeatureBadges quality={item.quality || detail?.quality} />}
              </div>
              {copy.synopsis ? <p className="title-modal-syn">{copy.synopsis}</p> : null}
            </div>
            <div className="title-modal-split-side">
              {detail?.cast?.length ? (
                <p className="title-modal-cast">
                  <span className="title-kicker">Cast:</span>{' '}
                  {detail.cast.map((name, index) => (
                    <span key={name}>
                      {index ? ', ' : null}
                      <button type="button" className="title-link" onClick={() => goSearch(name)}>
                        {name}
                      </button>
                    </span>
                  ))}
                </p>
              ) : null}
              {genres.length ? (
                <p className="title-modal-cast">
                  <span className="title-kicker">Genres:</span>{' '}
                  {genres.map((genre, index) => (
                    <span key={genre}>
                      {index ? ', ' : null}
                      <button type="button" className="title-link" onClick={() => goGenre(genre)}>
                        {genre}
                      </button>
                    </span>
                  ))}
                </p>
              ) : null}
              {moods.length ? (
                <div className="title-modal-cast">
                  <span className="title-kicker">This {isShow(item) ? 'show' : 'movie'} is:</span>
                  <GenreDots genres={moods} className="title-moods" onSelect={goSearch} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="title-tabs-row">
            <nav className="title-tabs" aria-label="Title sections">
              {isShow(item) && !soon ? (
                <>
                  <button type="button" className={activeTab === 'episodes' ? 'is-on' : ''} onClick={() => selectTab('episodes')}>
                    Episodes
                  </button>
                  <button type="button" className={activeTab === 'more' ? 'is-on' : ''} onClick={() => selectTab('more')}>
                    More Like This
                  </button>
                  <button type="button" className={activeTab === 'trailers' ? 'is-on' : ''} onClick={() => selectTab('trailers')}>
                    Trailers & More
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
            {isShow(item) && !soon && activeTab === 'episodes' ? (
              <SeasonPicker seasons={seasons} history={last} value={seasonNumber} onChange={setSeasonNumber} />
            ) : null}
          </div>

          {isShow(item) && !soon && activeTab === 'episodes' ? (
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
              {trailerCards.length ? (
                <div className="trailer-card-grid">
                  {trailerCards.map((card, index) => {
                    const src = card.still ? stillUrl(card.still) : null
                    return (
                      <button
                        type="button"
                        className={`trailer-card ${clipHit?.src === card.key ? 'is-on' : ''} ${trailerHover === index ? 'is-hover' : ''}`}
                        key={`${card.label}-${card.still ?? card.key ?? index}`}
                        onClick={() => playTrailerClip(index)}
                        onMouseEnter={() => setTrailerHover(index)}
                        onMouseLeave={() => setTrailerHover((current) => (current === index ? null : current))}
                        aria-label={card.label}
                      >
                        <span className="trailer-card-art">
                          {src ? (
                            <img src={proxyImageUrl(src)} alt="" />
                          ) : (
                            <CatalogImage item={item} alt="" prefer="backdrop" />
                          )}
                          <span className="trailer-card-play" aria-hidden="true">
                            <PlayIcon className="icon" />
                          </span>
                        </span>
                        <span className="trailer-card-caption">{card.label}</span>
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
            {item.year ? (
              <p>
                <span className="title-kicker">Release year:</span> {item.year}
              </p>
            ) : null}
            {detail?.creators?.length ? (
              <p>
                <span className="title-kicker">Creators:</span>{' '}
                {detail.creators.map((name, index) => (
                  <span key={name}>
                    {index ? ', ' : null}
                    <button type="button" className="title-link" onClick={() => goSearch(name)}>
                      {name}
                    </button>
                  </span>
                ))}
              </p>
            ) : null}
            {detail?.director ? (
              <p>
                <span className="title-kicker">Director:</span>{' '}
                <button type="button" className="title-link" onClick={() => goSearch(detail.director!)}>
                  {detail.director}
                </button>
              </p>
            ) : null}
            {detail?.writers?.length ? (
              <p>
                <span className="title-kicker">Writers:</span>{' '}
                {detail.writers.map((name, index) => (
                  <span key={name}>
                    {index ? ', ' : null}
                    <button type="button" className="title-link" onClick={() => goSearch(name)}>
                      {name}
                    </button>
                  </span>
                ))}
              </p>
            ) : null}
            {detail?.cast?.length ? (
              <p>
                <span className="title-kicker">Cast:</span>{' '}
                {detail.cast.map((name, index) => (
                  <span key={name}>
                    {index ? ', ' : null}
                    <button type="button" className="title-link" onClick={() => goSearch(name)}>
                      {name}
                    </button>
                  </span>
                ))}
              </p>
            ) : null}
            {genres.length ? (
              <p>
                <span className="title-kicker">Genres:</span>{' '}
                {genres.map((genre, index) => (
                  <span key={genre}>
                    {index ? ', ' : null}
                    <button type="button" className="title-link" onClick={() => goGenre(genre)}>
                      {genre}
                    </button>
                  </span>
                ))}
              </p>
            ) : null}
            {moods.length ? (
              <div className="title-about-row">
                <span className="title-kicker">This {isShow(item) ? 'show' : 'movie'} is:</span>
                <GenreDots genres={moods} className="title-moods" onSelect={goSearch} />
              </div>
            ) : null}
            <p>
              <span className="title-kicker">Audio:</span> {audioTracksFor(item).join(', ')}
            </p>
            <p>
              <span className="title-kicker">Subtitles:</span> {subtitleTracksFor(item).join(', ')}
            </p>
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
