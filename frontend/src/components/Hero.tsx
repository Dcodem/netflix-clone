import { useEffect, useState } from 'react'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem } from '../api/types'
import { genresOf, isShow } from '../lib/media'
import { maturityLabel } from '../lib/netflix'
import { TrailerPreview } from '../trailers/TrailerPreview'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { MediaImage } from './MediaImage'

export function Hero({ item }: { item: MovieListItem }) {
  const { openWatch } = useWatch()
  const { openTitle } = useTitleModal()
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [muted, setMuted] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setTrailerReady(false)
    setMuted(true)
    const load = isShow(item) ? getShow(item.id) : getMovie(item.id)
    load
      .then((result) => {
        if (!cancelled) setDetail(result)
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [item])

  const backdrop = detail?.backdrop_url || item.poster_url
  const genres = genresOf(detail ?? item)
  const watchHref = isShow(item)
    ? (detail as { seasons?: { episodes?: { watch_href: string }[] }[] })?.seasons?.[0]?.episodes?.[0]?.watch_href ||
      detail?.watch_href
    : detail?.watch_href
  const maturity = maturityLabel(item)
  const synopsis = detail?.synopsis

  function onWatch() {
    if (!watchHref) return
    openWatch(watchHref, item.title, {
      id: item.id,
      kind: item.kind ?? 'movie',
      title: item.title,
      poster_url: item.poster_url ?? null,
      genres,
      watch_href: watchHref,
      runtime: detail?.runtime ?? null,
    })
  }

  return (
    <section className="hero">
      <MediaImage src={backdrop} alt="" className="hero-img" />
      <TrailerPreview
        title={item.title}
        year={item.year}
        kind={item.kind}
        className="hero-trailer"
        muted={muted}
        onReady={() => setTrailerReady(true)}
      />
      <div className="hero-body">
        <h1 className="hero-title">{item.title}</h1>
        <div className="hero-meta">
          {item.year ? <span>{item.year}</span> : null}
          <span className="maturity">{maturity}</span>
          {isShow(item) ? <span>Series</span> : null}
        </div>
        {synopsis ? <p className="hero-syn">{synopsis}</p> : null}
        {genres.length ? <div className="hero-genres">{genres.slice(0, 4).join(' · ')}</div> : null}
        <div className="hero-actions">
          <button type="button" className="btn btn-play" onClick={onWatch} disabled={!watchHref}>
            ▶ Play
          </button>
          <button type="button" className="btn btn-info" onClick={() => openTitle(item)}>
            ℹ More Info
          </button>
        </div>
      </div>
      {trailerReady ? (
        <button
          type="button"
          className="hero-mute"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? 'Unmute preview' : 'Mute preview'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      ) : null}
    </section>
  )
}
