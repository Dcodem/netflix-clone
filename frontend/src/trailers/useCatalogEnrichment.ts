import { useEffect, useMemo, useState } from 'react'
import type { MovieListItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { findTmdbInfo } from './tmdb'
import { envKeys } from './types'
import {
  getTitleOverlay,
  needsCatalogEnrichment,
  presentListItem,
  rememberTitleOverlay,
  subscribeTitleOverlay,
} from './tmdbOverlay'

const CONCURRENCY = 3

// Global completion ledger: rows re-render and restart this effect constantly
// (new items array identity), so queue progress must live outside the effect
// or the same titles get re-searched hundreds of times.
const enriched = new Set<string>()

function enrichmentKey(item: { title?: string; year?: number | null; kind?: string }) {
  return `${item.kind ?? 'movie'}|${(item.title ?? '').toLowerCase()}|${item.year ?? ''}`
}

export function useCatalogEnrichment(items: MovieListItem[]): MovieListItem[] {
  const { user } = useAuth()
  const key = (user?.tmdbKey || envKeys().tmdb).trim()
  const [version, setVersion] = useState(0)

  useEffect(() => subscribeTitleOverlay(() => setVersion((value) => value + 1)), [])

  useEffect(() => {
    // Stand down while a hover preview is open: the hover's own trailer
    // resolve must win the connection pool, or it times out and no video loads.
    // Watch the body class so opening/closing the preview pauses/resumes us.
    const mo = new MutationObserver(() => setVersion((value) => value + 1))
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    if (document.body.classList.contains('is-jaw-open')) {
      return () => mo.disconnect()
    }
    if (!items.length) {
      return () => mo.disconnect()
    }
    const queue = items.filter(
      (item) => needsCatalogEnrichment(item) && !enriched.has(enrichmentKey(item)),
    )
    if (!queue.length) return
    let cancelled = false
    let cursor = 0

    async function worker() {
      while (!cancelled) {
        const item = queue[cursor]
        cursor += 1
        if (!item) return
        const ekey = enrichmentKey(item)
        if (getTitleOverlay(item) || enriched.has(ekey)) continue
        enriched.add(ekey)
        try {
          const info = await findTmdbInfo(
            { title: item.title, year: item.year, kind: item.kind, tmdb_id: item.tmdb_id },
            key,
          )
          if (cancelled || !info?.tmdb_id) continue
          rememberTitleOverlay(item, info)
        } catch {
          /* keep the source row */
        }
      }
    }

    void Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()))
    return () => {
      cancelled = true
      mo.disconnect()
    }
  }, [items, key])

  return useMemo(() => items.map((item) => presentListItem(item)), [items, version])
}
