import { NavLink } from 'react-router-dom'
import { HomeIcon, MyNetflixIcon, NewsIcon } from './Icons'

const TABS = [
  { to: '/browse', label: 'Home', icon: HomeIcon, end: true },
  { to: '/browse/latest', label: 'News & Hot', icon: NewsIcon, end: false },
  { to: '/browse/my-netflix', label: 'My Netflix', icon: MyNetflixIcon, end: false },
] as const

export function MobileDock() {
  return (
    <nav className="mobile-dock" aria-label="Mobile">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className="mobile-dock-link">
          <tab.icon className="icon" />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
