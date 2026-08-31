import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AvatarArt } from './components/AvatarArt'
import { Header } from './components/Header'
import { MobileDock } from './components/MobileDock'
import { RemindToast } from './components/RemindToast'
import { SiteFooter } from './components/SiteFooter'
import { playBrowseSting } from './lib/sounds'
import { useProfiles } from './profiles/ProfileContext'
import { avatarFor } from './profiles/types'
import { TitleModal } from './title/TitleModal'
import { WatchOverlay } from './watch/WatchOverlay'

export function AppLayout() {
  const { user } = useAuth()
  const { activeProfile } = useProfiles()
  const location = useLocation()
  const navigate = useNavigate()
  const fromProfile = Boolean((location.state as { fromProfile?: boolean } | null)?.fromProfile)
  const [gate, setGate] = useState(fromProfile)
  const [gateOut, setGateOut] = useState(false)

  useEffect(() => {
    if (!fromProfile || !activeProfile) return
    const fade = window.setTimeout(() => setGateOut(true), 1180)
    const done = window.setTimeout(() => {
      setGate(false)
      setGateOut(false)
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
    }, 1540)
    return () => {
      window.clearTimeout(fade)
      window.clearTimeout(done)
    }
  }, [fromProfile, activeProfile, location.pathname, location.search, navigate])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!activeProfile) {
    return <Navigate to="/" replace state={location.state} />
  }

  return (
    <div
      className={`app-shell ${gate ? 'is-entering' : ''} ${gateOut ? 'is-gate-out' : ''}`}
      onPointerDownCapture={() => playBrowseSting()}
    >
      <Header />
      <Outlet />
      <SiteFooter />
      <MobileDock />
      <TitleModal />
      <WatchOverlay />
      <RemindToast />
      {gate ? (
        <div className={`profile-gate ${gateOut ? 'is-out' : ''}`} role="status" aria-live="polite">
          <span className="profile-gate-avatar" style={{ background: avatarFor(activeProfile).color }}>
            <AvatarArt avatar={avatarFor(activeProfile)} alt="" />
          </span>
          <p className="profile-gate-name">{activeProfile.name}</p>
        </div>
      ) : null}
    </div>
  )
}
