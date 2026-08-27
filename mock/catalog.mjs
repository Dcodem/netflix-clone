/** Mock catalog of recognizable titles with TMDB poster and backdrop art. */

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
    poster_url: `/art/poster/${id}?v=2`,
    href: `/${kind === 'show' ? 'shows' : 'movies'}/view/${id}`,
  }
}

function namedItem(kind, n, title, year, rating, genres, poster, backdrop) {
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
    poster_url: poster || `/art/poster/${id}?v=2`,
    backdrop_url: backdrop || `/art/backdrop/${id}?v=2`,
    href: `/${kind === 'show' ? 'shows' : 'movies'}/view/${id}`,
  }
}

const REAL_MOVIES = [
  namedItem('movie', 1, "Inception", 2010, 8.8, ["Sci-Fi","Action","Thriller"], "https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg"),
  namedItem('movie', 2, "The Dark Knight", 2008, 9, ["Action","Crime","Drama"], "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "https://image.tmdb.org/t/p/w1280/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg"),
  namedItem('movie', 3, "Interstellar", 2014, 8.7, ["Sci-Fi","Drama","Adventure"], "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", "https://image.tmdb.org/t/p/w1280/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg"),
  namedItem('movie', 4, "Dune: Part Two", 2024, 8.5, ["Sci-Fi","Adventure"], "https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg", "https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg"),
  namedItem('movie', 5, "Top Gun: Maverick", 2022, 8.3, ["Action","Drama"], "https://image.tmdb.org/t/p/w500/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg", "https://image.tmdb.org/t/p/w1280/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg"),
  namedItem('movie', 6, "Spider-Man: No Way Home", 2021, 8.2, ["Action","Adventure","Fantasy"], "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", "https://image.tmdb.org/t/p/w1280/uyrOU4BDm2kbVxFsMiDFIHDhc4d.jpg"),
  namedItem('movie', 7, "Everything Everywhere All at Once", 2022, 7.8, ["Comedy","Sci-Fi","Adventure"], "https://image.tmdb.org/t/p/w500/u68AjlvlutfEIcpmbYpKcdi09ut.jpg", "https://image.tmdb.org/t/p/w1280/ss0Os3uWJfQAENILHZUdX8Tt1OC.jpg"),
  namedItem('movie', 8, "Oppenheimer", 2023, 8.3, ["Drama","History"], "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", "https://image.tmdb.org/t/p/w1280/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg"),
  namedItem('movie', 9, "Wicked", 2024, 7.5, ["Fantasy","Family","Adventure"], "https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg", "https://image.tmdb.org/t/p/w1280/fyZ6SDUS4o9jp2EHxfZa3qS9ean.jpg"),
  namedItem('movie', 10, "Superman", 2025, 7.2, ["Action","Adventure","Sci-Fi"], "https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg", "https://image.tmdb.org/t/p/w1280/eGX66zonvc4bXg3rM08RUxdYSDx.jpg"),
  namedItem('movie', 11, "The Matrix", 1999, 8.7, ["Sci-Fi","Action"], "https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", "https://image.tmdb.org/t/p/w1280/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg"),
  namedItem('movie', 12, "Parasite", 2019, 8.5, ["Thriller","Drama"], "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", "https://image.tmdb.org/t/p/w1280/vbC0rzdrb7Ohc2TkbEbxtOABECe.jpg"),
  namedItem('movie', 13, "Whiplash", 2014, 8.5, ["Drama"], "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg", "https://image.tmdb.org/t/p/w1280/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg"),
  namedItem('movie', 14, "Mad Max: Fury Road", 2015, 8.1, ["Action","Adventure"], "https://image.tmdb.org/t/p/w500/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg", "https://image.tmdb.org/t/p/w1280/uT895WNwm0aIJRtGizcQhrejWUo.jpg"),
  namedItem('movie', 15, "Get Out", 2017, 7.8, ["Horror","Thriller"], "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg", "https://image.tmdb.org/t/p/w1280/bBQHALHRAaaORlPNXv7fNcRXYdx.jpg"),
  namedItem('movie', 16, "La La Land", 2016, 8, ["Romance","Comedy","Drama"], "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg", "https://image.tmdb.org/t/p/w1280/nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg"),
  namedItem('movie', 17, "The Grand Budapest Hotel", 2014, 8.1, ["Comedy","Adventure"], "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg", "https://image.tmdb.org/t/p/w1280/9udCLTxTFl28RxnK8Q05E154ZGa.jpg"),
  namedItem('movie', 18, "Spirited Away", 2001, 8.6, ["Animation","Family","Fantasy"], "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", "https://image.tmdb.org/t/p/w1280/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg"),
  namedItem('movie', 19, "Coco", 2017, 8.4, ["Animation","Family","Adventure"], "https://image.tmdb.org/t/p/w500/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg", "https://image.tmdb.org/t/p/w1280/g7CHF8gTLGooTbP4GznIGwaqAGL.jpg"),
  namedItem('movie', 20, "The Social Network", 2010, 7.8, ["Drama"], "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg", "https://image.tmdb.org/t/p/w1280/1PXwh3nJzgRkkYnqfWInJNypeL4.jpg"),
  namedItem('movie', 21, "Blade Runner 2049", 2017, 8, ["Sci-Fi","Drama"], "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", "https://image.tmdb.org/t/p/w1280/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg"),
  namedItem('movie', 22, "John Wick", 2014, 7.4, ["Action","Thriller"], "https://image.tmdb.org/t/p/w500/wXqWR7dHncNRbxoEGybEy7QTe9h.jpg", "https://image.tmdb.org/t/p/w1280/ff2ti5DkA9UYLzyqhQfI2kZqEuh.jpg"),
  namedItem('movie', 23, "Barbie", 2023, 6.9, ["Comedy","Adventure"], "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", "https://image.tmdb.org/t/p/w1280/1esAE8sLJRWWFsLLeh5r3g2WanI.jpg"),
  namedItem('movie', 24, "Arrival", 2016, 7.9, ["Sci-Fi","Drama"], "https://image.tmdb.org/t/p/w500/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg", "https://image.tmdb.org/t/p/w1280/8MUZz7oPXQftFTslZpRP3CVMOoq.jpg"),
  namedItem('movie', 25, "The Batman", 2022, 7.8, ["Action","Crime"], "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", "https://image.tmdb.org/t/p/w1280/rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg"),
  namedItem('movie', 26, "Knives Out", 2019, 7.9, ["Mystery","Comedy","Crime"], "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg", "https://image.tmdb.org/t/p/w1280/4HWAQu28e2yaWrtupFPGFkdNU7V.jpg"),
  namedItem('movie', 27, "Paddington 2", 2017, 7.8, ["Family","Comedy","Adventure"], "https://image.tmdb.org/t/p/w500/1OJ9vkD5xPt3skC6KguyXAgagRZ.jpg", "https://image.tmdb.org/t/p/w1280/kRVUMsXFzhuXjr20JcCGc6TapxA.jpg"),
  namedItem('movie', 28, "Moonlight", 2016, 7.4, ["Drama"], "https://image.tmdb.org/t/p/w500/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg", "https://image.tmdb.org/t/p/w1280/jm1oD3eB08LImSwL1LrzF9AJQ5b.jpg"),
  namedItem('movie', 29, "Spider-Man: Brand New Day", 2026, 7.9, ["Sci-Fi","Action","Adventure"], "https://image.tmdb.org/t/p/w500/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg", "https://image.tmdb.org/t/p/w1280/7iwUUcKURMT7aKfCwMy6YnGtchD.jpg"),
  namedItem('movie', 30, "The Odyssey", 2026, 8, ["Adventure","Action","Fantasy"], "https://image.tmdb.org/t/p/w500/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg", "https://image.tmdb.org/t/p/w1280/RMXG8myu1aGlNUsRjtxzmpdMK0.jpg"),
  namedItem('movie', 31, "Mutiny", 2026, 6.5, ["Action","Thriller"], "https://image.tmdb.org/t/p/w500/aAnTt6KpmbbHbd6xH3FQFlppZjc.jpg", "https://image.tmdb.org/t/p/w1280/qDa0fqDqIBCovRp975RvtGPcuN3.jpg"),
  namedItem('movie', 32, "Rage of Stars", 2026, 5.6, ["Action","Sci-Fi","Thriller"], "https://image.tmdb.org/t/p/w500/oLld47ZT1I3iecM3OWhIphohQUJ.jpg", "https://image.tmdb.org/t/p/w1280/z7lZgL5tzefTfhyRtouThFhsuUS.jpg"),
  namedItem('movie', 33, "Facing El Chapo", 2026, 8.5, ["Crime","Action","Thriller"], "https://image.tmdb.org/t/p/w500/alpf5v4UqSFawPmG9RX03Or4BDk.jpg", "https://image.tmdb.org/t/p/w1280/c4U96GrPRfnNrS01mBtqnocvlLJ.jpg"),
  namedItem('movie', 34, "Toy Story 5", 2026, 8.2, ["Animation","Family","Comedy"], "https://image.tmdb.org/t/p/w500/sfQtVlIHljToOwYjhe21KPGzZWK.jpg", "https://image.tmdb.org/t/p/w1280/8sSKdEmlmqF4kJUd28SqthXC4yZ.jpg"),
  namedItem('movie', 35, "Obsession", 2026, 8.2, ["Horror","Thriller"], "https://image.tmdb.org/t/p/w500/bRwnj8WEKBCvmfeUNOukJPwB43K.jpg", "https://image.tmdb.org/t/p/w1280/rZfmzpixLKLR3Hg2u0WgC7XLFl8.jpg"),
  namedItem('movie', 36, "Moana", 2026, 6.1, ["Family","Fantasy","Comedy"], "https://image.tmdb.org/t/p/w500/zKVgiv5qHCvCLT4A2ymJi5QeXDH.jpg", "https://image.tmdb.org/t/p/w1280/c6BPbkO5Npt1OdwttAxCFo06wtH.jpg"),
  namedItem('movie', 37, "Minions & Monsters", 2026, 7.6, ["Adventure","Animation","Comedy"], "https://image.tmdb.org/t/p/w500/4LwvU9SZc8QQzW1X1FAPhNbXnEU.jpg", "https://image.tmdb.org/t/p/w1280/kkcwhgSFd81QDlXo8ytrpHPQjhy.jpg"),
  namedItem('movie', 38, "Colony", 2026, 8.1, ["Action","Horror","Sci-Fi"], "https://image.tmdb.org/t/p/w500/tN799oUR0f1gUKDYdMNrDaY7I51.jpg", "https://image.tmdb.org/t/p/w1280/84FEpVVbSKYvKXDZJDZXOKBxCEm.jpg"),
  namedItem('movie', 39, "Hotel Desire", 2011, 6.2, ["Drama","Romance"], "https://image.tmdb.org/t/p/w500/47XRWH95ATv4szxdWHl723guWXP.jpg", "https://image.tmdb.org/t/p/w1280/wcUohmHc9oDZXarXDp905TYVui4.jpg"),
  namedItem('movie', 40, "Evil Dead Burn", 2026, 7.8, ["Horror"], "https://image.tmdb.org/t/p/w500/uRxrNXQWkHoENm3nwVOZDYSCx2F.jpg", "https://image.tmdb.org/t/p/w1280/o0jkkpcN81QqSl8DMLScBCXyUH9.jpg"),
  namedItem('movie', 41, "Mourning Wife", 2001, 4.5, ["Drama","Romance"], "https://image.tmdb.org/t/p/w500/4cfd33evWkw8TPq95WkHeU82m8O.jpg", "https://image.tmdb.org/t/p/w1280/1KlBjmE84thylby7Y2OuR0ig3rg.jpg"),
  namedItem('movie', 42, "The Death of Robin Hood", 2026, 6.3, ["Adventure","Drama","Action"], "https://image.tmdb.org/t/p/w500/92Tsfx7SFafOqWsotvrlJbHyehd.jpg", "https://image.tmdb.org/t/p/w1280/lh3BDkmWJh998n4fQcHYcVi7dpm.jpg"),
  namedItem('movie', 43, "Backrooms", 2026, 7.1, ["Horror","Mystery","Sci-Fi"], "https://image.tmdb.org/t/p/w500/rhGx6E3qRNMgj3i5su2oukNHwIQ.jpg", "https://image.tmdb.org/t/p/w1280/dqmMWNWfLnExDRpMtIMqI97GQFR.jpg"),
  namedItem('movie', 44, "Pinocchio: Unstrung", 2026, 6.9, ["Horror","Fantasy","Mystery"], "https://image.tmdb.org/t/p/w500/eUJXk3bTvLBi5Zcb0BCedZU7lVL.jpg", "https://image.tmdb.org/t/p/w1280/dNKFETDDujxm2PUN873Jwiw5VML.jpg"),
  namedItem('movie', 45, "Disclosure Day", 2026, 7.5, ["Sci-Fi","Thriller"], "https://image.tmdb.org/t/p/w500/AnJ8IQJI23hNpYXVNaythu061Ru.jpg", "https://image.tmdb.org/t/p/w1280/flxau5Iu7bChQHsESqvGZ3FQRaI.jpg"),
  namedItem('movie', 46, "Rosebush Pruning", 2026, 6.3, ["Comedy","Drama","Thriller"], "https://image.tmdb.org/t/p/w500/tXsTtSgguTsk5J115jokwK55awF.jpg", "https://image.tmdb.org/t/p/w1280/vcZ3UUVmFNk90DBSrTBlTKCdbbE.jpg"),
  namedItem('movie', 47, "The Last House", 2026, 6.9, ["Horror","Sci-Fi","Thriller"], "https://image.tmdb.org/t/p/w500/6JU7E8Vv2M11egkctWVOScxWR75.jpg", "https://image.tmdb.org/t/p/w1280/1RhfevWmWCVHtEqxWBEjPOC5KG1.jpg"),
  namedItem('movie', 48, "Greenland 2: Migration", 2026, 6.4, ["Adventure","Thriller","Sci-Fi"], "https://image.tmdb.org/t/p/w500/z2tqCJLsw6uEJ8nJV8BsQXGa3dr.jpg", "https://image.tmdb.org/t/p/w1280/cLFbDVfhllIMybpo2fkGNzehiQG.jpg"),
  namedItem('movie', 49, "Project Hail Mary", 2026, 8.6, ["Sci-Fi","Adventure"], "https://image.tmdb.org/t/p/w500/yihdXomYb5kTeSivtFndMy5iDmf.jpg", "https://image.tmdb.org/t/p/w1280/8Tfys3mDZVp4tNoH2ktm06a0Tau.jpg"),
  namedItem('movie', 50, "The End of Oak Street", 2026, 6.4, ["Sci-Fi","Mystery","Thriller"], "https://image.tmdb.org/t/p/w500/fYXqpgPmHMphSF2W30GbTeJVIa5.jpg", "https://image.tmdb.org/t/p/w1280/b9q9VmbXDvJmTziRqkwdEmFdwhr.jpg"),
  namedItem('movie', 51, "Shape of My Heart", 2024, 6.2, ["Romance"], "https://image.tmdb.org/t/p/w500/3r0O6BW9USoZ9mteCVyNKMQriRL.jpg", "https://image.tmdb.org/t/p/w1280/yjK3ardrgdS8suZG8KMU82Q7U38.jpg"),
  namedItem('movie', 52, "Scary Movie", 2026, 6.4, ["Comedy"], "https://image.tmdb.org/t/p/w500/znHT8peERZRWG1ME3r0Db0EV8k8.jpg", "https://image.tmdb.org/t/p/w1280/xWBiXclrRmTggQHMRsIn84YHavs.jpg"),
]

const REAL_SHOWS = [
  namedItem('show', 1, "Stranger Things", 2016, 8.7, ["Sci-Fi","Horror","Drama"], "https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg", "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg"),
  namedItem('show', 2, "The Last of Us", 2023, 8.8, ["Drama","Adventure","Horror"], "https://image.tmdb.org/t/p/w500/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg", "https://image.tmdb.org/t/p/w1280/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg"),
  namedItem('show', 3, "The Mandalorian", 2019, 8.6, ["Sci-Fi","Adventure","Action"], "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", "https://image.tmdb.org/t/p/w1280/9zcbqSxdsRMZWHYtyCd1nXPr2xq.jpg"),
  namedItem('show', 4, "The Bear", 2022, 8.6, ["Comedy","Drama"], "https://image.tmdb.org/t/p/w500/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg", "https://image.tmdb.org/t/p/w1280/aJtG4txtmiRHwAAqENQHZvBs6kY.jpg"),
  namedItem('show', 5, "Severance", 2022, 8.7, ["Mystery","Thriller","Drama"], "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg", "https://image.tmdb.org/t/p/w1280/ixgFmf1X59PUZam2qbAfskx2gQr.jpg"),
  namedItem('show', 6, "Shogun", 2024, 8.6, ["Drama","History","Adventure"], "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg", "https://image.tmdb.org/t/p/w1280/bwSmgmd90hCWwqOKQYTEraeOZhJ.jpg"),
  namedItem('show', 7, "The Crown", 2016, 8.6, ["Drama","History"], "https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg", "https://image.tmdb.org/t/p/w1280/8VXhcrl5z2I1zEU9X3pkkNrZlD.jpg"),
  namedItem('show', 8, "Ted Lasso", 2020, 8.8, ["Comedy","Drama"], "https://image.tmdb.org/t/p/w500/uRHsiw1wLxPHFXkkv4Ix1s0O6f4.jpg", "https://image.tmdb.org/t/p/w1280/nE94ejEbzNCU48bW1oju0dqBONz.jpg"),
  namedItem('show', 9, "The Boys", 2019, 8.7, ["Action","Comedy","Sci-Fi"], "https://image.tmdb.org/t/p/w500/in1R2dDc421JxsoRWaIIAqVI2KE.jpg", "https://image.tmdb.org/t/p/w1280/n6vVs6z8obNbExdD3QHTr4Utu1Z.jpg"),
  namedItem('show', 10, "Wednesday", 2022, 8.1, ["Comedy","Fantasy","Mystery"], "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", "https://image.tmdb.org/t/p/w1280/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg"),
  namedItem('show', 11, "The Witcher", 2019, 8.1, ["Fantasy","Adventure","Action"], "https://image.tmdb.org/t/p/w500/AoGsDM02UVt0npBA8OvpDcZbaMi.jpg", "https://image.tmdb.org/t/p/w1280/foGkPxpw9h8zln81j63mix5B7m8.jpg"),
  namedItem('show', 12, "Slow Horses", 2022, 8.3, ["Thriller","Drama"], "https://image.tmdb.org/t/p/w500/w2jauz2PeSjFQifDObI3qDen4f7.jpg", "https://image.tmdb.org/t/p/w1280/bDfboQUb45Cv9MYyVBDZw8M8xSM.jpg"),
  namedItem('show', 13, "Only Murders in the Building", 2021, 8.1, ["Comedy","Mystery","Crime"], "https://image.tmdb.org/t/p/w500/1yjFVQZuW8aofZ5Cgol8iImsVFp.jpg", "https://image.tmdb.org/t/p/w1280/WCnEPf4ZNPjszndmrFlDxZ5Uvd.jpg"),
  namedItem('show', 14, "Bluey", 2018, 9.4, ["Animation","Family","Comedy"], "https://image.tmdb.org/t/p/w500/9p4pNoGcuyCfHcGWKNrTopqMWtq.jpg", "https://image.tmdb.org/t/p/w1280/lGFW6yOgVY9P9KqhiaPQfioPZ1c.jpg"),
  namedItem('show', 15, "Avatar: The Last Airbender", 2005, 9.3, ["Animation","Adventure","Family"], "https://image.tmdb.org/t/p/w500/yaGt4GIutpbXHsv48tWceWg6s56.jpg", "https://image.tmdb.org/t/p/w1280/7oBGhqJIghRBvOwo5Qe0yM0cnMc.jpg"),
  namedItem('show', 16, "The Office", 2005, 9, ["Comedy"], "https://image.tmdb.org/t/p/w500/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg", "https://image.tmdb.org/t/p/w1280/mLyW3UTgi2lsMdtueYODcfAB9Ku.jpg"),
  namedItem('show', 17, "Reacher", 2022, 8.1, ["Action","Adventure","Crime"], "https://image.tmdb.org/t/p/w500/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg", "https://image.tmdb.org/t/p/w1280/pF0qkRsrHkdYadPWY9AMeFZfcwk.jpg"),
  namedItem('show', 18, "The Mentalist", 2008, 8.4, ["Crime","Drama","Mystery"], "https://image.tmdb.org/t/p/w500/acYXu4KaDj1NIkMgObnhe4C4a0T.jpg", "https://image.tmdb.org/t/p/w1280/q3pCsNvJ7CmdJUz2sJEEUY3pOPC.jpg"),
  namedItem('show', 19, "Lioness", 2023, 8.1, ["Drama","War"], "https://image.tmdb.org/t/p/w500/rzpHPSEgPTpRs8EHbygwsOw7jC0.jpg", "https://image.tmdb.org/t/p/w1280/4NBYDOnEjAzyuP7CMkD5s7fs44K.jpg"),
  namedItem('show', 20, "Outer Banks", 2020, 8.2, ["Action","Adventure","Mystery"], "https://image.tmdb.org/t/p/w500/ovDgO2LPfwdVRfvScAqo9aMiIW.jpg", "https://image.tmdb.org/t/p/w1280/fjJ0aqDeDXFzmFXXJ4CF3ryB19b.jpg"),
  namedItem('show', 21, "Lanterns", 2026, 8.2, ["Drama","Mystery","Sci-Fi"], "https://image.tmdb.org/t/p/w500/gpC7h43xPMEV3goYMQShfJbTtLq.jpg", "https://image.tmdb.org/t/p/w1280/mdbWfpbWhvxgG3k5MHpo90UgAUe.jpg"),
  namedItem('show', 22, "Paradise Hotel", 2005, 5.6, ["Drama"], "https://image.tmdb.org/t/p/w500/ycSBcACecVR0zSnP2ZF83k5f7he.jpg", "https://image.tmdb.org/t/p/w1280/nun8Ssmni886Ib4v7chgQbswDfl.jpg"),
  namedItem('show', 23, "Tagesschau", 1952, 6.8, ["Drama"], "https://image.tmdb.org/t/p/w500/7dFZJ2ZJJdcmkp05B9NWlqTJ5tq.jpg", "https://image.tmdb.org/t/p/w1280/jWXrQstj7p3Wl5MfYWY6IHqRpDb.jpg"),
  namedItem('show', 24, "Silo", 2023, 8.2, ["Sci-Fi","Fantasy","Drama"], "https://image.tmdb.org/t/p/w500/gMYZZvnkVNTqSVnVCphWbPXwWwb.jpg", "https://image.tmdb.org/t/p/w1280/uTWhbLc7Bj4qNSdW3ZvZKL8cOHv.jpg"),
  namedItem('show', 25, "Law & Order: Special Victims Unit", 1999, 8, ["Crime","Drama","Mystery"], "https://image.tmdb.org/t/p/w500/iofokHZoUB4Qhik4PflvJl8TT6a.jpg", "https://image.tmdb.org/t/p/w1280/obtdxPgmfykYwVnvuYXC5f2xKlQ.jpg"),
  namedItem('show', 26, "Gran hermano", 2001, 4.5, ["Drama"], "https://image.tmdb.org/t/p/w500/snIRCY6Qhei08YUNQjjZI2gc4CK.jpg", "https://image.tmdb.org/t/p/w1280/1E8PabwfDIaxREyfe9fxfINqauu.jpg"),
  namedItem('show', 27, "Family Guy", 1999, 7.4, ["Animation","Comedy"], "https://image.tmdb.org/t/p/w500/3PFsEuAiyLkWsP4GG6dIV37Q6gu.jpg", "https://image.tmdb.org/t/p/w1280/l7wShoIdIUwaDIbsHno9pO5MZXT.jpg"),
  namedItem('show', 28, "The Rookie", 2018, 8.5, ["Crime","Drama","Comedy"], "https://image.tmdb.org/t/p/w500/70kTz0OmjjZe7zHvIDrq2iKW7PJ.jpg", "https://image.tmdb.org/t/p/w1280/6iNWfGVCEfASDdlNb05TP5nG0ll.jpg"),
  namedItem('show', 29, "Grey's Anatomy", 2005, 8.2, ["Drama"], "https://image.tmdb.org/t/p/w500/hjJkrLXhWvGHpLeLBDFznpBTY1S.jpg", "https://image.tmdb.org/t/p/w1280/jP0Rhj9OTPDAwQlHQwOLFDdeE8t.jpg"),
  namedItem('show', 30, "The Simpsons", 1989, 8, ["Animation","Comedy"], "https://image.tmdb.org/t/p/w500/uWpG7GqfKGQqX4YMAo3nv5OrglV.jpg", "https://image.tmdb.org/t/p/w1280/jIArNHIekrCSVgdMbKPAXpPY03Y.jpg"),
  namedItem('show', 31, "Watch What Happens Live with Andy Cohen", 2009, 4.9, ["Comedy"], "https://image.tmdb.org/t/p/w500/onSD9UXfJwrMXWhq7UY7hGF2S1h.jpg", "https://image.tmdb.org/t/p/w1280/hINekSpbcBxjnjGqmIm6I4bz2ab.jpg"),
  namedItem('show', 32, "The Tonight Show Starring Jimmy Fallon", 2014, 5.8, ["Comedy"], "https://image.tmdb.org/t/p/w500/1N4o5PmmqhlVDrcdJ2RlCFWbLGX.jpg", "https://image.tmdb.org/t/p/w1280/7VO04TtL1jIT6XOPs9u4jdB8KaB.jpg"),
  namedItem('show', 33, "House of the Dragon", 2022, 8.4, ["Sci-Fi","Fantasy","Drama"], "https://image.tmdb.org/t/p/w500/7V0Ebks0GgpKvQ7QbLAIdX5dos4.jpg", "https://image.tmdb.org/t/p/w1280/577eXC8wFQT0eUrJcgznSiFPRmk.jpg"),
  namedItem('show', 34, "NCIS", 2003, 7.6, ["Crime","Drama","Action"], "https://image.tmdb.org/t/p/w500/mBcu8d6x6zB1el3MPNl7cZQEQ31.jpg", "https://image.tmdb.org/t/p/w1280/nn3SuLTO4hum8yAxaY4ql8h6kRk.jpg"),
  namedItem('show', 35, "Supernatural", 2005, 8.3, ["Drama","Mystery","Sci-Fi"], "https://image.tmdb.org/t/p/w500/8iixmfGx5EIFPdpNvB2JvI3VIqX.jpg", "https://image.tmdb.org/t/p/w1280/ro0tlgnsco4SwbdAgmscLkSlMSL.jpg"),
  namedItem('show', 36, "Criminal Minds", 2005, 8.3, ["Crime","Drama","Mystery"], "https://image.tmdb.org/t/p/w500/hWSb4UnIjlTvnvrP98NbFSO60HA.jpg", "https://image.tmdb.org/t/p/w1280/tUtXfyVy54BY7eJnRtI8Xnmr1ZL.jpg"),
]

const MOVIES = [...REAL_MOVIES]
const SHOWS = [...REAL_SHOWS]

function seasonsFor(item, index) {
  const known = {
    'The Office': 9,
    'The Simpsons': 8,
    "Grey's Anatomy": 7,
    Supernatural: 6,
    NCIS: 6,
    'Criminal Minds': 5,
    'Family Guy': 5,
    "Law & Order: Special Victims Unit": 6,
    'The Rookie': 4,
    'Avatar: The Last Airbender': 3,
    'House of the Dragon': 2,
    Reacher: 3,
    Silo: 2,
    'Outer Banks': 4,
  }
  const seasonCount = known[item.title] ?? 1 + (index % 3)
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
        thumb_url: item.backdrop_url || `/art/thumb/${item.id}?s=${seasonNumber}&e=${number}`,
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
    backdrop_url: item.backdrop_url || `/art/backdrop/${item.id}?v=2`,
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
