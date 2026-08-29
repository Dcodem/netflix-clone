/** Netflix-like intro/recap windows, scaled to episode length. */
export function skipMarks(runtimeSec: number) {
  if (runtimeSec <= 12 * 60) {
    return { introAt: 16, introUntil: 26, recapAt: 0, recapUntil: 0 }
  }
  if (runtimeSec <= 30 * 60) {
    return { introAt: 35, introUntil: 52, recapAt: 0, recapUntil: 0 }
  }
  return { introAt: 80, introUntil: 110, recapAt: 148, recapUntil: 155 }
}
