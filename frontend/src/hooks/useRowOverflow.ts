import { useEffect, useRef, useState } from 'react'
import { useFineHover } from './useFineHover'

export function useRowOverflow(loop = false, itemCount = 0) {
  const fineHover = useFineHover()
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const copies = loop ? 2 : 1

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      if (loop && copies > 1) {
        const width = el.scrollWidth / copies
        if (width < el.clientWidth + 8) {
          setCanPrev(false)
          setCanNext(false)
          return
        }
        if (el.scrollLeft >= width) el.scrollLeft -= width
        setCanPrev(true)
        setCanNext(true)
        return
      }
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
  }, [loop, copies, itemCount])

  const scrollByPage = (direction: -1 | 1) => {
    const el = ref.current
    if (!el) return
    const page = el.clientWidth * 0.9
    if (loop && copies > 1) {
      const width = el.scrollWidth / copies
      if (direction > 0 && el.scrollLeft + page >= width - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      if (direction < 0 && el.scrollLeft <= 12) {
        el.scrollTo({ left: Math.max(0, width - page), behavior: 'smooth' })
        return
      }
    }
    el.scrollBy({ left: direction * page, behavior: 'smooth' })
  }

  return {
    ref,
    canPrev: fineHover && canPrev,
    canNext: fineHover && canNext,
    copies,
    scrollByPage,
  }
}
