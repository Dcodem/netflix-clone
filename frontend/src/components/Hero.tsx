import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMovie, getShow } from '../api/client'
import type { MovieDetail, MovieListItem } from '../api/types'
import { detailPath, formatRating, genresOf, isShow } from '../lib/media'
import { TrailerPreview } from '../trailers/TrailerPreview'
import { useWatch } from '../watch/WatchContext'
import { MediaImage } from './MediaImage'
import { TasteButtons } from './TasteButtons'

export function Hero({ item }: { item: MovieListItem }) {
  const { openWatch } = useWatch()
  const [detail, setDetail] = useState<MovieDetail | null>(null)

  useEffect(() => {
    let cancelled = false
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
  const rating = formatRating(detail?.rating ?? item.rating)
  const genres = genresOf(detail ?? item)
  const watchHref = detail?.watch_href

  function onWatch() {
    if (!watchHref) return
    openWatch(watchHref, item.title, {
      id: item.id,
      kind: item.kind ?? 'movie',
      title: item.title,
      poster_url: item.poster_url ?? null,
      genres,
      watch_href: watchHref,
    })
  }

  return (
    <section className="hero">
      <MediaImage src={backdrop} alt="" className="hero-img" />
      <TrailerPreview title={item.title} year={item.year} kind={item.kind} className="hero-trailer" />
      <div className="hero-body">
        <h1 className="hero-title">{item.title}</h1>
        <div className="hero-meta">
          {item.year ? <span>{item.year}</span> : null}
          {rating ? <span>★ {rating}</span> : null}
          {item.quality ? <span>{item.quality}</span> : null}
          {isShow(item) ? <span>Series</span> : null}
        </div>
        {genres.length ? <div className="hero-genres">{genres.join(' · ')}</div> : null}
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={onWatch} disabled={!watchHref}>
            ▶ Watch
          </button>
          <Link className="btn btn-ghost" to={detailPath(item)}>
            More info
          </Link>
          <TasteButtons
            item={{
              id: item.id,
              kind: item.kind ?? 'movie',
              title: item.title,
              poster_url: item.poster_url ?? null,
              genres,
            }}
          />
        </div>
      </div>
    </section>
  )
}
