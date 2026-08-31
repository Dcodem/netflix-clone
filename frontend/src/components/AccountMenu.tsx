import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useHoverMenu } from '../hooks/useHoverMenu'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor } from '../profiles/types'
import { AvatarArt } from './AvatarArt'
import { CaretIcon, CheckIcon, ExitIcon, HelpCircleIcon, MyNetflixIcon, PencilIcon, PersonIcon, TransferIcon } from './Icons'
import { TransferProfileDialog } from './TransferProfileDialog'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const { profiles, activeProfile, clearActive, selectProfile } = useProfiles()
  const navigate = useNavigate()
  const { open, setOpen, rootRef, onEnter, onLeave, toggle } = useHoverMenu()
  const [transferOpen, setTransferOpen] = useState(false)
  const phone = useMediaQuery('(max-width: 767px)')

  if (!user || !activeProfile) return null

  const avatar = avatarFor(activeProfile)

  if (phone) {
    return (
      <div className="account-menu">
        <Link to="/browse/my-netflix" className="profile-chip" aria-label="My Netflix">
          <span className="avatar-dot" style={{ background: avatar.color }}>
            <AvatarArt avatar={avatar} alt={activeProfile.name} />
          </span>
        </Link>
      </div>
    )
  }

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
          {profiles.map((profile) => {
            const art = avatarFor(profile)
            const current = profile.id === activeProfile.id
            return (
              <button
                type="button"
                key={profile.id}
                className={`account-profile-row ${current ? 'is-current' : ''}`}
                onClick={() => {
                  setOpen(false)
                  if (current) return
                  if (profile.pinHash) {
                    try {
                      sessionStorage.setItem('flix.unlockProfile', profile.id)
                    } catch {
                      /* quota */
                    }
                    clearActive()
                    navigate('/', { state: { pinProfileId: profile.id } })
                    return
                  }
                  selectProfile(profile.id)
                }}
              >
                <span className="avatar-dot" style={{ background: art.color }}>
                  <AvatarArt avatar={art} alt={profile.name} />
                </span>
                <span className="account-profile-name">{profile.name}</span>
                {current ? <CheckIcon className="account-check" /> : null}
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
          <Link to="/browse/my-netflix" onClick={() => setOpen(false)}>
            <MyNetflixIcon className="icon" />
            My Netflix
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
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setTransferOpen(true)
            }}
          >
            <TransferIcon className="icon" />
            Transfer Profile
          </button>
          <Link to="/account" onClick={() => setOpen(false)}>
            <PersonIcon className="icon" />
            Account
          </Link>
          <Link to="/help" onClick={() => setOpen(false)}>
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
      <TransferProfileDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  )
}
