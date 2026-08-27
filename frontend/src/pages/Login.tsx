import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CatalogImage } from '../components/CatalogImage'

export function Login() {
  const { user, login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [wall, setWall] = useState<MovieListItem[]>([])

  useEffect(() => {
    getMovies()
      .then((items) => setWall(items.slice(0, 18)))
      .catch(() => setWall([]))
  }, [])

  if (user) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signup({ email, name, password })
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      {wall.length ? (
        <div className="login-wall" aria-hidden="true">
          {wall.map((item) => (
            <CatalogImage key={item.id} item={item} alt="" />
          ))}
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
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              autoComplete="name"
              required
            />
          ) : null}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <p className="login-sub">
          {mode === 'signup' ? 'Already have an account?' : 'New to Flix?'}{' '}
          <button
            type="button"
            className="login-switch"
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup')
              setError(null)
            }}
          >
            {mode === 'signup' ? 'Sign in now.' : 'Sign up now.'}
          </button>
        </p>
      </div>
    </main>
  )
}
