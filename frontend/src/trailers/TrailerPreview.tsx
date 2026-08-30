import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import { resolveTrailer } from './resolve'
import { envKeys, type TrailerHit } from './types'

export type TrailerHandle = {
  setMuted: (muted: boolean) => void
  replay: () => void
}

const PLAYING = 1
const ENDED = 0

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
    overrideHit?: TrailerHit | null
    onReady?: () => void
    onEnded?: () => void
  }
>(function TrailerPreview(
  { title, year, kind, className, mode = 'hero', muted = true, overrideHit, onReady, onEnded },
  ref,
) {
  const { user } = useAuth()
  const keys = {
    iva: (user?.ivaKey || envKeys().iva).trim(),
    tmdb: (user?.tmdbKey || envKeys().tmdb).trim(),
  }
  const [hit, setHit] = useState<TrailerHit | null>(null)
  const [live, setLive] = useState(false)
  const [armed, setArmed] = useState(mode !== 'mini')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mutedRef = useRef(muted)
  const readyRef = useRef(false)
  mutedRef.current = muted
  const loop = mode === 'mini'

  useEffect(() => {
    if (mode !== 'mini') {
      setArmed(true)
      return
    }
    setArmed(false)
    const timer = window.setTimeout(() => setArmed(true), 420)
    return () => window.clearTimeout(timer)
  }, [mode, title])

  useEffect(() => {
    let cancelled = false
    setHit(null)
    setLive(false)
    readyRef.current = false
    if (overrideHit) {
      setHit(overrideHit)
      return
    }
    if (!keys.iva && !keys.tmdb) return
    const timer = window.setTimeout(() => {
      resolveTrailer({ title, year, kind }, keys, { seconds: mode === 'mini' ? 12 : 30 })
        .then((result) => {
          if (!cancelled) setHit(result)
        })
        .catch(() => {
          if (!cancelled) setHit(null)
        })
    }, mode === 'hero' ? 900 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [title, year, kind, keys.iva, keys.tmdb, mode, overrideHit])

  const onReadyRef = useRef(onReady)
  const onEndedRef = useRef(onEnded)
  useEffect(() => {
    onReadyRef.current = onReady
    onEndedRef.current = onEnded
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

  function markEnded() {
    if (loop) return
    readyRef.current = false
    setLive(false)
    onEndedRef.current?.()
  }

  function replay() {
    readyRef.current = false
    const iframe = iframeRef.current
    if (iframe) {
      postYouTube(iframe, 'seekTo', [0, true])
      postYouTube(iframe, 'playVideo')
    }
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      void video.play()
    }
    applyMute(mutedRef.current)
  }

  useImperativeHandle(ref, () => ({ setMuted: applyMute, replay }))

  useEffect(() => {
    if (!hit || hit.kind !== 'youtube' || !armed) return
    const onMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current
      if (!iframe || event.source !== iframe.contentWindow) return
      const payload = parseYouTubeMessage(event.data)
      if (!payload) return
      if (payload.event === 'onReady' || payload.event === 'initialDelivery') {
        postYouTube(iframe, 'addEventListener', ['onStateChange'])
        applyMute(mutedRef.current)
      }
      const state = playerState(payload)
      if (state === PLAYING) markReady()
      if (state === ENDED) markEnded()
    }
    const fail = window.setTimeout(() => {
      if (!readyRef.current) setHit(null)
    }, 8000)
    window.addEventListener('message', onMessage)
    return () => {
      window.clearTimeout(fail)
      window.removeEventListener('message', onMessage)
    }
  }, [hit, loop, armed])

  if (!hit || !armed) return null

  if (hit.kind === 'youtube') {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      fs: '0',
      enablejsapi: '1',
      origin: window.location.origin,
    })
    if (loop) {
      params.set('loop', '1')
      params.set('playlist', hit.src)
    }
    return (
      <iframe
        ref={iframeRef}
        className={`${className ?? ''} trailer-frame ${live ? 'is-live' : 'is-pending'}`}
        key={hit.src}
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
      loop={loop}
      playsInline
      preload="metadata"
      onPlaying={markReady}
      onEnded={markEnded}
    />
  )
})

TrailerPreview.displayName = 'TrailerPreview'
