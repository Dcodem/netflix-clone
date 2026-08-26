import { useEffect, useRef, useState } from 'react'
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
  const [searchOpen, setSearchOpen] = useState(Boolean(urlQuery))
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
      if (location.pathname !== '/search' || searchParams.get('q') !== debounced) {
        navigate(`/search?q=${encodeURIComponent(debounced)}`)
      }
      return
    }
    if (!debounced && location.pathname === '/search') {
      navigate('/browse')
    }
  }, [debounced, location.pathname, navigate, searchParams])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node) && !query) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, query])

  function toggleSearch() {
    setSearchOpen(true)
    window.setTimeout(() => inputRef.current?.focus(), 20)
  }

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
          <NavLink className="nav-link" to="/browse/shows">
            TV Shows
          </NavLink>
          <NavLink className="nav-link" to="/browse/movies">
            Movies
          </NavLink>
          <NavLink className="nav-link" to="/browse/latest">
            New &amp; Popular
          </NavLink>
          <NavLink className="nav-link" to="/browse/my-list">
            My List
          </NavLink>
        </nav>
        <div className="header-tools">
          <div className={`search-wrap ${open ? 'is-open' : ''}`} ref={searchRef}>
            <button
              type="button"
              className="search-toggle"
              aria-label="Search"
              onClick={toggleSearch}
            >
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
