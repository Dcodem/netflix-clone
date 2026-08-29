import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretIcon, CheckIcon, FacebookIcon, GlobeIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from './Icons'

const COLUMNS = [
  ['FAQ', 'Investor Relations', 'Ways to Watch', 'Corporate Information'],
  ['Help Center', 'Jobs', 'Terms of Use', 'Contact Us'],
  ['Account', 'Redeem Gift Cards', 'Privacy', 'Speed Test'],
  ['Media Center', 'Buy Gift Cards', 'Cookie Preferences', 'Legal Notices'],
] as const

export const FOOTER_NOTES: Record<string, string> = {
  FAQ: 'FLIX is a browser-only demo. There is no live FAQ beyond Account and what’s on this device.',
  'Help Center': 'Help for this device lives in Account. There is no live chat or phone support for FLIX.',
  'Terms of Use': 'This clone is for demonstration. It is not affiliated with Netflix.',
  Privacy: 'Profile picks and watch history stay in this browser. Catalog artwork may load from TMDB.',
  'Legal Notices': 'FLIX is an independent demo. Title names and artwork come from the catalog and TMDB.',
  'Corporate Information': 'There is no FLIX corporation. This app runs in your browser.',
  'Investor Relations': 'FLIX is not a public company and has no investor site.',
  Jobs: 'There are no open roles for this demo.',
  'Ways to Watch': 'Watch in this browser with Play. There is no TV app or extra device download.',
  'Contact Us': 'There is no support inbox for this demo.',
  'Speed Test': 'Playback uses this device’s connection. There is no separate speed test.',
  'Media Center': 'There is no press kit for this demo.',
  'Redeem Gift Cards': 'Gift cards and promo codes are not used on this device.',
  'Buy Gift Cards': 'Gift cards are not sold on this device.',
  'Transfer Profile': 'Profile transfer isn’t available on this device. Use Manage Profiles to edit who’s watching.',
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
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="cookie-prefs" role="presentation" onClick={onClose}>
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
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Save settings
        </button>
      </div>
    </div>
  )
}
