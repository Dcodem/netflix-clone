import { useEffect, useRef, useState } from 'react'

export function useRowOverflow(loop = false, itemCount = 0) {
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

    // Tile pitch = tile width + gap. Scrolling by whole tiles guarantees no
    // tile is ever left half-covered, at any screen size.
    const first = el.querySelector('.poster-wrap, .scene-wrap') as HTMLElement | null
    const next = first?.nextElementSibling as HTMLElement | null
    let pitch = 0
    if (first && next) pitch = next.getBoundingClientRect().left - first.getBoundingClientRect().left
    if (!pitch) {
      pitch = (first?.getBoundingClientRect().width ?? 0) + 6
    }

    if (loop && copies > 1) {
      // Infinite marquee: step by full tiles, wrapping seamlessly inside the
      // duplicated strip (no snap, no half-covered tiles, no visible jump).
      const width = el.scrollWidth / copies
      const step = Math.max(1, Math.floor((el.clientWidth * 0.9) / pitch)) * pitch
      let target = el.scrollLeft + direction * step
      // Keep scrollLeft inside the first copy so the loop never shows a seam.
      if (target >= width) target -= width
      if (target < 0) target += width
      el.scrollTo({ left: target, behavior: 'smooth' })
      return
    }

    // Non-looping rows: snap to whole tiles as well. If the remaining span
    // is shorter than a full step, jump flush to the end instead of leaving
    // a half-covered tile hanging at the edge.
    const step = pitch
      ? Math.max(1, Math.round((el.clientWidth * 0.9) / pitch)) * pitch
      : el.clientWidth * 0.9
    const max = el.scrollWidth - el.clientWidth
    let target = el.scrollLeft + direction * step
    if (target > max) target = max
    if (target < 0) target = 0
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  return {
    ref,
    canPrev,
    canNext,
    copies,
    pageIndex,
    pageCount,
    scrollByPage,
  }
}
