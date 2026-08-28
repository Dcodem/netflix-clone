import { useEffect, useRef, useState } from 'react'
import { useFineHover } from './useFineHover'

export function useHoverMenu() {
  const fine = useFineHover()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function onEnter() {
    if (!fine) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), 160)
  }

  function onLeave() {
    if (!fine) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(false), 280)
  }

  function toggle() {
    setOpen((value) => !value)
  }

  return { open, setOpen, rootRef, onEnter, onLeave, toggle, fine }
}
