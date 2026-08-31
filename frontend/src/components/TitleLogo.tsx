import { useState } from 'react'
import { proxyImageUrl } from '../api/client'
import { useTmdbLogo } from '../trailers/useTmdbLogo'

function LogoImage({
  src,
  alt,
  className,
  onGiveUp,
  onReady,
}: {
  src: string
  alt: string
  className?: string
  onGiveUp: () => void
  onReady?: () => void
}) {
  const [proxied, setProxied] = useState(false)
  return (
    <img
      className={className}
      src={proxied ? proxyImageUrl(src) : src}
      alt={alt}
      onLoad={() => onReady?.()}
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
  imageOnly,
}: {
  item: { title: string; year?: number | null; kind?: string; tmdb_id?: number | string | null }
  className?: string
  titleClassName?: string
  imageOnly?: boolean
}) {
  const logo = useTmdbLogo(item)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [readySrc, setReadySrc] = useState<string | null>(null)
  const showLogo = Boolean(logo) && logo !== failedSrc && readySrc === logo

  return (
    <>
      {logo && logo !== failedSrc ? (
        <LogoImage
          key={logo}
          src={logo}
          alt={item.title}
          className={`${className ?? ''} ${readySrc === logo ? '' : 'is-logo-pending'}`}
          onReady={() => setReadySrc(logo)}
          onGiveUp={() => {
            setFailedSrc(logo)
            setReadySrc(null)
          }}
        />
      ) : null}
      {showLogo || imageOnly ? null : <h1 className={titleClassName}>{item.title}</h1>}
    </>
  )
}
