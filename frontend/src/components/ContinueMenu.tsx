import { useState } from 'react'

export function ContinueMenu({
  onRemove,
  onDetails,
}: {
  onRemove: () => void
  onDetails?: () => void
}) {
  const [hover, setHover] = useState<'remove' | 'info' | null>(null)
  return (
    <div className="continue-menu" role="menu">
      <button
        type="button"
        role="menuitem"
        className={hover === 'remove' ? 'is-hover' : ''}
        onMouseEnter={() => setHover('remove')}
        onMouseLeave={() => setHover((current) => (current === 'remove' ? null : current))}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onRemove()
        }}
      >
        Remove from Continue Watching
      </button>
      {onDetails ? (
        <button
          type="button"
          role="menuitem"
          className={hover === 'info' ? 'is-hover' : ''}
          onMouseEnter={() => setHover('info')}
          onMouseLeave={() => setHover((current) => (current === 'info' ? null : current))}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onDetails()
          }}
        >
          More Info
        </button>
      ) : null}
    </div>
  )
}
