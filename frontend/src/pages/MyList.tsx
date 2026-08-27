import { EmptyState } from '../components/EmptyState'
import { MediaGrid } from '../components/MediaGrid'
import { likedToItems } from '../lib/homeRows'
import { filterForProfile } from '../lib/netflix'
import { useProfiles } from '../profiles/ProfileContext'

export function MyList() {
  const { activeProfile } = useProfiles()
  const items = filterForProfile(likedToItems(activeProfile?.myList ?? []), activeProfile)

  return (
    <main className="page page-pad my-list-page">
      <h1 className="section-title">My List</h1>
      {items.length ? (
        <MediaGrid items={items} />
      ) : (
        <EmptyState
          title="You haven't added any titles to your list yet"
          detail="Add titles from a hover preview or More Info to watch them later."
        />
      )}
    </main>
  )
}
