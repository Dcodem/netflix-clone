import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from './Icons'

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

export function SiteFooter() {
  const [code, setCode] = useState<string | null>(null)

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-social">
          <a href="https://www.facebook.com/netflix" target="_blank" rel="noreferrer" aria-label="Facebook">
            <FacebookIcon className="icon" />
          </a>
          <a href="https://www.instagram.com/netflix" target="_blank" rel="noreferrer" aria-label="Instagram">
            <InstagramIcon className="icon" />
          </a>
          <a href="https://twitter.com/netflix" target="_blank" rel="noreferrer" aria-label="X">
            <TwitterIcon className="icon" />
          </a>
          <a href="https://www.youtube.com/netflix" target="_blank" rel="noreferrer" aria-label="YouTube">
            <YoutubeIcon className="icon" />
          </a>
        </div>
        <div className="site-footer-grid">
          {COLUMNS.map((column, index) => (
            <ul key={index}>
              {column.map((label) => (
                <li key={label}>
                  <Link to={HREFS[label] ?? '/account'}>{label}</Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <select className="footer-lang" defaultValue="en" aria-label="Select language">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
        <button
          type="button"
          className="service-code"
          onClick={() => setCode((value) => value ?? `${Math.floor(100 + Math.random() * 900)}-${Math.floor(10000 + Math.random() * 90000)}`)}
        >
          {code ?? 'Service Code'}
        </button>
        <p className="site-footer-copy">© 1997-{new Date().getFullYear()} Flix, Inc.</p>
      </div>
    </footer>
  )
}
