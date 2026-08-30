import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { SITE_INFO_PAGES, type SiteInfoPage } from '../lib/siteInfo'

export function SiteInfo({ page }: { page: SiteInfoPage['slug'] }) {
  const { user } = useAuth()
  const info = SITE_INFO_PAGES[page]
  if (!info) return null

  return (
    <main className="page-pad account-page help-page site-info-page">
      <Link to={user ? '/browse' : '/login'} className="logo site-info-logo" aria-label="Flix">
        FLIX
      </Link>
      <h1>{info.title}</h1>
      <p className="help-lead">{info.lead}</p>
      {info.sections.map((section) => (
        <section className="help-topic" key={section.heading}>
          <h2>{section.heading}</h2>
          <p className="help-article-body is-open">{section.body}</p>
        </section>
      ))}
      <p className="help-foot">
        {user ? (
          <>
            <Link to="/help">Help Center</Link> and <Link to="/faq">FAQ</Link> stay on this device.
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link> to use Help Center and FAQ on this device.
          </>
        )}
      </p>
    </main>
  )
}
