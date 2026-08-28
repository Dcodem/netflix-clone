import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ChevronRightIcon } from '../components/Icons'
import { envKeys } from '../trailers/types'

export function Account() {
  const { user, updateKeys } = useAuth()
  const env = envKeys()
  const [ivaKey, setIvaKey] = useState(user?.ivaKey ?? '')
  const [tmdbKey, setTmdbKey] = useState(user?.tmdbKey ?? '')
  const [saved, setSaved] = useState(false)

  function onSave(event: FormEvent) {
    event.preventDefault()
    updateKeys({ ivaKey: ivaKey.trim(), tmdbKey: tmdbKey.trim() })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <main className="page-pad account-page">
      <h1>Account</h1>

      <section className="account-membership">
        <p className="account-email">{user?.email}</p>
        <p className="account-plan">
          <span className="account-plan-name">Standard</span>
          <span className="spec-badge">HD</span>
        </p>
        <p className="account-hint">Membership on this device. There is no monthly bill.</p>
      </section>

      <section className="account-list">
        <h2>Membership & Billing</h2>
        <div className="account-row">
          <span>Email</span>
          <span>{user?.email}</span>
        </div>
        <div className="account-row">
          <span>Password</span>
          <span>••••••••</span>
        </div>
        <div className="account-row">
          <span>Phone</span>
          <span>Not set</span>
        </div>
      </section>

      <section className="account-list">
        <h2>Plan Details</h2>
        <div className="account-row">
          <span>Standard</span>
          <span>HD · 5.1 · spatial audio</span>
        </div>
      </section>

      <section className="account-list">
        <h2>Security & Privacy</h2>
        <Link className="account-row is-link" to="/" state={{ manage: true }}>
          <span>Profile & parental controls</span>
          <ChevronRightIcon className="icon" />
        </Link>
        <Link className="account-row is-link" to="/" state={{ manage: true }}>
          <span>Manage profiles</span>
          <ChevronRightIcon className="icon" />
        </Link>
      </section>

      <details className="account-extras">
        <summary>Playback extras</summary>
        <p className="account-hint">
          Previews default to free TMDB YouTube trailers. Extra keys are optional.
        </p>
        <form className="account-form" onSubmit={onSave}>
          <label>
            TMDB key
            <input
              value={tmdbKey}
              onChange={(event) => setTmdbKey(event.target.value)}
              placeholder={env.tmdb ? 'Using VITE_TMDB_API_KEY' : 'YouTube trailer lookup'}
              autoComplete="off"
            />
          </label>
          <p className="account-hint">
            Free keys:{' '}
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
              themoviedb.org
            </a>
            .
          </p>
          <label>
            IVA / Fabric Origin key (optional)
            <input
              value={ivaKey}
              onChange={(event) => setIvaKey(event.target.value)}
              placeholder={env.iva ? 'Using VITE_IVA_API_KEY' : 'leave blank'}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn btn-primary">
            {saved ? 'Saved' : 'Save'}
          </button>
        </form>
      </details>
    </main>
  )
}
