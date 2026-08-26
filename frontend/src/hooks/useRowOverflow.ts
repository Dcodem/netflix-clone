import { useEffect, useRef, useState } from 'react'
import { useFineHover } from './useFineHover'

export function useRowOverflow() {
  const fineHover = useFineHover()
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      setCanPrev(el.scrollLeft > 12)
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 12)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  const scrollByPage = (direction: -1 | 1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return {
    ref,
    canPrev: fineHover && canPrev,
    canNext: fineHover && canNext,
    scrollByPage,
  }
}
