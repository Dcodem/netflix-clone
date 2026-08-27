import { Link, useNavigate } from 'react-router-dom'
import { AvatarArt } from './AvatarArt'
import { useAuth } from '../auth/AuthContext'
import { useHoverMenu } from '../hooks/useHoverMenu'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor } from '../profiles/types'
import { CaretIcon, CheckIcon } from './Icons'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const { profiles, activeProfile, clearActive, selectProfile } = useProfiles()
  const navigate = useNavigate()
  const { open, setOpen, rootRef, onEnter, onLeave, toggle } = useHoverMenu()

  if (!user || !activeProfile) return null

  const avatar = avatarFor(activeProfile)
  const others = profiles.filter((profile) => profile.id !== activeProfile.id)

  return (
    <div
      className={`account-menu ${open ? 'is-open' : ''}`}
      ref={rootRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button type="button" className="profile-chip" onClick={toggle} aria-label="Account menu" aria-expanded={open}>
        <span className="avatar-dot" style={{ background: avatar.color }}>
          <AvatarArt avatar={avatar} alt={activeProfile.name} />
        </span>
        <CaretIcon className="profile-caret" />
      </button>
      {open ? (
        <div className="account-dropdown">
          <div className="account-profile-row is-current">
            <span className="avatar-dot" style={{ background: avatar.color }}>
              <AvatarArt avatar={avatar} alt={activeProfile.name} />
            </span>
            <span className="account-profile-name">{activeProfile.name}</span>
            <CheckIcon className="account-check" />
          </div>
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
                <span className="account-profile-name">{profile.name}</span>
              </button>
            )
          })}
          <Link
            to="/"
            onClick={() => {
              setOpen(false)
              clearActive()
            }}
          >
            Manage Profiles
          </Link>
          <div className="account-dropdown-rule" />
          <Link to="/account" onClick={() => setOpen(false)}>
            Transfer Profile
          </Link>
          <Link to="/account" onClick={() => setOpen(false)}>
            Account
          </Link>
          <Link to="/account" onClick={() => setOpen(false)}>
            Help Center
          </Link>
          <Link to="/taste" onClick={() => setOpen(false)}>
            Taste profile
          </Link>
          <button
            type="button"
            onClick={() => {
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
