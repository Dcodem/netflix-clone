import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { pushRecentSearch } from '../lib/recentSearch'
import { AccountMenu } from './AccountMenu'

const NAV = [
  { to: '/browse', label: 'Home', end: true },
  { to: '/browse/shows', label: 'TV Shows' },
  { to: '/browse/movies', label: 'Movies' },
  { to: '/browse/latest', label: 'New & Popular' },
  { to: '/browse/my-list', label: 'My List' },
] as const

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
  const [searchOpen, setSearchOpen] = useState(Boolean(urlQuery) || location.pathname === '/search')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounced = useDebouncedValue(query.trim(), 350)
  const open = searchOpen || Boolean(query) || location.pathname === '/search'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (debounced.length >= 2) {
      pushRecentSearch(debounced)
      if (location.pathname !== '/search' || searchParams.get('q') !== debounced) {
        navigate(`/search?q=${encodeURIComponent(debounced)}`)
      }
      return
    }
    if (location.pathname === '/search' && searchParams.get('q')) {
      navigate('/search')
    }
  }, [debounced, location.pathname, navigate, searchParams])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node) && !query && location.pathname !== '/search') {
        setSearchOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open, query, location.pathname])

  useEffect(() => {
    if (location.pathname !== '/search' && !query.trim()) setSearchOpen(false)
  }, [location.pathname, query])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (event.key === '/' && !typing) {
        event.preventDefault()
        setSearchOpen(true)
        if (location.pathname !== '/search') navigate('/search')
        window.setTimeout(() => inputRef.current?.focus(), 20)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [location.pathname, navigate])

  function toggleSearch() {
    setSearchOpen(true)
    if (location.pathname !== '/search') navigate('/search')
    window.setTimeout(() => inputRef.current?.focus(), 20)
  }

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <Link className="logo" to="/browse">
          <span className="logo-accent">F</span>LIX
        </Link>
        <details className="browse-menu">
          <summary>Browse</summary>
          <div className="browse-menu-list">
            {NAV.map((link) => (
              <NavLink
                key={link.to}
                className="nav-link"
                to={link.to}
                end={'end' in link ? link.end : false}
                onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </details>
        <nav className="primary-nav" aria-label="Browse">
          {NAV.map((link) => (
            <NavLink key={link.to} className="nav-link" to={link.to} end={'end' in link ? link.end : false}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-tools">
          <div className={`search-wrap ${open ? 'is-open' : ''}`} ref={searchRef}>
            <button type="button" className="search-toggle" aria-label="Search" onClick={toggleSearch}>
              ⌕
            </button>
            {open ? (
              <input
                ref={inputRef}
                type="search"
                placeholder="Titles, people, genres"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search"
              />
            ) : null}
          </div>
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
