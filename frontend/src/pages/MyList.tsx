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
          title="Your list is empty"
          detail="Add titles from the hover preview or More Info modal."
        />
      )}
    </main>
  )
}
