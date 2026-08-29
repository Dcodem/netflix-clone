import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AvatarArt } from '../components/AvatarArt'
import { ChevronRightIcon } from '../components/Icons'
import { useProfiles } from '../profiles/ProfileContext'
import { avatarFor } from '../profiles/types'
import { envKeys } from '../trailers/types'

type AccountPanel = 'email' | 'password' | 'phone' | 'plan' | null

export function Account() {
  const { user, updateKeys, updateAccount } = useAuth()
  const { profiles } = useProfiles()
  const env = envKeys()
  const [ivaKey, setIvaKey] = useState(user?.ivaKey ?? '')
  const [tmdbKey, setTmdbKey] = useState(user?.tmdbKey ?? '')
  const [saved, setSaved] = useState(false)
  const [panel, setPanel] = useState<AccountPanel>(null)
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '')
  const [passwordDraft, setPasswordDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState(user?.phone ?? '')
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountBusy, setAccountBusy] = useState(false)

  function togglePanel(next: AccountPanel) {
    setAccountError(null)
    setEmailDraft(user?.email ?? '')
    setPasswordDraft('')
    setPhoneDraft(user?.phone ?? '')
    setPanel((current) => (current === next ? null : next))
  }

  async function saveAccount(event: FormEvent, next: AccountPanel) {
    event.preventDefault()
    setAccountError(null)
    setAccountBusy(true)
    try {
      if (next === 'email') await updateAccount({ email: emailDraft })
      if (next === 'password') await updateAccount({ password: passwordDraft })
      if (next === 'phone') await updateAccount({ phone: phoneDraft.trim() || null })
      setPanel(null)
      setPasswordDraft('')
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Could not save those details.')
    } finally {
      setAccountBusy(false)
    }
  }

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

      <section className="account-block">
        <h2>Membership & Billing</h2>
        <div className="account-block-body">
          <div className="account-row">
            <span>{user?.email}</span>
            <button type="button" className="account-change" onClick={() => togglePanel('email')}>
              Change email
            </button>
          </div>
          {panel === 'email' ? (
            <form className="account-inline" onSubmit={(event) => void saveAccount(event, 'email')}>
              <label>
                Email
                <input
                  type="email"
                  value={emailDraft}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              {accountError ? <p className="account-inline-error">{accountError}</p> : null}
              <div className="account-inline-actions">
                <button type="submit" className="btn btn-primary" disabled={accountBusy}>
                  Save
                </button>
                <button type="button" className="account-change" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          <div className="account-row">
            <span>••••••••</span>
            <button type="button" className="account-change" onClick={() => togglePanel('password')}>
              Change password
            </button>
          </div>
          {panel === 'password' ? (
            <form className="account-inline" onSubmit={(event) => void saveAccount(event, 'password')}>
              <label>
                New password
                <input
                  type="password"
                  value={passwordDraft}
                  onChange={(event) => setPasswordDraft(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
              {accountError ? <p className="account-inline-error">{accountError}</p> : null}
              <div className="account-inline-actions">
                <button type="submit" className="btn btn-primary" disabled={accountBusy}>
                  Save
                </button>
                <button type="button" className="account-change" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          <div className="account-row">
            <span>{user?.phone || ''}</span>
            <button type="button" className="account-change" onClick={() => togglePanel('phone')}>
              {user?.phone ? 'Change phone number' : 'Add phone number'}
            </button>
          </div>
          {panel === 'phone' ? (
            <form className="account-inline" onSubmit={(event) => void saveAccount(event, 'phone')}>
              <label>
                Phone
                <input
                  type="tel"
                  value={phoneDraft}
                  onChange={(event) => setPhoneDraft(event.target.value)}
                  autoComplete="tel"
                  placeholder="Add a phone number"
                />
              </label>
              {accountError ? <p className="account-inline-error">{accountError}</p> : null}
              <div className="account-inline-actions">
                <button type="submit" className="btn btn-primary" disabled={accountBusy}>
                  Save
                </button>
                <button type="button" className="account-change" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </section>

      <section className="account-block">
        <h2>Plan Details</h2>
        <div className="account-block-body">
          <div className="account-row">
            <span>
              Standard <span className="spec-badge">HD</span>
            </span>
            <button type="button" className="account-change" onClick={() => togglePanel('plan')}>
              Change plan
            </button>
          </div>
          {panel === 'plan' ? (
            <p className="account-inline-note">Standard is the plan on this device. There is no monthly bill to change.</p>
          ) : null}
          <div className="account-row">
            <span>HD · 5.1 · spatial audio</span>
          </div>
        </div>
      </section>

      <section className="account-block">
        <h2>Profile & Parental Controls</h2>
        <div className="account-block-body">
          {profiles.map((profile) => {
            const avatar = avatarFor(profile)
            return (
              <Link className="account-row is-link" key={profile.id} to="/" state={{ manage: true }}>
                <span className="account-profile">
                  <span className="account-avatar" style={{ background: avatar.color }}>
                    <AvatarArt avatar={avatar} alt={profile.name} />
                  </span>
                  <span className="account-profile-copy">
                    <strong>{profile.name}</strong>
                    <em>{profile.maturity || 'All Maturity Ratings'}</em>
                  </span>
                </span>
                <ChevronRightIcon className="icon" />
              </Link>
            )
          })}
        </div>
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
