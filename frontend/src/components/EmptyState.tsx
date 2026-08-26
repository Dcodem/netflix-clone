export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="state">
      <div className="empty-ico" aria-hidden="true">
        🎬
      </div>
      <p>{title}</p>
      {detail ? <p className="state-detail">{detail}</p> : null}
    </div>
  )
}
