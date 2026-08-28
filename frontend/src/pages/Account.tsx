import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { envKeys } from '../trailers/types'
import { useProfiles } from '../profiles/ProfileContext'

export function Account() {
  const { user, updateKeys } = useAuth()
  const { clearActive } = useProfiles()
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

      <section className="account-card">
        <h2>Membership & Billing</h2>
        <p className="account-email">{user?.email}</p>
        <p className="account-plan">
          Flix Standard <span className="spec-badge">HD</span>
        </p>
        <p className="account-hint">Passwords stay on this device. There is no monthly bill.</p>
      </section>

      <section className="account-card">
        <h2>Plan Details</h2>
        <p>Standard · HD · 5.1 · spatial audio when the title has it.</p>
      </section>

      <section className="account-card">
        <h2>Profile & Parental Controls</h2>
        <Link to="/" onClick={() => clearActive()}>
          Manage profiles
        </Link>
      </section>

      <section className="account-card">
        <h2>Playback settings</h2>
        <p className="account-hint">
          Previews default to free TMDB YouTube trailers. IVA / Fabric Origin is optional paid extras.
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
      </section>
    </main>
  )
}
