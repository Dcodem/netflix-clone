import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useHoverMenu } from '../hooks/useHoverMenu'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor } from '../profiles/types'
import { AvatarArt } from './AvatarArt'
import { CaretIcon, ExitIcon, HelpCircleIcon, PencilIcon, PersonIcon, TransferIcon } from './Icons'

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
            className="account-manage"
            state={{ manage: true }}
            onClick={() => setOpen(false)}
          >
            <PencilIcon className="icon" />
            Manage Profiles
          </Link>
          <div className="account-dropdown-rule" />
          <Link
            to="/"
            onClick={() => {
              setOpen(false)
              clearActive()
            }}
          >
            <ExitIcon className="icon" />
            Exit Profile
          </Link>
          <Link to="/account" onClick={() => setOpen(false)}>
            <TransferIcon className="icon" />
            Transfer Profile
          </Link>
          <Link to="/account" onClick={() => setOpen(false)}>
            <PersonIcon className="icon" />
            Account
          </Link>
          <Link to="/account" onClick={() => setOpen(false)}>
            <HelpCircleIcon className="icon" />
            Help Center
          </Link>
          <div className="account-dropdown-rule" />
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
