import type { MovieListItem } from '../api/types'
import { PosterCard } from './PosterCard'

export function MediaGrid({
  items,
  hoverable = true,
  progressById,
}: {
  items: MovieListItem[]
  hoverable?: boolean
  progressById?: Record<string, number>
}) {
  return (
    <div className="grid">
      {items.map((item) => (
        <PosterCard
          key={item.id}
          item={item}
          hoverable={hoverable}
          progress={progressById?.[item.id]}
        />
      ))}
    </div>
  )
}
