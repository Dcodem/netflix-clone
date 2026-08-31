export function ContinueMenu({
  onRemove,
  onDetails,
}: {
  onRemove: () => void
  onDetails?: () => void
}) {
  return (
    <div className="continue-menu" role="menu">
      <button
        type="button"
        role="menuitem"
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
