import type { MovieListItem } from '../api/types'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'

export function SearchHitsList({
  items,
  ranked = false,
}: {
  items: MovieListItem[]
  ranked?: boolean
}) {
  const { openTitle } = useTitleModal()

  return (
    <ul className={`search-top ${ranked ? 'is-ranked' : ''}`}>
      {items.map((item, index) => (
        <li key={item.id}>
          <button type="button" className="search-top-hit" onClick={() => openTitle(item)} aria-label={item.title}>
            {ranked ? <span className="search-top-rank">{index + 1}</span> : null}
            <span className="search-top-still">
              <CatalogImage item={item} alt="" prefer="backdrop" />
            </span>
            <span className="search-top-title">{item.title}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
