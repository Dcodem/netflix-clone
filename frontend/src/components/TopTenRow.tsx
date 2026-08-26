import { useRef } from 'react'
import type { MovieListItem } from '../api/types'
import { PosterCard } from './PosterCard'

export function TopTenRow({
  title,
  items,
}: {
  title: string
  items: MovieListItem[]
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const ranked = items.slice(0, 10)

  if (!ranked.length) return null

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section className="media-row top-ten-row">
      <h2 className="section-title">{title}</h2>
      <div className="row-wrap">
        <button
          type="button"
          className="row-arrow row-arrow-prev"
          aria-label={`Scroll ${title} left`}
          onClick={() => scrollByPage(-1)}
        >
          ‹
        </button>
        <div className="row-scroller top-ten-scroller" ref={scrollerRef}>
          {ranked.map((item, index) => (
            <div className="top-ten-item" key={item.id}>
              <span className="top-ten-rank" aria-hidden="true">
                {index + 1}
              </span>
              <PosterCard item={item} />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="row-arrow row-arrow-next"
          aria-label={`Scroll ${title} right`}
          onClick={() => scrollByPage(1)}
        >
          ›
        </button>
      </div>
    </section>
  )
}
