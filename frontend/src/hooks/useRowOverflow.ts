import { useEffect, useRef, useState } from 'react'
import { useFineHover } from './useFineHover'

export function useRowOverflow(loop = false, itemCount = 0) {
  const fineHover = useFineHover()
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const copies = loop ? 2 : 1

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      window.requestAnimationFrame(() => {
        if (!el.isConnected) return
        if (loop && copies > 1) {
          const width = el.scrollWidth / copies
          if (width < el.clientWidth + 8) {
            setCanPrev(false)
            setCanNext(false)
            setPageCount(1)
            setPageIndex(0)
            return
          }
          if (el.scrollLeft >= width) el.scrollLeft -= width
          setCanPrev(true)
          setCanNext(true)
          const pages = Math.min(8, Math.max(1, Math.round(width / Math.max(1, el.clientWidth))))
          setPageCount(pages)
          setPageIndex(Math.min(pages - 1, Math.round((el.scrollLeft % width) / Math.max(1, el.clientWidth))))
          return
        }
        setCanPrev(el.scrollLeft > 12)
        setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 12)
        const pages = Math.min(8, Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth))))
        setPageCount(pages)
        setPageIndex(Math.min(pages - 1, Math.round(el.scrollLeft / Math.max(1, el.clientWidth))))
      })
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
    pageIndex,
    pageCount,
    scrollByPage,
  }
}
