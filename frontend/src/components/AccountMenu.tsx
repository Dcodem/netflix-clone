import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AvatarArt } from './AvatarArt'
import { useAuth } from '../auth/AuthContext'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor } from '../profiles/types'
import { CaretIcon } from './Icons'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const { profiles, activeProfile, clearActive, selectProfile } = useProfiles()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  if (!user || !activeProfile) return null

  const avatar = avatarFor(activeProfile)
  const others = profiles.filter((profile) => profile.id !== activeProfile.id)

  return (
    <div className={`account-menu ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button type="button" className="profile-chip" onClick={() => setOpen((value) => !value)} aria-label="Account menu">
        <span className="avatar-dot" style={{ background: avatar.color }}>
          <AvatarArt avatar={avatar} alt={activeProfile.name} />
        </span>
        <CaretIcon className="profile-caret" />
      </button>
      {open ? (
        <div className="account-dropdown">
          {others.map((profile) => {
            const other = avatarFor(profile)
            return (
              <button
                type="button"
                key={profile.id}
                className="account-profile-row"
                onClick={() => {
                  setOpen(false)
                  if (profile.pinHash) {
                    clearActive()
                    navigate('/')
                    return
                  }
                  selectProfile(profile.id)
                }}
              >
                <span className="avatar-dot" style={{ background: other.color }}>
                  <AvatarArt avatar={other} alt={profile.name} />
                </span>
                {profile.name}
              </button>
            )
          })}
          <Link to="/" onClick={() => setOpen(false)}>
            Manage Profiles
          </Link>
          <div className="account-dropdown-rule" />
          <Link to="/taste" onClick={() => setOpen(false)}>
            Taste profile
          </Link>
          <Link to="/account" onClick={() => setOpen(false)}>
            Account
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              clearActive()
              logout()
              navigate('/login')
            }}
          >
            Sign out of Flix
          </button>
        </div>
      ) : null}
    </div>
  )
}
