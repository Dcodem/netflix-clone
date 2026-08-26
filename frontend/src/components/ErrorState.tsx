export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="state">
      <div className="empty-ico" aria-hidden="true">
        ⚠️
      </div>
      <p>{message}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
