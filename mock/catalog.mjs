/** Deterministic mock catalog: 120 movies + 90 shows with seasons and episode copy. */

const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
]

const CAST = [
  'Alex Rivera',
  'Sam Chen',
  'Jordan Hale',
  'Riley Okonkwo',
  'Morgan Ellis',
  'Quinn Park',
  'Taylor Nguyen',
  'Casey Brooks',
  'Avery Shah',
  'Jamie Cole',
  'Drew Patel',
  'Harper Diaz',
  'Rowan Kim',
  'Eden Walsh',
  'Sasha Brooks',
  'Noah Grant',
  'Lena Ortiz',
  'Miles Brennan',
  'Ivy Nakamura',
  'Owen Clarke',
]

const ADJECTIVES = [
  'Silent',
  'Iron',
  'Hidden',
  'Golden',
  'Broken',
  'Quiet',
  'Wild',
  'Pale',
  'Last',
  'First',
  'Night',
  'Paper',
  'Glass',
  'River',
  'Winter',
  'Summer',
  'Hollow',
  'Bright',
  'Faded',
  'Deep',
  'Lost',
  'Open',
  'Cold',
  'Burning',
  'Silver',
  'North',
  'Red',
  'Blue',
  'Empty',
  'Second',
]

const NOUNS = [
  'Harbor',
  'Crown',
  'Signal',
  'Garden',
  'Protocol',
  'Machine',
  'Mirror',
  'Empire',
  'Witness',
  'Season',
  'Court',
  'Pact',
  'Orbit',
  'Radio',
  'Hours',
  'Crew',
  'Moons',
  'Line',
  'Sky',
  'City',
  'Road',
  'House',
  'Lights',
  'Room',
  'Shift',
  'Table',
  'South',
  'Legacy',
  'Files',
  'Frontier',
]

const EPISODE_TITLES = [
  'Pilot',
  'The Offer',
  'Aftermath',
  'Crossroads',
  'Smoke',
  'The Map',
  'False Flag',
  'Inheritance',
  'Night Work',
  'The Guest',
  'Split Decision',
  'Return Trip',
  'Cold Open',
  'Second Name',
  'The Leak',
  'Last Train',
]

const EPISODE_BEATS = [
  'A small mistake in public turns into a problem nobody can ignore.',
  'An old ally shows up with a deal that sounds too clean.',
  'The investigation points at someone inside the house.',
  'A quiet night run uncovers a second set of books.',
  'Everyone agrees to tell the truth. Almost everyone does.',
  'A buried recording rewrites the last three weeks.',
  'The team splits after a vote that should have been easy.',
  'Someone from the first season walks back in without warning.',
  'A family dinner becomes the least safe room in the city.',
  'The plan works, then the bill arrives.',
  'Two versions of the same night cannot both be real.',
  'A witness changes their story after a five-minute phone call.',
]

export const PAGE_SIZE = 24

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function titleAt(index) {
  const adjective = ADJECTIVES[index % ADJECTIVES.length]
  const noun = NOUNS[Math.floor(index / ADJECTIVES.length) % NOUNS.length]
  return `${adjective} ${noun}`
}

function genresFor(index) {
  const primary = GENRES[index % GENRES.length]
  const secondary = GENRES[(index * 5 + 3) % GENRES.length]
  const tertiary = GENRES[(index * 7 + 1) % GENRES.length]
  const list = [primary]
  if (secondary !== primary) list.push(secondary)
  if (index % 4 === 0 && tertiary !== primary && tertiary !== secondary) list.push(tertiary)
  return list
}

function ratingFor(index) {
  return Number((5.6 + ((index * 17) % 39) / 10).toFixed(1))
}

function yearFor(index) {
  return 2015 + (index % 12)
}

function qualityFor(index) {
  return ['FHD', '4K', '1080p', 'FHD'][index % 4]
}

function castFor(index) {
  const start = index % CAST.length
  return [0, 1, 2, 3].map((offset) => CAST[(start + offset) % CAST.length])
}

function synopsisFor(item) {
  const genre = item.genres[0]?.toLowerCase() ?? 'drama'
  if (item.kind === 'show') {
    return `${item.title} is a ${item.year} ${genre} series about people who keep choosing the harder door. Each season raises the cost of staying loyal.`
  }
  return `${item.title} is a ${item.year} ${genre} film about a plan that only works if nobody looks too closely. Runtime is built for a Friday night watch.`
}

function makeItem(index, kind) {
  const title = titleAt(index)
  const year = yearFor(index)
  const prefix = kind === 'show' ? 8000 + index : 3000 + index
  const id = `${prefix}-${slugify(title)}-${year}`
  return {
    id,
    title,
    kind,
    year,
    rating: ratingFor(index),
    quality: qualityFor(index),
    genres: genresFor(index),
    poster_url: `/art/poster/${id}`,
    href: `/${kind === 'show' ? 'shows' : 'movies'}/view/${id}`,
  }
}

function namedItem(kind, n, title, year, rating, genres) {
  const prefix = kind === 'show' ? 9100 + n : 2100 + n
  const id = `${prefix}-${slugify(title)}-${year}`
  return {
    id,
    title,
    kind,
    year,
    rating,
    quality: '4K',
    genres,
    poster_url: `/art/poster/${id}`,
    href: `/${kind === 'show' ? 'shows' : 'movies'}/view/${id}`,
  }
}

