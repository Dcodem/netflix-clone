import { Link } from 'react-router-dom'

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
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-social">Questions? Use Account for keys, taste, and this profile.</p>
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
        <button type="button" className="service-code" disabled>
          Service Code
        </button>
        <p className="site-footer-copy">© {new Date().getFullYear()} Flix</p>
      </div>
    </footer>
  )
}
