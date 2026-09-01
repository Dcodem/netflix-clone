import { useState, type Dispatch, type SetStateAction } from 'react'

/** Reset state in the same render when the key changes so cached records cannot leak across identities. */
export function useKeyedState<T>(key: string, valueForKey: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(valueForKey)
  const [seenKey, setSeenKey] = useState(key)
  if (seenKey !== key) {
    setSeenKey(key)
    setState(valueForKey)
  }
  return [state, setState]
}