const REAL_MOVIES = [
  namedItem('movie', 1, 'Inception', 2010, 8.8, ['Sci-Fi', 'Action', 'Thriller']),
  namedItem('movie', 2, 'The Dark Knight', 2008, 9.0, ['Action', 'Crime', 'Drama']),
  namedItem('movie', 3, 'Dune: Part Two', 2024, 8.5, ['Sci-Fi', 'Adventure']),
  namedItem('movie', 4, 'Top Gun: Maverick', 2022, 8.3, ['Action', 'Drama']),
  namedItem('movie', 5, 'Spider-Man: No Way Home', 2021, 8.2, ['Action', 'Adventure', 'Fantasy']),
  namedItem('movie', 6, 'Everything Everywhere All at Once', 2022, 7.8, ['Comedy', 'Sci-Fi', 'Adventure']),
  namedItem('movie', 7, 'Oppenheimer', 2023, 8.3, ['Drama', 'History']),
  namedItem('movie', 8, 'Wicked', 2024, 7.5, ['Fantasy', 'Family', 'Adventure']),
  namedItem('movie', 9, 'Superman', 2025, 7.2, ['Action', 'Adventure', 'Sci-Fi']),
  namedItem('movie', 10, 'Interstellar', 2014, 8.7, ['Sci-Fi', 'Drama', 'Adventure']),
]

const REAL_SHOWS = [
  namedItem('show', 1, 'Stranger Things', 2016, 8.7, ['Sci-Fi', 'Horror', 'Drama']),
  namedItem('show', 2, 'The Last of Us', 2023, 8.8, ['Drama', 'Adventure', 'Horror']),
  namedItem('show', 3, 'The Mandalorian', 2019, 8.6, ['Sci-Fi', 'Adventure', 'Action']),
  namedItem('show', 4, 'The Bear', 2022, 8.6, ['Comedy', 'Drama']),
  namedItem('show', 5, 'Severance', 2022, 8.7, ['Mystery', 'Thriller', 'Drama']),
  namedItem('show', 6, 'Shogun', 2024, 8.6, ['Drama', 'History', 'Adventure']),
]

const MOVIES = [...REAL_MOVIES, ...Array.from({ length: 120 }, (_, index) => makeItem(index, 'movie'))]
const SHOWS = [...REAL_SHOWS, ...Array.from({ length: 90 }, (_, index) => makeItem(index + 200, 'show'))]

function seasonsFor(item, index) {
  const seasonCount = 1 + (index % 3)
  const episodeCount = 8 + (index % 5)
  const seasons = []
  for (let seasonNumber = 1; seasonNumber <= seasonCount; seasonNumber += 1) {
    const episodes = []
    for (let number = 1; number <= episodeCount; number += 1) {
      const title = EPISODE_TITLES[(index + seasonNumber + number) % EPISODE_TITLES.length]
      const beat = EPISODE_BEATS[(index * 3 + seasonNumber * 5 + number) % EPISODE_BEATS.length]
      episodes.push({
        id: `${item.id}-s${seasonNumber}e${number}`,
        number,
        title,
        duration: 24 + ((index + number) % 22),
        synopsis: `S${seasonNumber}E${number} of ${item.title}: ${beat}`,
        thumb_url: `/art/thumb/${item.id}?s=${seasonNumber}&e=${number}`,
        watch_href: `/watch/play/${item.id}?s=${seasonNumber}&e=${number}`,
      })
    }
    seasons.push({ season_number: seasonNumber, episodes })
  }
  return seasons
}

const ALL = [...MOVIES, ...SHOWS]
const BY_ID = new Map(ALL.map((item) => [item.id, item]))

export function listMovies() {
  return MOVIES
}

export function listShows() {
  return SHOWS
}

export function homepageRows() {
  const featuredMovies = [...MOVIES].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 24)
  const featuredShows = [...SHOWS].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 16)
  const seen = new Set()
  const mixed = []
  for (const item of [...featuredMovies, ...featuredShows]) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    mixed.push(item)
  }
  return mixed
}

export function searchItems(q) {
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return []
  return ALL.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      item.genres.some((genre) => genre.toLowerCase().includes(needle)),
  )
}

export function catalogPage(kind, opts = {}) {
  const source = kind === 'shows' ? SHOWS : MOVIES
  const genre = opts.genre?.trim().toLowerCase()
  const filtered = genre
    ? source.filter((item) => item.genres.some((name) => name.toLowerCase() === genre))
    : source
  const page = Math.max(1, Number(opts.page) || 1)
  const start = (page - 1) * PAGE_SIZE
  const items = filtered.slice(start, start + PAGE_SIZE)
  const next = start + PAGE_SIZE < filtered.length ? page + 1 : null
  return { items, next }
}

export function getDetail(kind, id) {
  const item = BY_ID.get(id)
  if (!item) return null
  if (kind === 'movie' && item.kind !== 'movie') return null
  if (kind === 'show' && item.kind !== 'show') return null
  const index = Number(item.id.slice(0, 4))
  const detail = {
    ...item,
    synopsis: synopsisFor(item),
    runtime: item.kind === 'movie' ? 96 + (index % 48) : 28 + (index % 22),
    cast: castFor(index),
    backdrop_url: `/art/backdrop/${item.id}`,
    watch_href: `/watch/play/${item.id}`,
  }
  if (item.kind === 'show') {
    detail.seasons = seasonsFor(item, index)
  }
  return detail
}

export function getItem(id) {
  return BY_ID.get(id) ?? null
}

export const COUNTS = { movies: MOVIES.length, shows: SHOWS.length, genres: GENRES.length }
