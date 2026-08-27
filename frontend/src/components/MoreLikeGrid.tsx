import type { MovieListItem } from '../api/types'
import { genresOf } from '../lib/media'
import { matchPercent, maturityLabel, toLiked } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { CatalogImage } from './CatalogImage'
import { CheckIcon, PlusIcon } from './Icons'

export function MoreLikeGrid({ items }: { items: MovieListItem[] }) {
  const { openTitle } = useTitleModal()
  const { activeProfile, toggleMyList } = useProfiles()

  if (!items.length) return null

  return (
    <div className="more-like">
      <h2 className="section-title">More Like This</h2>
      <div className="more-like-grid">
        {items.slice(0, 9).map((item) => {
          const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
          const match = matchPercent(item, activeProfile)
          const genres = genresOf(item).slice(0, 3)
          return (
            <article key={item.id} className="more-like-card">
              <button type="button" className="more-like-art" onClick={() => openTitle(item)} aria-label={item.title}>
                <CatalogImage item={item} alt="" prefer="backdrop" />
              </button>
              <div className="more-like-body">
                <div className="more-like-meta">
                  <span className="match">{match}% Match</span>
                  {item.year ? <span>{item.year}</span> : null}
                  <span className="maturity">{maturityLabel(item)}</span>
                  <button
                    type="button"
                    className={`circle-btn ${onList ? 'is-on' : ''}`}
                    onClick={() => toggleMyList(toLiked(item))}
                    aria-label={onList ? 'Remove from My List' : 'Add to My List'}
                  >
                    {onList ? <CheckIcon className="icon" /> : <PlusIcon className="icon" />}
                  </button>
                </div>
                {genres.length ? <p className="more-like-genres">{genres.join(' · ')}</p> : null}
                <p className="more-like-syn">
                  {item.kind === 'show' ? 'TV show' : 'Film'}
                  {item.year ? ` · ${item.year}` : ''}
                  {genres.length ? ` · ${genres.slice(0, 2).join(', ')}` : ''}
                </p>
                <button type="button" className="more-like-title" onClick={() => openTitle(item)}>
                  {item.title}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
