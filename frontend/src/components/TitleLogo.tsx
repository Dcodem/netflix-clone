import { useState } from 'react'
import { proxyImageUrl } from '../api/client'
import { useTmdbLogo } from '../trailers/useTmdbLogo'

function LogoImage({
  src,
  alt,
  className,
  onGiveUp,
}: {
  src: string
  alt: string
  className?: string
  onGiveUp: () => void
}) {
  const [proxied, setProxied] = useState(false)
  return (
    <img
      className={className}
      src={proxied ? proxyImageUrl(src) : src}
      alt={alt}
      onError={() => {
        if (proxied) onGiveUp()
        else setProxied(true)
      }}
    />
  )
}

export function TitleLogo({
  item,
  className,
  titleClassName,
}: {
  item: { title: string; year?: number | null; kind?: string }
  className?: string
  titleClassName?: string
}) {
  const logo = useTmdbLogo(item)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showLogo = Boolean(logo) && logo !== failedSrc

  if (showLogo && logo) {
    return (
      <LogoImage
        key={logo}
        src={logo}
        alt={item.title}
        className={className}
        onGiveUp={() => setFailedSrc(logo)}
      />
    )
  }

  return <h1 className={titleClassName}>{item.title}</h1>
}
