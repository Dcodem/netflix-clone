import { useEffect, useState } from 'react'
import { getMovie, getShow } from '../api/client'
import type { MovieListItem, ShowDetail } from '../api/types'
import { comingLineFor, isComingSoon } from '../lib/comingSoon'
import { formatRuntime, isShow } from '../lib/media'
import { isNewEpisodes, matchPercent, maturityLabel, toLiked } from '../lib/netflix'
import { playClick } from '../lib/sounds'
import { buildWatchSession } from '../lib/watchSession'
import { useProfiles } from '../profiles/ProfileContext'
import { useTitleModal } from '../title/TitleModalContext'
import { useWatch } from '../watch/WatchContext'
import { notifyRemind } from './RemindToast'
import { CatalogImage } from './CatalogImage'
import { FeatureBadges } from './FeatureBadges'
import { BellIcon, CheckIcon, PlayIcon, PlusIcon } from './Icons'

type LikeChip = { chip: string; synopsis: string }

const chipCache = new Map<string, LikeChip>()

async function chipFor(item: MovieListItem): Promise<LikeChip> {
  const hit = chipCache.get(item.id)
  if (hit) return hit
  const detail = isShow(item) ? await getShow(item.id) : await getMovie(item.id)
  const seasons = isShow(item) ? ((detail as ShowDetail).seasons?.length ?? 0) : 0
  const chip = seasons
    ? `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`
    : formatRuntime(detail.runtime) ?? (item.year ? String(item.year) : '')
  const info = { chip, synopsis: detail.synopsis?.trim() ?? '' }
  if (info.chip || info.synopsis) chipCache.set(item.id, info)
  return info
}

export function MoreLikeGrid({ items }: { items: MovieListItem[] }) {
  const { openTitle, closeTitle } = useTitleModal()
  const { openWatch } = useWatch()
  const { activeProfile, toggleMyList } = useProfiles()
  const slice = items.slice(0, 12)
  const ids = slice.map((item) => item.id).join(',')
  const [chips, setChips] = useState<Record<string, LikeChip>>({})

  useEffect(() => {
    let cancelled = false
    const next: Record<string, LikeChip> = {}
    const missing: MovieListItem[] = []
    for (const item of slice) {
      const hit = chipCache.get(item.id)
      if (hit) next[item.id] = hit
      else missing.push(item)
    }
    setChips(next)
    if (!missing.length) return
    Promise.all(
      missing.map(async (item) => {
        try {
          return [item.id, await chipFor(item)] as const
        } catch {
          return [item.id, { chip: item.year ? String(item.year) : '', synopsis: '' }] as const
        }
      }),
    ).then((rows) => {
      if (cancelled) return
      setChips((prev) => ({ ...prev, ...Object.fromEntries(rows) }))
    })
    return () => {
      cancelled = true
    }
    // slice is derived from items; ids is the stable key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids])

  if (!items.length) return null

  return (
    <div className="more-like">
      <div className="more-like-grid">
        {slice.map((item) => {
          const onList = activeProfile?.myList.some((entry) => entry.id === item.id) ?? false
          const match = matchPercent(item, activeProfile)
          const info = chips[item.id]
          const soon = isComingSoon(item)
          const coming = comingLineFor(item)
          return (
            <article
              key={item.id}
              className="more-like-card"
              onClick={(event) => openTitle(item, event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openTitle(item, event.currentTarget)
                }
              }}
              role="link"
              tabIndex={0}
              aria-label={item.title}
            >
              <div className="more-like-art-wrap">
                <div className="more-like-art">
                  <CatalogImage item={item} alt="" prefer="backdrop" />
                  <button
                    type="button"
                    className={`more-like-play ${soon ? 'is-remind' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      event.preventDefault()
                      if (soon) {
                        playClick()
                        toggleMyList(toLiked(item))
                        notifyRemind(item.title, !onList)
                        return
                      }
                      playClick()
                      void (async () => {
                        try {
                          const detail = isShow(item) ? await getShow(item.id) : await getMovie(item.id)
                          const session = buildWatchSession(item, detail)
                          if (!session) {
                            openTitle(item)
                            return
                          }
                          closeTitle()
                          openWatch(session.href, item.title, session.payload)
                        } catch {
                          openTitle(item)
                        }
                      })()
                    }}
                    aria-label={soon ? (onList ? `Reminded for ${item.title}` : `Remind Me for ${item.title}`) : `Play ${item.title}`}
                  >
                    {soon ? onList ? <CheckIcon className="icon" /> : <BellIcon className="icon" /> : <PlayIcon className="icon" />}
                  </button>
                  {soon && coming ? <span className="more-like-runtime">{coming}</span> : info?.chip ? <span className="more-like-runtime">{info.chip}</span> : null}
                </div>
                {soon ? null : (
                <button
                  type="button"
                  className={`circle-btn more-like-add ${onList ? 'is-on' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleMyList(toLiked(item))
                  }}
                  aria-label={onList ? 'Remove from My List' : 'Add to My List'}
                >
                  {onList ? <CheckIcon className="icon" /> : <PlusIcon className="icon" />}
                </button>
                )}
              </div>
              <div className="more-like-body">
                <div className="more-like-meta">
                  {soon ? null : <span className="match">{match}% Match</span>}
                  {soon ? null : isNewEpisodes(item.id, item.kind) ? <span className="now-badge">New Episodes</span> : null}
                  {item.year ? <span className="more-like-year">{item.year}</span> : null}
                  <span className="maturity">{maturityLabel(item)}</span>
                  <FeatureBadges quality={item.quality} compact />
                </div>
                {info?.synopsis ? <p className="more-like-syn">{info.synopsis}</p> : <p className="more-like-title">{item.title}</p>}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
