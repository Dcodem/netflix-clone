import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { Header } from './components/Header'
import { useProfiles } from './profiles/ProfileContext'
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
      <WatchOverlay />
    </div>
  )
}
