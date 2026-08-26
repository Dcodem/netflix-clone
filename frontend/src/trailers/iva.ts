import type { TrailerHit } from './types'

type SearchItem = {
  title: string
  year?: number | null
  kind?: string
}

function programsFrom(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object') return []
  const data = payload as Record<string, unknown>
  const buckets = [data.ProgramMatches, data.Programs, data.Items, data.items, data.Value]
  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue
    return bucket.map((entry) => {
      if (entry && typeof entry === 'object' && 'Program' in entry) {
        return (entry as { Program: Record<string, unknown> }).Program
      }
      return entry as Record<string, unknown>
    })
  }
  return []
}

function videosFrom(program: Record<string, unknown>): Record<string, unknown>[] {
  const videos = program.Videos ?? program.videos
  return Array.isArray(videos) ? (videos as Record<string, unknown>[]) : []
}

function videoId(video: Record<string, unknown>): string | null {
  const id = video.Id ?? video.id ?? video.VideoId ?? video.videoId
  return id == null ? null : String(id)
}

function videoType(video: Record<string, unknown>): string {
  return String(video.VideoType ?? video.Type ?? video.Subtype ?? video.type ?? '')
}

function pickVideo(videos: Record<string, unknown>[]): Record<string, unknown> | null {
  const scored = videos
    .map((video) => {
      const type = videoType(video).toLowerCase()
      let score = 0
      if (type.includes('trailer')) score = 3
      else if (type.includes('teaser')) score = 2
      else if (type.includes('clip') || type.includes('extra')) score = 1
      return { video, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored[0]?.video ?? null
}

function titleOf(program: Record<string, unknown>): string {
  return String(program.Title ?? program.OriginalTitle ?? program.title ?? '')
}

function yearOf(program: Record<string, unknown>): number | null {
  const year = program.Year ?? program.year
  return typeof year === 'number' ? year : Number.parseInt(String(year ?? ''), 10) || null
}

async function ivaJson(path: string, key: string, extra: Record<string, string>): Promise<unknown> {
  const params = new URLSearchParams({ ...extra, 'subscription-key': key })
  const response = await fetch(`/iva${path}?${params.toString()}`)
  if (!response.ok) throw new Error(`IVA request failed (${response.status})`)
  const type = response.headers.get('content-type') ?? ''
  if (type.includes('json')) return response.json()
  return null
}

export async function findIvaTrailer(
  item: SearchItem,
  key: string,
  opts: { seconds?: number } = {},
): Promise<TrailerHit | null> {
  const programType = item.kind === 'show' ? 'Show' : 'Movie'
  const attempts: Record<string, string>[] = [
    { Query: item.title, ProgramTypes: programType, Includes: 'Videos', Take: '8', HasVideo: 'true' },
    { Title: item.title, ProgramTypes: programType, Includes: 'Videos', Take: '8', HasVideo: 'true' },
  ]

  let programs: Record<string, unknown>[] = []
  for (const extra of attempts) {
    try {
      const payload = await ivaJson('/api/Entertainment/Search/', key, extra)
      programs = programsFrom(payload)
      if (programs.length) break
    } catch {
      // try the next query shape
    }
  }
  if (!programs.length) return null

  const wanted = item.title.trim().toLowerCase()
  const ranked = [...programs].sort((a, b) => {
    const aTitle = titleOf(a).toLowerCase()
    const bTitle = titleOf(b).toLowerCase()
    const aExact = aTitle === wanted ? 2 : aTitle.includes(wanted) ? 1 : 0
    const bExact = bTitle === wanted ? 2 : bTitle.includes(wanted) ? 1 : 0
    if (aExact !== bExact) return bExact - aExact
    if (item.year) {
      return Math.abs((yearOf(a) ?? 0) - item.year) - Math.abs((yearOf(b) ?? 0) - item.year)
    }
    return 0
  })

  const video = pickVideo(videosFrom(ranked[0] ?? {}))
  const id = video ? videoId(video) : null
  if (!id) return null

  const seconds = opts.seconds ?? 20
  const expires = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
  const params = new URLSearchParams({
    Format: 'mp4',
    KbRate: 'mp4_750',
    Start: '0',
    End: String(seconds),
    Expires: expires,
    'subscription-key': key,
  })
  return {
    source: 'iva',
    kind: 'video',
    src: `/iva/api/Videos/GetVideo/${encodeURIComponent(id)}?${params.toString()}`,
    label: videoType(video ?? {}) || 'Trailer',
  }
}
