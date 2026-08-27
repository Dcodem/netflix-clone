import type { MovieListItem } from '../api/types'
import { PosterCard } from './PosterCard'

export function MediaGrid({
  items,
  hoverable = true,
  progressById,
  layout = 'landscape',
}: {
  items: MovieListItem[]
  hoverable?: boolean
  progressById?: Record<string, number>
  layout?: 'landscape' | 'poster'
}) {
  return (
    <div className={`grid ${layout === 'poster' ? 'is-poster-grid' : ''}`}>
      {items.map((item) => (
        <PosterCard
          key={item.id}
          item={item}
          hoverable={hoverable}
          progress={progressById?.[item.id]}
          layout={layout}
        />
      ))}
    </div>
  )
}
