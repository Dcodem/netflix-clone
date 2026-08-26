import type { MovieListItem } from '../api/types'
import { PosterCard } from './PosterCard'

export function MediaGrid({ items }: { items: MovieListItem[] }) {
  return (
    <div className="grid">
      {items.map((item) => (
        <PosterCard key={item.id} item={item} />
      ))}
    </div>
  )
}
