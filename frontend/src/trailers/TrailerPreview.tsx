import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { resolveTrailer } from './resolve'
import { envKeys, type TrailerHit } from './types'

export function TrailerPreview({
  title,
  year,
  kind,
  className,
  mode = 'hero',
  muted = true,
  onReady,
}: {
  title: string
  year?: number | null
  kind?: string
  className?: string
  mode?: 'hero' | 'mini'
  muted?: boolean
  onReady?: () => void
}) {
  const { user } = useAuth()
  const keys = {
    iva: (user?.ivaKey || envKeys().iva).trim(),
    tmdb: (user?.tmdbKey || envKeys().tmdb).trim(),
  }
  const [hit, setHit] = useState<TrailerHit | null>(null)

  useEffect(() => {
    let cancelled = false
    setHit(null)
    if (!keys.iva && !keys.tmdb) return
    const timer = window.setTimeout(() => {
      resolveTrailer({ title, year, kind }, keys, { seconds: mode === 'mini' ? 12 : 30 })
        .then((result) => {
          if (!cancelled) setHit(result)
        })
        .catch(() => {
          if (!cancelled) setHit(null)
        })
    }, mode === 'hero' ? 900 : 200)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [title, year, kind, keys.iva, keys.tmdb, mode])

  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  })

  useEffect(() => {
    if (hit) onReadyRef.current?.()
  }, [hit])

  if (!hit) return null

  if (hit.kind === 'youtube') {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: muted ? '1' : '0',
      controls: '0',
      loop: '1',
      playlist: hit.src,
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
    })
    return (
      <iframe
        className={className}
        src={`https://www.youtube-nocookie.com/embed/${hit.src}?${params.toString()}`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media"
        tabIndex={-1}
      />
    )
  }

  return (
    <video
      className={className}
      src={hit.src}
      autoPlay
      muted={muted}
      loop
      playsInline
      preload="metadata"
    />
  )
}
