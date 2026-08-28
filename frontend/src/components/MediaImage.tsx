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

  if (!src || stage === 'fallback') {
    return (
      <div className={`media-fallback ${className ?? ''}`} aria-hidden="true">
        {alt.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  const url = stage === 'proxy' ? proxyImageUrl(src) : src

  return (
    <img
      className={className}
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setStage((current) => (current === 'direct' ? 'proxy' : 'fallback'))}
    />
  )
}

export function MediaImage(props: MediaImageProps) {
  return <MediaImageInner key={props.src ?? ''} {...props} />
}
