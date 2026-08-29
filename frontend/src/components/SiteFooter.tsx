import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretIcon, CheckIcon, FacebookIcon, GlobeIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from './Icons'

const COLUMNS = [
  ['FAQ', 'Investor Relations', 'Ways to Watch', 'Corporate Information'],
  ['Help Center', 'Jobs', 'Terms of Use', 'Contact Us'],
  ['Account', 'Redeem Gift Cards', 'Privacy', 'Speed Test'],
  ['Media Center', 'Buy Gift Cards', 'Cookie Preferences', 'Legal Notices'],
] as const

const HREFS: Record<string, string> = {
  Account: '/account',
  'Help Center': '/account',
  FAQ: '/account',
}

const FOOTER_LANGS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
] as const

export function FooterLang({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<(typeof FOOTER_LANGS)[number]['value']>('en')
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = FOOTER_LANGS.find((entry) => entry.value === lang) ?? FOOTER_LANGS[0]

  useEffect(() => {
    if (!open) return
    const onDoc = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`footer-lang ${open ? 'is-open' : ''} ${className ?? ''}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="footer-lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        onClick={() => setOpen((next) => !next)}
      >
        <GlobeIcon className="icon" />
        {selected.label}
        <CaretIcon className="icon footer-lang-caret" />
      </button>
      {open ? (
        <div className="footer-lang-menu" role="listbox" aria-label="Language">
          {FOOTER_LANGS.map((entry) => {
            const on = entry.value === lang
            return (
              <button
                type="button"
                role="option"
                aria-selected={on}
                key={entry.value}
                className={on ? 'is-on' : ''}
                onClick={() => {
                  setLang(entry.value)
                  setOpen(false)
                }}
              >
                {on ? <CheckIcon className="icon" /> : <span className="footer-lang-spacer" />}
                {entry.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function SiteFooter() {
  const [code, setCode] = useState<string | null>(null)
  const [cookies, setCookies] = useState(false)

  useEffect(() => {
    if (!cookies) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCookies(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cookies])

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-social">
          <a href="#facebook" onClick={(event) => event.preventDefault()} aria-label="Facebook">
            <FacebookIcon className="icon" />
          </a>
          <a href="#instagram" onClick={(event) => event.preventDefault()} aria-label="Instagram">
            <InstagramIcon className="icon" />
          </a>
          <a href="#x" onClick={(event) => event.preventDefault()} aria-label="X">
            <TwitterIcon className="icon" />
          </a>
          <a href="#youtube" onClick={(event) => event.preventDefault()} aria-label="YouTube">
            <YoutubeIcon className="icon" />
          </a>
        </div>
        <div className="site-footer-grid">
          {COLUMNS.map((column, index) => (
            <ul key={index}>
              {column.map((label) => (
                <li key={label}>
                  {label === 'Cookie Preferences' ? (
                    <button type="button" className="site-footer-link" onClick={() => setCookies(true)}>
                      Cookie Preferences
                    </button>
                  ) : (
                    <Link to={HREFS[label] ?? '/account'}>{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
        <button
          type="button"
          className="service-code"
          onClick={() => setCode((value) => value ?? `${Math.floor(100 + Math.random() * 900)}-${Math.floor(10000 + Math.random() * 90000)}`)}
        >
          {code ?? 'Service Code'}
        </button>
        <FooterLang />
        <p className="site-footer-copy">© 1997-{new Date().getFullYear()} Flix, Inc.</p>
      </div>
      {cookies ? (
        <div className="cookie-prefs" role="presentation" onClick={() => setCookies(false)}>
          <div
            className="cookie-prefs-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-prefs-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="cookie-prefs-title">Cookie Preferences</h2>
            <p>FLIX uses necessary cookies to keep you signed in on this device. Optional cookies stay off.</p>
            <ul className="cookie-prefs-list">
              <li>
                Necessary <em>Always on</em>
              </li>
              <li>
                Performance <em>Off</em>
              </li>
              <li>
                Functional <em>Off</em>
              </li>
              <li>
                Advertising <em>Off</em>
              </li>
            </ul>
            <button type="button" className="btn btn-primary" onClick={() => setCookies(false)}>
              Save settings
            </button>
          </div>
        </div>
      ) : null}
    </footer>
  )
}
