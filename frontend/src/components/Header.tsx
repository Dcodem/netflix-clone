import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { AccountMenu } from './AccountMenu'

export function Header() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const urlQuery = location.pathname === '/search' ? (searchParams.get('q') ?? '') : ''
  const [query, setQuery] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    setQuery(urlQuery)
  }
  const [scrolled, setScrolled] = useState(false)
  const debounced = useDebouncedValue(query.trim(), 350)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (debounced.length >= 2) {
      if (location.pathname !== '/search' || searchParams.get('q') !== debounced) {
        navigate(`/search?q=${encodeURIComponent(debounced)}`)
      }
      return
    }
    if (!debounced && location.pathname === '/search') {
      navigate('/browse')
    }
  }, [debounced, location.pathname, navigate, searchParams])

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <Link className="logo" to="/browse">
          <span className="logo-accent">F</span>LIX
        </Link>
        <nav className="primary-nav" aria-label="Browse">
          <NavLink className="nav-link" to="/browse" end>
            Home
          </NavLink>
          <NavLink className="nav-link" to="/browse/movies">
            Movies
          </NavLink>
          <NavLink className="nav-link" to="/browse/shows">
            TV Shows
          </NavLink>
          <NavLink className="nav-link" to="/taste">
            Taste
          </NavLink>
        </nav>
        <label className="search-wrap">
          <span className="search-ico" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search titles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search"
          />
        </label>
        <AccountMenu />
      </div>
    </header>
  )
}
