import { useCallback, useEffect, useRef, useState } from 'react'

const cache = new Map<string, unknown>()

export function useFetch<T>(
  fn: () => Promise<T>,
  key: string,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true
  const fnRef = useRef(fn)
  fnRef.current = fn

  const [data, setData] = useState<T | null>(() => (cache.has(key) ? (cache.get(key) as T) : null))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => enabled && !cache.has(key))
  const [tick, setTick] = useState(0)

  const retry = useCallback(() => {
    setTick((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const hit = cache.get(key)
    if (hit !== undefined) {
      setData(hit as T)
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError(null)

    fnRef.current()
      .then((result) => {
        cache.set(key, result)
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, tick, enabled])

  return { data, error, loading, retry }
}
