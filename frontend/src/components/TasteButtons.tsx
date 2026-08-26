import type { LikedTitle } from '../profiles/types'
import { useProfiles } from '../profiles/ProfileContext'

export function TasteButtons({ item }: { item: LikedTitle }) {
  const { activeProfile, rateTitle } = useProfiles()
  const liked = activeProfile?.liked.some((entry) => entry.id === item.id) ?? false
  const disliked = activeProfile?.dislikedIds.includes(item.id) ?? false

  return (
    <div className="taste-actions">
      <button
        type="button"
        className={`btn btn-ghost ${liked ? 'is-on' : ''}`}
        onClick={() => rateTitle(item, liked ? null : 'up')}
      >
        {liked ? 'Liked' : 'Like'}
      </button>
      <button
        type="button"
        className={`btn btn-ghost ${disliked ? 'is-on' : ''}`}
        onClick={() => rateTitle(item, disliked ? null : 'down')}
      >
        {disliked ? 'Not for me' : 'Not for me'}
      </button>
    </div>
  )
}
