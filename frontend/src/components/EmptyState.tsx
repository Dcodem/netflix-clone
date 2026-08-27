export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="state">
      <p>{title}</p>
      {detail ? <p className="state-detail">{detail}</p> : null}
    </div>
  )
}
