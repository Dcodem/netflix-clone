export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{label}…</p>
    </div>
  )
}
