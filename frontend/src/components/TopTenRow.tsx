import type { MovieListItem } from '../api/types'
import { useRowOverflow } from '../hooks/useRowOverflow'
import { PosterCard } from './PosterCard'

export function TopTenRow({
  title,
  items,
}: {
  title: string
  items: MovieListItem[]
}) {
  const { ref, canPrev, canNext, scrollByPage } = useRowOverflow()
  const ranked = items.slice(0, 10)

  if (!ranked.length) return null

  return (
    <section className="media-row top-ten-row">
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
        <div className="row-scroller top-ten-scroller" ref={ref}>
          {ranked.map((item, index) => (
            <div className="top-ten-item" key={item.id}>
              <span className="top-ten-rank" aria-hidden="true">
                {index + 1}
              </span>
              <PosterCard item={item} />
            </div>
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
