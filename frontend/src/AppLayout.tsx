import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { Header } from './components/Header'
import { MobileDock } from './components/MobileDock'
import { RemindToast } from './components/RemindToast'
import { SiteFooter } from './components/SiteFooter'
import { playBrowseSting } from './lib/sounds'
import { useProfiles } from './profiles/ProfileContext'
import { TitleModal } from './title/TitleModal'
import { WatchOverlay } from './watch/WatchOverlay'

export function AppLayout() {
  const { user } = useAuth()
  const { activeProfile } = useProfiles()
  const location = useLocation()
  const entering = Boolean((location.state as { fromProfile?: boolean } | null)?.fromProfile)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!activeProfile) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={`app-shell ${entering ? 'is-entering' : ''}`} onPointerDownCapture={() => playBrowseSting()}>
      <Header />
      <Outlet />
      <SiteFooter />
      <MobileDock />
      <TitleModal />
      <WatchOverlay />
      <RemindToast />
    </div>
  )
}
