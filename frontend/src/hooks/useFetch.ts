import { useCallback, useEffect, useRef, useState } from 'react'

export function useFetch<T>(
  fn: () => Promise<T>,
  key: string,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true
  const fnRef = useRef(fn)
  fnRef.current = fn

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(enabled)
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
    setLoading(true)
    setError(null)

    fnRef.current()
      .then((result) => {
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
