import { useEffect, useMemo, useState } from 'react'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor, type Profile } from '../profiles/types'
import { AvatarArt } from './AvatarArt'
import { CloseIcon } from './Icons'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function codeKey(profileId: string) {
  return `flix.transferCode.${profileId}`
}

function makeCode() {
  let raw = ''
  for (let i = 0; i < 8; i++) raw += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

function readCode(profileId: string) {
  try {
    const stored = localStorage.getItem(codeKey(profileId))
    if (stored && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(stored)) return stored
  } catch {
    /* ignore */
  }
  const next = makeCode()
  try {
    localStorage.setItem(codeKey(profileId), next)
  } catch {
    /* ignore */
  }
  return next
}

export function TransferProfileDialog({
  open,
  onClose,
  lockedProfile,
}: {
  open: boolean
  onClose: () => void
  lockedProfile?: Profile | null
}) {
  const { profiles } = useProfiles()
  const [pickedId, setPickedId] = useState<string | null>(lockedProfile?.id ?? null)
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState('')
  const picked = useMemo(
    () => profiles.find((profile) => profile.id === pickedId) ?? lockedProfile ?? null,
    [lockedProfile, pickedId, profiles],
  )

  useEffect(() => {
    if (!open) return
    setPickedId(lockedProfile?.id ?? null)
    setCopied(false)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lockedProfile?.id, onClose, open])

  useEffect(() => {
    if (picked) setCode(readCode(picked.id))
    else setCode('')
  }, [picked])

  if (!open) return null

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code.replace('-', ''))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="cookie-prefs" role="presentation" onClick={onClose}>
      <div
        className="cookie-prefs-card transfer-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cookie-prefs-head">
          <h2 id="transfer-title">Transfer Profile</h2>
          <button type="button" className="cookie-prefs-close" aria-label="Close" onClick={onClose}>
            <CloseIcon className="icon" />
          </button>
        </div>
        <div className="cookie-prefs-body">
          {picked ? (
            <>
              <p>
                On the other FLIX account, go to Account and enter this code to copy{' '}
                <strong>{picked.name}</strong>. The profile stays on this account until that
                account accepts.
              </p>
              <p className="transfer-code" aria-label={`Transfer code ${code}`}>
                {code}
              </p>
              <div className="transfer-actions">
                <button type="button" className="btn btn-primary" onClick={() => void copyCode()}>
                  {copied ? 'Copied' : 'Copy code'}
                </button>
                {!lockedProfile ? (
                  <button type="button" className="account-change" onClick={() => setPickedId(null)}>
                    Choose a different profile
                  </button>
                ) : null}
                <button type="button" className="account-change" onClick={onClose}>
                  Done
                </button>
              </div>
              <p className="transfer-note">
                This demo does not move profiles to another account. The code is only for this
                device.
              </p>
            </>
          ) : (
            <>
              <p>Choose a profile to copy to another FLIX account.</p>
              <div className="transfer-profiles">
                {profiles.map((profile) => {
                  const avatar = avatarFor(profile)
                  return (
                    <button
                      type="button"
                      key={profile.id}
                      className="transfer-profile"
                      onClick={() => setPickedId(profile.id)}
                    >
                      <span className="avatar-dot" style={{ background: avatar.color }}>
                        <AvatarArt avatar={avatar} alt="" />
                      </span>
                      <span>{profile.name}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
