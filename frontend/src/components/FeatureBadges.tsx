import { qualityBadge } from '../lib/netflix'

export function FeatureBadges({
  quality,
  compact = false,
}: {
  quality?: string | null
  compact?: boolean
}) {
  const hd = qualityBadge(quality)
  return (
    <span className="spec-badges">
      {hd ? <span className="spec-badge">{hd}</span> : null}
      {compact ? null : (
        <>
          <span className="spec-badge">5.1</span>
          <span className="spec-badge">AD</span>
          <span className="spec-badge">CC</span>
        </>
      )}
    </span>
  )
}
