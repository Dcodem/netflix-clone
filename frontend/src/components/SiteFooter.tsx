import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfiles } from '../profiles/ProfileContext'
import type { ProfileLanguage } from '../profiles/types'
import { CaretIcon, CheckIcon, CloseIcon, FacebookIcon, GlobeIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from './Icons'

const COOKIE_KEY = 'flix.cookiePrefs'

type CookieChoice = {
  performance: boolean
  functional: boolean
  targeting: boolean
}

const COOKIE_OFF: CookieChoice = { performance: false, functional: false, targeting: false }

function loadCookiePrefs(): CookieChoice {
  try {
    const raw = localStorage.getItem(COOKIE_KEY)
    if (!raw) return COOKIE_OFF
    const parsed = JSON.parse(raw) as Partial<CookieChoice>
    return {
      performance: Boolean(parsed.performance),
      functional: Boolean(parsed.functional),
      targeting: Boolean(parsed.targeting),
    }
  } catch {
    return COOKIE_OFF
  }
}

function saveCookiePrefs(next: CookieChoice) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(next))
}

const COOKIE_GROUPS = [
  {
    id: 'necessary' as const,
    title: 'Strictly Necessary Cookies',
    locked: true,
    body: 'Required to keep you signed in, remember who’s watching, and play titles on this device.',
  },
  {
    id: 'performance' as const,
    title: 'Performance Cookies',
    locked: false,
    body: 'Help us understand how FLIX is used so we can improve browsing and playback on this device.',
  },
  {
    id: 'functional' as const,
    title: 'Functional Cookies',
    locked: false,
    body: 'Remember choices like language, autoplay, and display settings across visits.',
  },
  {
    id: 'targeting' as const,
    title: 'Targeting Cookies',
    locked: false,
    body: 'Used by partners for more relevant ads. FLIX keeps these off unless you turn them on.',
  },
]

const COLUMNS = [
  ['FAQ', 'Investor Relations', 'Ways to Watch', 'Corporate Information'],
  ['Help Center', 'Jobs', 'Terms of Use', 'Contact Us'],
  ['Account', 'Redeem Gift Cards', 'Privacy', 'Speed Test'],
  ['Media Center', 'Buy Gift Cards', 'Cookie Preferences', 'Legal Notices'],
] as const

export const FOOTER_NOTES: Record<string, string> = {
  FAQ: 'FLIX is a browser-only demo. There is no live FAQ beyond Account and what’s on this device.',
  'Help Center':
    'After you sign in, Help Center covers watching shortcuts, Account, captions, privacy, and My List. While watching, press ? for the player shortcut list. FLIX is a browser-only demo.',
  'Terms of Use': 'This clone is for demonstration. It is not affiliated with Netflix.',
  Privacy: 'Profile picks and watch history stay in this browser. Catalog artwork may load from TMDB.',
  'Legal Notices': 'FLIX is an independent demo. Title names and artwork come from the catalog and TMDB.',
  'Corporate Information': 'There is no FLIX corporation. This app runs in your browser.',
  'Investor Relations': 'FLIX is not a public company and has no investor site.',
  Jobs: 'There are no open roles for this demo.',
  'Ways to Watch':
    'After you sign in, Ways to Watch lists this browser and phone. There is no TV app or console build.',
  'Contact Us': 'There is no support inbox for this demo.',
  'Speed Test': 'After you sign in, Speed Test in the footer measures this browser. Playback still stays on this device.',
  'Media Center': 'There is no press kit for this demo.',
  'Redeem Gift Cards':
    'Open Account and choose Redeem gift card or promo code. Credit stays on this device and does not charge a card.',
  'Buy Gift Cards': 'Gift cards are not sold on this device.',
  'Transfer Profile':
    'Open the account menu and choose Transfer Profile to get a one-time code. Profiles stay on this device.',
}

const FOOTER_LANGS = [
  { value: 'en', label: 'English', profile: 'English' as ProfileLanguage },
  { value: 'es', label: 'Español', profile: 'Español' as ProfileLanguage },
  { value: 'fr', label: 'Français', profile: 'Français' as ProfileLanguage },
] as const

function codeFromProfile(language?: string | null) {
  if (language === 'Español') return 'es'
  if (language === 'Français') return 'fr'
  return 'en'
}

