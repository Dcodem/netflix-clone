import { useEffect, useState } from 'react'

const FINE_HOVER = '(hover: hover) and (pointer: fine), (min-width: 768px)'

export function useFineHover(): boolean {
  const [fine, setFine] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(FINE_HOVER).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(FINE_HOVER)
    const onChange = () => setFine(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return fine
}
