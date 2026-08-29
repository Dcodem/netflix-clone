import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { getCatalogMany, getMovies } from '../api/client'
import type { MovieListItem } from '../api/types'
import { uniqueById } from '../lib/media'
import { useAuth } from '../auth/AuthContext'
import { CatalogImage } from '../components/CatalogImage'
import { FooterLang } from '../components/SiteFooter'

const REMEMBER_KEY = 'flix.remember'

function CodeBoxes({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = [0, 1, 2, 3].map((index) => value[index] ?? '')

  function write(index: number, nextDigit: string) {
    const next = digits.slice()
    next[index] = nextDigit
    onChange(next.join('').replace(/\D/g, '').slice(0, 4))
    if (nextDigit && index < 3) refs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const next = digits.slice()
      next[index - 1] = ''
      onChange(next.join(''))
      refs.current[index - 1]?.focus()
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pasted) return
    onChange(pasted)
    refs.current[Math.min(3, pasted.length) - 1]?.focus()
  }

  return (
    <div className="pin-boxes login-code-boxes">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          className="pin-box"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          autoFocus={index === 0}
          aria-label={`Sign-in code digit ${index + 1}`}
          onChange={(event) => write(index, event.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
        />
      ))}
    </div>
  )
}

function fieldError(type: string | undefined, value: string, minLength?: number) {
  const trimmed = value.trim()
  if (type === 'password') {
    if (trimmed.length < (minLength ?? 4) || trimmed.length > 60) {
      return `Your password must contain between ${minLength ?? 4} and 60 characters.`
    }
    return null
  }
  if (!trimmed) {
    return type === 'email' ? 'Please enter a valid email or phone number.' : 'Please enter your name.'
  }
  if (type === 'email' && trimmed.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Please enter a valid email.'
  }
  return null
}

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
  const [touched, setTouched] = useState(false)
  const error = touched ? fieldError(type, value, minLength) : null
  return (
    <label className={`nf-field ${error ? 'is-invalid' : ''}`} htmlFor={id}>
      <input
        id={id}
        type={type ?? 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setTouched(true)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder=" "
        aria-invalid={Boolean(error)}
      />
      <span>{label}</span>
      {error ? <p className="nf-field-error">{error}</p> : null}
    </label>
  )
}

export function Login() {
  const { user, login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup' | 'code'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeGuess, setCodeGuess] = useState('')
  const [remember, setRemember] = useState(() => localStorage.getItem(REMEMBER_KEY) !== '0')
  const [help, setHelp] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)
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
        {mode === 'code' ? (
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!codeSent) {
                if (!email.trim()) {
                  setError('Please enter a valid email or phone number.')
                  return
                }
                setError(null)
                setCodeSent(true)
                return
              }
              setError("That code didn't work. Try again.")
              setCodeGuess('')
            }}
          >
            {codeSent ? (
              <>
                <p className="login-code-copy">Enter the code we emailed to {email || 'you'}.</p>
                <CodeBoxes
                  value={codeGuess}
                  onChange={(next) => {
                    setError(null)
                    setCodeGuess(next)
                    if (next.length === 4) setError("That code didn't work. Try again.")
                  }}
                />
              </>
            ) : (
              <>
                <p className="login-code-copy">We’ll email you a code to sign in and start watching.</p>
                <Field
                  id="login-code-email"
                  label="Email or phone number"
                  type="email"
                  value={email}
                  autoComplete="email"
                  required
                  onChange={setEmail}
                />
              </>
            )}
            {error ? <p className="login-error">{error}</p> : null}
            {codeSent ? null : (
              <button type="submit" className="btn btn-primary login-submit">
                Email Me a Sign-In Code
              </button>
            )}
            <button
              type="button"
              className="login-help"
              onClick={() => {
                setMode('login')
                setCodeSent(false)
                setCodeGuess('')
                setError(null)
              }}
            >
              Use password instead
            </button>
          </form>
        ) : (
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
          {mode === 'login' ? (
            <>
              <p className="login-or">OR</p>
              <button
                type="button"
                className="login-code"
                onClick={() => {
                  setHelp(false)
                  setError(null)
                  setCodeSent(false)
                  setCodeGuess('')
                  setMode('code')
                }}
              >
                Use a Sign-In Code
              </button>
            </>
          ) : null}
          <button type="button" className="login-help" onClick={() => setHelp((value) => !value)}>
            Forgot password?
          </button>
          <label className="login-remember">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            Remember me
          </label>
          {help ? (
            <p className="login-help-copy">
              Passwords stay in this browser. If you forgot yours, create a new account with the same email after
              clearing site data, or sign up with a different email.
            </p>
          ) : null}
        </form>
        )}
        <p className="login-sub">
          {mode === 'signup' ? 'Already have an account?' : 'New to Flix?'}{' '}
          <button
            type="button"
            className="login-switch"
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup')
              setError(null)
              setHelp(false)
              setCodeSent(false)
              setCodeGuess('')
            }}
          >
            {mode === 'signup' ? 'Sign in now.' : 'Sign up now.'}
          </button>
        </p>
        <p className="login-legal">
          This page is protected by Google reCAPTCHA to ensure you&apos;re not a bot.{' '}
          {legalOpen ? null : (
            <button type="button" className="login-legal-more" onClick={() => setLegalOpen(true)}>
              Learn more.
            </button>
          )}
        </p>
        {legalOpen ? (
          <p className="login-legal-extra">
            The information collected by Google reCAPTCHA is subject to the Google Privacy Policy and Terms of
            Service, and is used for providing, maintaining, and improving the reCAPTCHA service and for general
            security purposes (it is not used for personalized advertising by Google).
          </p>
        ) : null}
      </div>
      <footer className="login-footer">
        <p>
          Questions? Call <a href="tel:18445052993">1-844-505-2993</a>
        </p>
        <ul className="login-footer-links">
          <li>FAQ</li>
          <li>Help Center</li>
          <li>Terms of Use</li>
          <li>Privacy</li>
          <li>Cookie Preferences</li>
          <li>Corporate Information</li>
        </ul>
        <FooterLang className="login-lang" />
      </footer>
    </main>
  )
}
