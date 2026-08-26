import { useEffect, useState } from 'react'

export function useFineHover(): boolean {
  const [fine, setFine] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const onChange = () => setFine(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return fine
}
