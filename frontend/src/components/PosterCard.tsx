import { Link } from 'react-router-dom'
import type { MovieListItem } from '../api/types'
import { detailPath, formatRating, isShow } from '../lib/media'
import { MediaImage } from './MediaImage'

export function PosterCard({ item }: { item: MovieListItem }) {
  const rating = formatRating(item.rating)

  return (
    <Link className="poster-card" to={detailPath(item)}>
      <div className="poster-art">
        <MediaImage src={item.poster_url} alt={item.title} />
        {isShow(item) ? <span className="cd-tag">SERIES</span> : null}
        {rating ? <span className="cd-rate">★ {rating}</span> : null}
      </div>
      <div className="cd-info">
        <div className="cd-title">{item.title}</div>
        {item.year ? <div className="cd-year">{item.year}</div> : null}
      </div>
    </Link>
  )
}
