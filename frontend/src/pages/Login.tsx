import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { uniqueById } from '../lib/media'
import { useAuth } from '../auth/AuthContext'
import { CatalogImage } from '../components/CatalogImage'

const REMEMBER_KEY = 'flix.remember'

function Field({
  id,
  label,
  type,
  value,
  autoComplete,
  required,
  minLength,
  onChange,
}: {
  id: string
  label: string
  type?: string
  value: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  onChange: (value: string) => void
}) {
  return (
    <label className="nf-field" htmlFor={id}>
      <input
        id={id}
        type={type ?? 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder=" "
      />
      <span>{label}</span>
    </label>
  )
}

export function Login() {
  const { user, login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => localStorage.getItem(REMEMBER_KEY) !== '0')
  const [help, setHelp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [wall, setWall] = useState<MovieListItem[]>([])

  useEffect(() => {
    Promise.all([
      getMovies().catch(() => [] as MovieListItem[]),
      getCatalogMany('shows', 1).catch(() => [] as MovieListItem[]),
    ]).then(([movies, shows]) => setWall(uniqueById([...movies, ...shows]).slice(0, 1)))
  }, [])

  if (user) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
    try {
      if (mode === 'signup') {
        await signup({ email, name, password })
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Sorry, we can’t find an account with this email address. Please try again or create a new account.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      {wall[0] ? (
        <div className="login-hero" aria-hidden="true">
          <CatalogImage item={wall[0]} alt="" prefer="backdrop" />
        </div>
      ) : null}
      <div className="login-veil" aria-hidden="true" />
      <header className="login-top">
        <div className="logo">FLIX</div>
      </header>
      <div className="login-card">
        <h1>{mode === 'signup' ? 'Sign Up' : 'Sign In'}</h1>
        <form className="login-form" onSubmit={onSubmit}>
          {mode === 'signup' ? (
            <Field id="login-name" label="Name" value={name} autoComplete="name" required onChange={setName} />
          ) : null}
          <Field
            id="login-email"
            label="Email or phone number"
            type="email"
            value={email}
            autoComplete="email"
            required
            onChange={setEmail}
          />
          <Field
            id="login-password"
            label="Password"
            type="password"
            value={password}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={6}
            required
            onChange={setPassword}
          />
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
          </button>
          <div className="login-row">
            <label className="login-remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember me
            </label>
            <button type="button" className="login-help" onClick={() => setHelp((value) => !value)}>
              Forgot password?
            </button>
          </div>
          {help ? (
            <p className="login-help-copy">
              Passwords stay in this browser. If you forgot yours, create a new account with the same email after
              clearing site data, or sign up with a different email.
            </p>
          ) : null}
        </form>
        <p className="login-sub">
          {mode === 'signup' ? 'Already have an account?' : 'New to Flix?'}{' '}
          <button
            type="button"
            className="login-switch"
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup')
              setError(null)
              setHelp(false)
            }}
          >
            {mode === 'signup' ? 'Sign in now.' : 'Sign up now.'}
          </button>
        </p>
        <p className="login-legal">
          This page is protected by Google reCAPTCHA to ensure you're not a bot.{' '}
          <span>Learn more.</span>
        </p>
      </div>
      <footer className="login-footer">
        <p>Questions? This clone keeps accounts on this device.</p>
        <ul className="login-footer-links">
          <li>FAQ</li>
          <li>Help Center</li>
          <li>Terms of Use</li>
          <li>Privacy</li>
          <li>Cookie Preferences</li>
          <li>Corporate Information</li>
        </ul>
      </footer>
    </main>
  )
}
