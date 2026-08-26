import type { MovieListItem } from '../api/types'
import { PosterCard } from './PosterCard'

export function MediaRow({ title, items }: { title: string; items: MovieListItem[] }) {
  if (!items.length) return null

  return (
    <section className="media-row">
      <h2 className="section-title">{title}</h2>
      <div className="row-scroller">
        {items.map((item) => (
          <PosterCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
