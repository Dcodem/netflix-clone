import type { ProfileAvatar } from '../profiles/types'

export function AvatarArt({
  avatar,
  alt,
}: {
  avatar: Pick<ProfileAvatar, 'color' | 'glyph' | 'image' | 'label'>
  alt?: string
}) {
  if (avatar.image) {
    return <img src={avatar.image} alt={alt || avatar.label} />
  }
  return <span>{avatar.glyph}</span>
}
