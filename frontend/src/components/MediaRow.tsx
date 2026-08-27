import { Link } from 'react-router-dom'
import type { MovieListItem } from '../api/types'
import { useFineHover } from '../hooks/useFineHover'
import { useRowOverflow } from '../hooks/useRowOverflow'
import { playClick } from '../lib/sounds'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { PosterCard } from './PosterCard'

function exploreHref(title: string, items: MovieListItem[], seed?: MovieListItem) {
  if (seed?.title) return `/search?q=${encodeURIComponent(seed.title)}`
  if (title.length <= 18 && !/for |because|watch|pick|trend|list/i.test(title)) {
    return `/search?q=${encodeURIComponent(title)}`
  }
  const shows = items.filter((item) => item.kind === 'show').length
  return shows > items.length / 2 ? '/browse/shows' : '/browse/movies'
}

function SceneCard({ item }: { item: MovieListItem }) {
  const { openTitle } = useTitleModal()
  return (
    <div className="poster-wrap scene-wrap">
      <button
        type="button"
        className="poster-card scene-card"
        onClick={() => openTitle(item)}
        aria-label={`${item.title} scene`}
      >
        <div className="scene-art">
          <CatalogImage item={item} alt="" prefer="backdrop" className="scene-img" />
        </div>
        <div className="scene-caption">
          <span className="scene-kicker">You watched</span>
          <span className="scene-title">{item.title}</span>
        </div>
      </button>
    </div>
  )
}

export function MediaRow({
  title,
  subtitle,
  seed,
  items,
  progressById,
  continueMode = false,
  loop = false,
  hoverable = true,
  variant = 'default',
}: {
  title: string
  subtitle?: string
  seed?: MovieListItem
  items: MovieListItem[]
  progressById?: Record<string, number>
  continueMode?: boolean
  loop?: boolean
  hoverable?: boolean
  variant?: 'default' | 'continue' | 'top10'
}) {
  const fineHover = useFineHover()
  const ranked = variant === 'top10'
  const looping = loop && !seed && !ranked && items.length >= 8 && fineHover
  const { ref, canPrev, canNext, copies, scrollByPage, pageIndex, pageCount } = useRowOverflow(looping, items.length)

  if (!items.length) return null

  const slides = looping ? Array.from({ length: copies }, (_, copy) => copy) : [0]
  const visible = ranked ? items.slice(0, 10) : items

  return (
    <section className={`media-row ${seed ? 'has-scene' : ''} ${ranked ? 'is-top10' : ''}`}>
      <div className="row-heading">
        <h2 className="section-title">{title}</h2>
        {subtitle || continueMode || ranked ? null : (
          <Link className="row-explore" to={exploreHref(title, items, seed)}>
            Explore All
            <ChevronRightIcon className="icon" />
          </Link>
        )}
        {pageCount > 1 && !ranked ? (
          <div className="row-pages" aria-hidden="true">
            {Array.from({ length: pageCount }, (_, index) => (
              <span key={index} className={index === pageIndex ? 'is-on' : ''} />
            ))}
          </div>
        ) : null}
      </div>
      {subtitle ? <p className="section-sub row-sub">{subtitle}</p> : null}
      <div className="row-wrap">
        {canPrev ? (
          <button
            type="button"
            className="row-arrow row-arrow-prev"
            aria-label={`Scroll ${title} left`}
            onClick={() => {
              playClick()
              scrollByPage(-1)
            }}
          >
            <ChevronLeftIcon className="icon" />
          </button>
        ) : null}
        <div className={`row-scroller ${looping ? 'is-looping' : ''}`} ref={ref}>
          {seed ? <SceneCard item={seed} /> : null}
          {slides.flatMap((copy) =>
            visible.map((item, index) => (
              <PosterCard
                key={`${copy}-${item.id}`}
                item={item}
                progress={progressById?.[item.id]}
                continueMode={continueMode}
                hoverable={hoverable}
                rank={ranked ? index + 1 : undefined}
                layout={ranked ? 'poster' : 'landscape'}
              />
            )),
          )}
        </div>
        {canNext ? (
          <button
            type="button"
            className="row-arrow row-arrow-next"
            aria-label={`Scroll ${title} right`}
            onClick={() => {
              playClick()
              scrollByPage(1)
            }}
          >
            <ChevronRightIcon className="icon" />
          </button>
        ) : null}
      </div>
    </section>
  )
}
