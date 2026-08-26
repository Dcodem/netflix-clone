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
          Plex loads extras and preview clips from <strong>Internet Video Archive</strong> (Fabric Origin).
          Paste that subscription key to play licensed mini trailers on the hero and title pages.
        </p>
        <label>
          IVA / Fabric Origin key
          <input
            value={ivaKey}
            onChange={(event) => setIvaKey(event.target.value)}
            placeholder={env.iva ? 'Using VITE_IVA_API_KEY' : 'subscription-key'}
            autoComplete="off"
          />
        </label>
        <p className="account-hint">
          Get a key at{' '}
          <a href="https://developer.iva-api.com/" target="_blank" rel="noreferrer">
            developer.iva-api.com
          </a>
          . Mini clips use IVA GetVideo with a short start/end window.
        </p>
        <label>
          TMDB key (fallback)
          <input
            value={tmdbKey}
            onChange={(event) => setTmdbKey(event.target.value)}
            placeholder={env.tmdb ? 'Using VITE_TMDB_API_KEY' : 'optional YouTube trailer lookup'}
            autoComplete="off"
          />
        </label>
        <p className="account-hint">
          Used only when IVA has no match or no key. Free keys:{' '}
          <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
            themoviedb.org
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
