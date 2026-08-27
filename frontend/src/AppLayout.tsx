import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { Header } from './components/Header'
import { SiteFooter } from './components/SiteFooter'
import { useProfiles } from './profiles/ProfileContext'
import { TitleModal } from './title/TitleModal'
import { WatchOverlay } from './watch/WatchOverlay'

export function AppLayout() {
  const { user } = useAuth()
  const { activeProfile } = useProfiles()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!activeProfile) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="app-shell">
      <Header />
      <Outlet />
      <SiteFooter />
      <TitleModal />
      <WatchOverlay />
    </div>
  )
}