export function FooterLang({ className }: { className?: string }) {
  const { activeProfile, updateProfile } = useProfiles()
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<(typeof FOOTER_LANGS)[number]['value']>(() =>
    codeFromProfile(activeProfile?.language),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = FOOTER_LANGS.find((entry) => entry.value === lang) ?? FOOTER_LANGS[0]

  useEffect(() => {
    setLang(codeFromProfile(activeProfile?.language))
  }, [activeProfile?.id, activeProfile?.language])

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
                  if (activeProfile) void updateProfile(activeProfile.id, { language: entry.profile })
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
  const [note, setNote] = useState<string | null>(null)

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
                  ) : label === 'Account' ? (
                    <Link to="/account">Account</Link>
                  ) : label === 'Help Center' ? (
                    <Link to="/help">Help Center</Link>
                  ) : label === 'Buy Gift Cards' ? (
                    <Link to="/gift">Buy Gift Cards</Link>
                  ) : label === 'Speed Test' ? (
                    <Link to="/speed">Speed Test</Link>
                  ) : label === 'Ways to Watch' ? (
                    <Link to="/ways">Ways to Watch</Link>
                  ) : (
                    <button type="button" className="site-footer-link" onClick={() => setNote(label)}>
                      {label}
                    </button>
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
      <CookiePrefsDialog open={cookies} onClose={() => setCookies(false)} />
      {note && FOOTER_NOTES[note] ? (
        <FooterNoteDialog title={note} body={FOOTER_NOTES[note]} onClose={() => setNote(null)} />
      ) : null}
    </footer>
  )
}

export function FooterNoteDialog({
  title,
  body,
  onClose,
}: {
  title: string
  body: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="cookie-prefs" role="presentation" onClick={onClose}>
      <div
        className="cookie-prefs-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="footer-note-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="footer-note-title">{title}</h2>
        <p>{body}</p>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export function CookiePrefsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [choice, setChoice] = useState<CookieChoice>(COOKIE_OFF)
  const [openGroup, setOpenGroup] = useState<string | null>('necessary')

  useEffect(() => {
    if (!open) return
    setChoice(loadCookiePrefs())
    setOpenGroup('necessary')
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  function persist(next: CookieChoice) {
    saveCookiePrefs(next)
    setChoice(next)
    onClose()
  }

  return (
    <div className="cookie-prefs" role="presentation" onClick={onClose}>
      <div
        className="cookie-prefs-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cookie-prefs-head">
          <h2 id="cookie-prefs-title">Cookie Preferences</h2>
          <button type="button" className="cookie-prefs-close" onClick={onClose} aria-label="Close">
            <CloseIcon className="icon" />
          </button>
        </div>
        <div className="cookie-prefs-body">
          <p>
            We use cookies and similar technologies to run FLIX, remember who’s watching on this device, and measure
            how the service is used. Strictly necessary cookies stay on. You can turn the others on or off.
          </p>
          <ul className="cookie-prefs-list">
            {COOKIE_GROUPS.map((group) => {
              const expanded = openGroup === group.id
              const on = group.locked || Boolean(choice[group.id as keyof CookieChoice])
              return (
                <li key={group.id} className={expanded ? 'is-open' : ''}>
                  <div className="cookie-prefs-row">
                    <button
                      type="button"
                      className="cookie-prefs-toggle-copy"
                      aria-expanded={expanded}
                      onClick={() => setOpenGroup(expanded ? null : group.id)}
                    >
                      <CaretIcon className="icon" />
                      <span>{group.title}</span>
                    </button>
                    {group.locked ? (
                      <em>Always Active</em>
                    ) : (
                      <button
                        type="button"
                        className={`cookie-switch ${on ? 'is-on' : ''}`}
                        role="switch"
                        aria-checked={on}
                        aria-label={group.title}
                        onClick={() =>
                          setChoice((current) => ({
                            ...current,
                            [group.id]: !current[group.id as keyof CookieChoice],
                          }))
                        }
                      />
                    )}
                  </div>
                  {expanded ? <p className="cookie-prefs-detail">{group.body}</p> : null}
                </li>
              )
            })}
          </ul>
        </div>
        <div className="cookie-prefs-actions">
          <button type="button" className="btn btn-ghost" onClick={() => persist(choice)}>
            Confirm My Choices
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => persist({ performance: true, functional: true, targeting: true })}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
