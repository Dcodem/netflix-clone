import { useRef } from 'react'
import type { MovieListItem } from '../api/types'
import { PosterCard } from './PosterCard'

export function MediaRow({
  title,
  items,
  progressById,
}: {
  title: string
  items: MovieListItem[]
  progressById?: Record<string, number>
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (!items.length) return null

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section className="media-row">
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
        <div className="row-scroller" ref={scrollerRef}>
          {items.map((item) => (
            <PosterCard key={item.id} item={item} progress={progressById?.[item.id]} />
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
