import { qualityBadge } from '../lib/netflix'

export function FeatureBadges({ quality }: { quality?: string | null }) {
  const hd = qualityBadge(quality)
  return (
    <span className="spec-badges">
      {hd ? <span className="spec-badge">{hd}</span> : null}
      <span className="spec-badge">5.1</span>
      <span className="spec-badge">AD</span>
      <span className="spec-badge">CC</span>
    </span>
  )
}
