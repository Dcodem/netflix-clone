import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import { resolveTrailer } from './resolve'
import { envKeys, type TrailerHit } from './types'

export type TrailerHandle = {
  setMuted: (muted: boolean) => void
}

const PLAYING = 1

function postYouTube(iframe: HTMLIFrameElement, func: string, args: unknown[] = []) {
  iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
}

function parseYouTubeMessage(data: unknown): { event?: string; info?: number | { playerState?: number } } | null {
  let payload = data
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload) as unknown
    } catch {
      return null
    }
  }
  if (!payload || typeof payload !== 'object') return null
  return payload as { event?: string; info?: number | { playerState?: number } }
}

function playerState(payload: { event?: string; info?: number | { playerState?: number } }): number | null {
  if (payload.event === 'onStateChange' && typeof payload.info === 'number') return payload.info
  if (payload.event === 'infoDelivery' && payload.info && typeof payload.info === 'object') {
    return typeof payload.info.playerState === 'number' ? payload.info.playerState : null
  }
  return null
}

export const TrailerPreview = forwardRef<
  TrailerHandle,
  {
    title: string
    year?: number | null
    kind?: string
    className?: string
    mode?: 'hero' | 'mini'
    muted?: boolean
    onReady?: () => void
  }
>(function TrailerPreview(
  { title, year, kind, className, mode = 'hero', muted = true, onReady },
  ref,
) {
  const { user } = useAuth()
  const keys = {
    iva: (user?.ivaKey || envKeys().iva).trim(),
    tmdb: (user?.tmdbKey || envKeys().tmdb).trim(),
  }
  const [hit, setHit] = useState<TrailerHit | null>(null)
  const [live, setLive] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mutedRef = useRef(muted)
  const readyRef = useRef(false)
  mutedRef.current = muted

  useEffect(() => {
    let cancelled = false
    setHit(null)
    setLive(false)
    readyRef.current = false
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

  function applyMute(next: boolean) {
    mutedRef.current = next
    const iframe = iframeRef.current
    if (iframe) {
      postYouTube(iframe, next ? 'mute' : 'unMute')
      if (!next) postYouTube(iframe, 'setVolume', [100])
    }
    const video = videoRef.current
    if (video) {
      video.muted = next
      if (!next) {
        video.volume = 1
        void video.play()
      }
    }
  }

  function markReady() {
    if (readyRef.current) return
    readyRef.current = true
    setLive(true)
    onReadyRef.current?.()
    applyMute(mutedRef.current)
  }

  useImperativeHandle(ref, () => ({ setMuted: applyMute }))

  useEffect(() => {
    if (!hit || hit.kind !== 'youtube') return
    const onMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current
      if (!iframe || event.source !== iframe.contentWindow) return
      const payload = parseYouTubeMessage(event.data)
      if (!payload) return
      if (payload.event === 'onReady' || payload.event === 'initialDelivery') {
        postYouTube(iframe, 'addEventListener', ['onStateChange'])
        applyMute(mutedRef.current)
      }
      if (playerState(payload) === PLAYING) markReady()
    }
    const fail = window.setTimeout(() => {
      if (!readyRef.current) setHit(null)
    }, 8000)
    window.addEventListener('message', onMessage)
    return () => {
      window.clearTimeout(fail)
      window.removeEventListener('message', onMessage)
    }
  }, [hit])

  if (!hit) return null

  if (hit.kind === 'youtube') {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      loop: '1',
      playlist: hit.src,
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      fs: '0',
      enablejsapi: '1',
      origin: window.location.origin,
    })
    return (
      <iframe
        ref={iframeRef}
        className={`${className ?? ''} trailer-frame ${live ? 'is-live' : 'is-pending'}`}
        src={`https://www.youtube-nocookie.com/embed/${hit.src}?${params.toString()}`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        onLoad={() => {
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*')
        }}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      className={`${className ?? ''} trailer-frame ${live ? 'is-live' : 'is-pending'}`}
      src={hit.src}
      autoPlay
      muted={muted}
      loop
      playsInline
      preload="metadata"
      onPlaying={markReady}
    />
  )
})

TrailerPreview.displayName = 'TrailerPreview'
