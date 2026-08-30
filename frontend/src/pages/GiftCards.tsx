import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const GIFT_AMOUNTS = [25, 50, 100, 200] as const

function money(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function GiftCards() {
  const { user } = useAuth()
  const [amount, setAmount] = useState<(typeof GIFT_AMOUNTS)[number]>(50)
  const [to, setTo] = useState('')
  const [from, setFrom] = useState(user?.name ?? '')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <main className="page-pad account-page gift-page">
      <h1>Buy Gift Cards</h1>
      <p className="help-lead">Give FLIX for a month or more. Cards are not sold on this device.</p>

      {sent ? (
        <div className="gift-done">
          <p className="account-prefs-lead">Gift cards are not sold on this device</p>
          <p className="account-inline-note">
            No card was charged for {money(amount)}
            {to.trim() ? ` to ${to.trim()}` : ''}. FLIX does not email gift cards from this browser.
          </p>
          <div className="account-inline-actions">
            <Link className="btn btn-primary" to="/account">
              Redeem on Account
            </Link>
            <button
              type="button"
              className="account-change"
              onClick={() => {
                setSent(false)
                setTo('')
                setMessage('')
              }}
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <form className="account-inline gift-form" onSubmit={submit}>
          <p className="account-prefs-lead">Choose an amount</p>
          <div className="gift-amounts" role="radiogroup" aria-label="Gift card amount">
            {GIFT_AMOUNTS.map((value) => (
              <button
                type="button"
                key={value}
                className={`account-plan-tile ${value === amount ? 'is-on' : ''}`}
                aria-pressed={value === amount}
                onClick={() => setAmount(value)}
              >
                <strong>{money(value)}</strong>
                <em>Digital gift card</em>
              </button>
            ))}
          </div>
          <label>
            Recipient email
            <input
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            From
            <input
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label>
            Message
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={120}
              placeholder="Optional"
            />
          </label>
          <p className="account-inline-note">
            FLIX does not sell or email gift cards. This form stays on this device. Redeem a code on Account if you
            already have one.
          </p>
          <div className="account-inline-actions">
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
            <Link className="account-change" to="/account">
              Redeem a code
            </Link>
          </div>
        </form>
      )}
    </main>
  )
}
