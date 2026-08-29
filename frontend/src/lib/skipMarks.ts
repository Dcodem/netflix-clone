function genreSet(genres: string[] = []) {
  return new Set(genres.map((genre) => genre.toLowerCase()))
}

function kidsShort(genres: string[] = []) {
  const set = genreSet(genres)
  if (set.has('kids') || set.has('children')) return true
  return set.has('family') && set.has('comedy') && !set.has('adventure') && !set.has('action')
}

/** Netflix-like intro/recap windows, scaled to episode length and kids titles. */
export function skipMarks(runtimeSec: number, genres: string[] = []) {
  if (kidsShort(genres) || runtimeSec <= 12 * 60) {
    return { introAt: 16, introUntil: 26, recapAt: 0, recapUntil: 0 }
  }
  if (runtimeSec <= 30 * 60) {
    return { introAt: 35, introUntil: 52, recapAt: 0, recapUntil: 0 }
  }
  return { introAt: 80, introUntil: 110, recapAt: 148, recapUntil: 155 }
}
