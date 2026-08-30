import { useEffect, useRef, useState } from 'react'

type Listener = (note: string | null) => void
const listeners = new Set<Listener>()

export function notifyRemind(title: string, added: boolean) {
  const note = added ? `We’ll remind you when ${title} is ready to watch.` : null
  for (const listener of listeners) listener(note)
}

export function RemindToast() {
  const [note, setNote] = useState<string | null>(null)
  const timer = useRef(0)

  useEffect(() => {
    const onNote = (next: string | null) => {
      window.clearTimeout(timer.current)
      setNote(next)
      if (next) timer.current = window.setTimeout(() => setNote(null), 4200)
    }
    listeners.add(onNote)
    return () => {
      listeners.delete(onNote)
      window.clearTimeout(timer.current)
    }
  }, [])

  if (!note) return null
  return (
    <p className="news-remind-toast" role="status">
      {note}
    </p>
  )
}
