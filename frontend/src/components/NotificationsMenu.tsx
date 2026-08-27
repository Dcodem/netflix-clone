import { useEffect, useRef, useState } from 'react'
import { BellIcon } from './Icons'

export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  return (
    <div className={`notify-menu ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="notify-toggle"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon className="icon" />
      </button>
      {open ? (
        <div className="notify-dropdown" role="menu">
          <p>No recent notifications</p>
        </div>
      ) : null}
    </div>
  )
}
