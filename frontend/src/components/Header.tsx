import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { isLiveSearchInput, pushRecentSearch } from '../lib/recentSearch'
import { useProfiles } from '../profiles/ProfileContext'
import { AccountMenu } from './AccountMenu'
import { CastMenu } from './CastMenu'
import { NotificationsMenu } from './NotificationsMenu'
import { ChevronLeftIcon, CloseIcon, SearchIcon } from './Icons'

const NAV = [
  { to: '/browse', label: 'Home', end: true },
  { to: '/browse/shows', label: 'TV Shows' },
  { to: '/browse/movies', label: 'Movies' },
  { to: '/browse/latest', label: 'New & Popular' },
  { to: '/browse/my-list', label: 'My List' },
  { to: '/browse/languages', label: 'Browse by Languages' },
] as const

export function Header() {
  const { activeProfile } = useProfiles()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const urlQuery = location.pathname === '/search' ? (searchParams.get('q') ?? '') : ''
  const [query, setQuery] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  useEffect(() => {
    if (urlQuery === syncedQuery) return
    setSyncedQuery(urlQuery)
    setQuery(urlQuery)
  }, [urlQuery, syncedQuery])
  const [scrolled, setScrolled] = useState(false)
  const phone = useMediaQuery('(max-width: 767px)')
  const [searchOpen, setSearchOpen] = useState(Boolean(urlQuery) || location.pathname === '/search')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const browseRef = useRef<HTMLDetailsElement>(null)
  const debounced = useDebouncedValue(query.trim(), 140)
  const open = searchOpen || Boolean(query) || location.pathname === '/search'
  const heroPath =
    location.pathname === '/browse' ||
    location.pathname === '/browse/shows' ||
    location.pathname === '/browse/movies'
  const opaque = scrolled || open || !heroPath

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const live = query.trim()
    if (live.length < 2) {
      // Do NOT rewrite the URL here. Stripping `?q=` on empty input races with
      // back/leave navigation (it re-navigated to /search after the user left).
      // The Search page renders recents fine with no `q` param.
      return
    }
    // Only drive the URL while the user is actually ON the search page.
    // Navigating away (logo, nav links) must never get hijacked back here.
    if (location.pathname !== '/search') return
    if (debounced !== live) return
    if (!isLiveSearchInput(debounced)) return
    pushRecentSearch(debounced)
    if (searchParams.get('q') !== debounced) {
      navigate(`/search?q=${encodeURIComponent(debounced)}`, { replace: true })
    }
  }, [debounced, query, urlQuery, syncedQuery, location.pathname, navigate, searchParams])

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
    window.setTimeout(() => {
      if (location.pathname !== '/search') navigate('/search')
      inputRef.current?.focus()
    }, 160)
  }

  function clearQuery() {
    setQuery('')
    if (location.pathname === '/search') navigate('/search')
  }

  function leaveSearch() {
    setQuery('')
    setSearchOpen(false)
    if (location.pathname === '/search') navigate('/browse', { replace: true })
  }

  function syncBrowseCaret() {
    const root = browseRef.current
    const summary = root?.querySelector('summary')
    if (!root?.open || !summary) return
    const rect = summary.getBoundingClientRect()
    root.style.setProperty('--caret-x', `${Math.round(rect.left + rect.width / 2)}px`)
  }

  if (!activeProfile) return null

  return (
    <header className={`site-header ${opaque ? 'is-scrolled' : ''} ${open ? 'is-searching' : ''}`}>
      <div className="header-inner">
        <button type="button" className="search-back" onClick={leaveSearch} aria-label="Back">
          <ChevronLeftIcon className="icon" />
        </button>
        <Link
          className="logo"
          to="/browse"
          onClick={(event) => {
            if (location.pathname === '/search' || query) {
              event.preventDefault()
              leaveSearch()
            }
          }}
        >
          FLIX
        </Link>
        <details className="browse-menu" ref={browseRef} onToggle={syncBrowseCaret}>
          <summary>Browse</summary>
          <button
            type="button"
            className="browse-menu-scrim"
            aria-label="Close browse menu"
            tabIndex={-1}
            onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
          />
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
            <NavLink
              key={link.to}
              className="nav-link"
              to={link.to}
              end={'end' in link ? link.end : false}
              onClick={(event) => {
                if (location.pathname === '/search' || query) {
                  event.preventDefault()
                  const target = link.to
                  setQuery('')
                  setSearchOpen(false)
                  navigate(target)
                }
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-tools">
          <CastMenu />
          <div className={`search-wrap ${open ? 'is-open' : ''}`} ref={searchRef}>
            <button type="button" className="search-toggle" aria-label="Search" onClick={toggleSearch}>
              <SearchIcon className="icon" />
            </button>
            {open ? (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="search"
                  autoComplete="off"
                  placeholder={phone ? 'Search' : 'Titles, people, genres'}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search"
                />
                <button
                  type="button"
                  className={`search-close ${query ? 'is-shown' : ''}`}
                  aria-label={query ? 'Clear search' : 'Close search'}
                  onClick={query ? clearQuery : leaveSearch}
                >
                  <CloseIcon className="icon" />
                </button>
              </>
            ) : null}
          </div>
          <NotificationsMenu />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
