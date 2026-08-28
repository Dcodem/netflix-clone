import { useState } from 'react'
import { proxyImageUrl } from '../api/client'

type MediaImageProps = {
  src?: string | null
  alt: string
  className?: string
}

function MediaImageInner({ src, alt, className }: MediaImageProps) {
  const [stage, setStage] = useState<'direct' | 'proxy' | 'fallback'>(() =>
    src && /(?:image\.tmdb\.org|themoviedb\.org)/i.test(src) ? 'proxy' : 'direct',
  )
  const [ready, setReady] = useState(false)
  const label = alt.trim()

  if (!src || stage === 'fallback') {
    return (
      <div className={`media-fallback ${className ?? ''}`} aria-hidden="true">
        {label.slice(0, 1).toUpperCase() || '•'}
      </div>
    )
  }

  const url = stage === 'proxy' ? proxyImageUrl(src) : src

  return (
    <img
      className={`${className ?? ''} media-img ${ready ? 'is-ready' : ''}`}
      src={url}
      alt={label}
      loading="lazy"
      decoding="async"
      onLoad={() => setReady(true)}
      onError={() => setStage((current) => (current === 'direct' ? 'proxy' : 'fallback'))}
    />
  )
}

export function MediaImage(props: MediaImageProps) {
  return <MediaImageInner key={props.src ?? ''} {...props} />
}
