import { useTmdbArt } from '../trailers/useTmdbArt'
import { MediaImage } from './MediaImage'

export function CatalogImage({
  item,
  alt,
  className,
  prefer = 'poster',
}: {
  item: {
    title: string
    year?: number | null
    kind?: string
    poster_url?: string | null
    backdrop_url?: string | null
  }
  alt: string
  className?: string
  prefer?: 'poster' | 'backdrop'
}) {
  const art = useTmdbArt(item)
  const fallback = prefer === 'backdrop' ? item.backdrop_url || item.poster_url : item.poster_url
  const tmdb = prefer === 'backdrop' ? art.backdrop || art.poster : art.poster || art.backdrop
  const src = tmdb || fallback
  return <MediaImage src={src} alt={alt || item.title} className={className} />
}
