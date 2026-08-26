import type { MovieListItem } from '../api/types'
import { useRowOverflow } from '../hooks/useRowOverflow'
import { PosterCard } from './PosterCard'

export function MediaRow({
  title,
  items,
  progressById,
  continueMode = false,
}: {
  title: string
  items: MovieListItem[]
  progressById?: Record<string, number>
  continueMode?: boolean
}) {
  const { ref, canPrev, canNext, scrollByPage } = useRowOverflow()

  if (!items.length) return null

  return (
    <section className="media-row">
      <h2 className="section-title">{title}</h2>
      <div className="row-wrap">
        {canPrev ? (
          <button
            type="button"
            className="row-arrow row-arrow-prev"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollByPage(-1)}
          >
            ‹
          </button>
        ) : null}
        <div className="row-scroller" ref={ref}>
          {items.map((item) => (
            <PosterCard
              key={item.id}
              item={item}
              progress={progressById?.[item.id]}
              continueMode={continueMode}
            />
          ))}
        </div>
        {canNext ? (
          <button
            type="button"
            className="row-arrow row-arrow-next"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollByPage(1)}
          >
            ›
          </button>
        ) : null}
      </div>
    </section>
  )
}
