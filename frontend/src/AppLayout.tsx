import { Navigate, Outlet } from 'react-router-dom'
import { Header } from './components/Header'
import { useProfiles } from './profiles/ProfileContext'
import { WatchOverlay } from './watch/WatchOverlay'

export function AppLayout() {
  const { activeProfile } = useProfiles()

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
