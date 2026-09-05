import { useProfileSync } from './useProfileSync'

/**
 * Runs inside ProfileProvider: keeps profiles/watch-history backed up to the
 * server and restores them from the recovery cookie on a fresh browser.
 */
export function ProfileSync() {
  useProfileSync()
  return null
}
