import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
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
      <p className="section-sub account-lead">
        Signed in as <strong>{user?.email}</strong>. Passwords never leave this browser.
      </p>

      <form className="account-form" onSubmit={onSave}>
        <h2>Mini trailers</h2>
        <p>
          Previews default to free <strong>TMDB</strong> YouTube trailers. IVA / Fabric Origin is optional
          paid extras and is only used if TMDB has no match.
        </p>
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
        <p className="account-hint">
          Paid / trial subscription only. Leave this empty unless you already have a key from{' '}
          <a href="https://www.fabricdata.com/contact-us" target="_blank" rel="noreferrer">
            Fabric Origin
          </a>
          .
        </p>
        <button type="submit" className="btn btn-primary">
          {saved ? 'Saved' : 'Save keys'}
        </button>
      </form>
    </main>
  )
}
