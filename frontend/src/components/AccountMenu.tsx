import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useProfiles } from '../profiles/ProfileContext'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const { activeProfile, clearActive } = useProfiles()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!user || !activeProfile) return null

  return (
    <div className="account-menu" ref={rootRef}>
      <button type="button" className="profile-chip" onClick={() => setOpen((value) => !value)}>
        <span className="avatar-dot" style={{ background: activeProfile.color }}>
          {activeProfile.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="profile-chip-name">{activeProfile.name}</span>
      </button>
      {open ? (
        <div className="account-dropdown">
          <p className="account-dropdown-email">{user.email}</p>
          <Link to="/taste" onClick={() => setOpen(false)}>
            Taste profile
          </Link>
          <Link to="/account" onClick={() => setOpen(false)}>
            Account &amp; trailers
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              clearActive()
              navigate('/')
            }}
          >
            Switch profile
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              clearActive()
              logout()
              navigate('/login')
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
