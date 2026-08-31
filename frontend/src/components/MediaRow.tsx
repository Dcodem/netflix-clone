import { Link } from 'react-router-dom'
import type { MovieListItem } from '../api/types'
import { useFineHover } from '../hooks/useFineHover'
import { useRowOverflow } from '../hooks/useRowOverflow'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { PosterCard } from './PosterCard'

function exploreHref(items: MovieListItem[], seed?: MovieListItem, exploreTo?: string) {
  if (exploreTo) return exploreTo
  if (seed?.title) return `/search?q=${encodeURIComponent(seed.title)}`
  const shows = items.filter((item) => item.kind === 'show').length
  return shows > items.length / 2 ? '/browse/shows' : '/browse/movies'
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
  exploreTo,
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
  exploreTo?: string
}) {
  const fineHover = useFineHover()
  const ranked = variant === 'top10'
  const looping = loop && !seed && !ranked && items.length >= 8 && fineHover
  const { ref, canPrev, canNext, copies, scrollByPage } = useRowOverflow(looping, items.length)

  if (!items.length) return null

  const slides = looping ? Array.from({ length: copies }, (_, copy) => copy) : [0]
  const visible = ranked ? items.slice(0, 10) : items
  const canExplore = !subtitle && !continueMode && !ranked

  return (
    <section className={`media-row ${seed ? 'has-scene' : ''} ${ranked ? 'is-top10' : ''}`}>
      <div className="row-heading">
        {canExplore ? (
          <Link className="row-heading-link" to={exploreHref(items, seed, exploreTo)}>
            <h2 className="section-title">{title}</h2>
            <span className="row-explore">
              Explore All
              <ChevronRightIcon className="icon" />
            </span>
          </Link>
        ) : (
          <h2 className="section-title">{title}</h2>
        )}
      </div>
      {subtitle ? <p className="section-sub row-sub">{subtitle}</p> : null}
      <div className="row-wrap">
        {canPrev ? (
          <button
            type="button"
            className="row-arrow row-arrow-prev"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollByPage(-1)}
          >
            <ChevronLeftIcon className="icon" />
          </button>
        ) : null}
        <div className={`row-scroller ${looping ? 'is-looping' : ''}`} ref={ref}>
          {seed ? <PosterCard item={seed} hoverable={hoverable} scene /> : null}
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
            onClick={() => scrollByPage(1)}
          >
            <ChevronRightIcon className="icon" />
          </button>
        ) : null}
      </div>
    </section>
  )
}
