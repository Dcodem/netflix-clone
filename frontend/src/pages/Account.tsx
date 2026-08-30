import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { commsFor, extraMemberSlots, extraMembersFor, testsOn } from '../auth/types'
import { currentDeviceId, formatDeviceUsed, upsertCurrentDevice } from '../auth/device'
import { AvatarArt } from '../components/AvatarArt'
import { ChevronRightIcon } from '../components/Icons'
import { useProfiles } from '../profiles/ProfileContext'
import {
  DATA_USAGE_OPTIONS,
  DOWNLOAD_QUALITY_OPTIONS,
  avatarFor,
  type DataUsage,
  type DownloadQuality,
} from '../profiles/types'

const PLANS = [
  { id: 'standard', name: 'Standard', quality: 'HD', devices: '2 devices at a time', price: '$15.49' },
  { id: 'premium', name: 'Premium', quality: 'UHD', devices: '4 devices at a time', price: '$24.99' },
  { id: 'basic', name: 'Basic', quality: 'HD', devices: '1 device at a time', price: '$7.99' },
] as const

type PlanId = (typeof PLANS)[number]['id']

const CANCEL_REASONS = [
  { id: 'price', label: 'Too expensive' },
  { id: 'use', label: 'I don’t use FLIX enough' },
  { id: 'other-service', label: 'I have another streaming service' },
  { id: 'content', label: 'I don’t find the titles interesting' },
  { id: 'tech', label: 'Technical problems' },
  { id: 'other', label: 'Something else' },
] as const

function money(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatGiftCode(raw: string) {
  const compact = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16)
  return compact.replace(/(.{4})(?=.)/g, '$1-')
}

function cardBrand(digits: string): string {
  if (digits.startsWith('4')) return 'Visa'
  if (digits.startsWith('5') || digits.startsWith('2')) return 'Mastercard'
  if (digits.startsWith('34') || digits.startsWith('37')) return 'Amex'
  if (digits.startsWith('6')) return 'Discover'
  return 'Card'
}

type AccountPanel =
  | 'email'
  | 'password'
  | 'phone'
  | 'plan'
  | 'payment'
  | 'billing'
  | 'gift'
  | 'cancel'
  | 'playback'
  | 'comms'
  | 'privacy'
  | 'downloads'
  | 'tests'
  | 'extra'
  | 'devices'
  | 'signout'
  | null

export function Account() {
  const { user, updateAccount, redeemGift, addExtraMember, removeExtraMember, signOutDevice, signOutOtherDevices } =
    useAuth()
  const { profiles, activeProfile, updateProfile } = useProfiles()
  const [panel, setPanel] = useState<AccountPanel>(null)
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '')
  const [passwordDraft, setPasswordDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState(user?.phone ?? '')
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountBusy, setAccountBusy] = useState(false)
  const [planId, setPlanId] = useState<PlanId>(
    user?.planId && PLANS.some((entry) => entry.id === user.planId) ? user.planId : 'standard',
  )
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [giftDraft, setGiftDraft] = useState('')
  const [giftApplied, setGiftApplied] = useState<number | null>(null)
  const [extraName, setExtraName] = useState('')
  const [extraEmail, setExtraEmail] = useState('')
  const [cancelReason, setCancelReason] = useState<(typeof CANCEL_REASONS)[number]['id'] | null>(null)
  const [cancelDone, setCancelDone] = useState(false)
  const extraMembers = extraMembersFor(user)
  const extraSlots = extraMemberSlots(planId)
  const plan = PLANS.find((entry) => entry.id === planId) ?? PLANS[0]
  const nextPay = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + 28)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }, [])
  const lastBilled = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    [],
  )

  function togglePanel(next: AccountPanel) {
    setAccountError(null)
    setEmailDraft(user?.email ?? '')
    setPasswordDraft('')
    setPhoneDraft(user?.phone ?? '')
    setCardNumber('')
    setCardExp('')
    setCardCvc('')
    setGiftDraft('')
    setGiftApplied(null)
    setExtraName('')
    setExtraEmail('')
    setCancelReason(null)
    setCancelDone(false)
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

  async function savePayment(event: FormEvent) {
    event.preventDefault()
    setAccountError(null)
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 12 || digits.length > 19) {
      setAccountError('Enter a valid card number.')
      return
    }
    setAccountBusy(true)
    try {
      await updateAccount({
        paymentBrand: cardBrand(digits),
        paymentLast4: digits.slice(-4),
      })
      setCardNumber('')
      setCardExp('')
      setCardCvc('')
      setPanel(null)
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Could not save that payment method.')
    } finally {
      setAccountBusy(false)
    }
  }

  async function saveGift(event: FormEvent) {
    event.preventDefault()
    setAccountError(null)
    setGiftApplied(null)
    setAccountBusy(true)
    try {
      const amount = await redeemGift(giftDraft)
      setGiftApplied(amount)
      setGiftDraft('')
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Could not redeem that code.')
    } finally {
      setAccountBusy(false)
    }
  }

  async function saveExtra(event: FormEvent) {
    event.preventDefault()
    setAccountError(null)
    setAccountBusy(true)
    try {
      await addExtraMember({ name: extraName, email: extraEmail })
      setExtraName('')
      setExtraEmail('')
      setPanel(null)
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Could not add that extra member.')
    } finally {
      setAccountBusy(false)
    }
  }

  return (
    <main className="page-pad account-page">
      <h1>Account</h1>

      <section className="account-membership">
        <div className="account-membership-card">
          <p className="account-brand" aria-hidden="true">
            FLIX
          </p>
          <p className="account-email">{user?.email}</p>
          <p className="account-plan">
            <span className="account-plan-name">{plan.name}</span>
            <span className="spec-badge">{plan.quality}</span>
          </p>
          <p className="account-plan-price">{plan.price} a month</p>
          <div className="account-next-pay">
            <span>Next payment</span>
            <strong>{nextPay}</strong>
          </div>
          {user?.giftBalance ? (
            <div className="account-next-pay account-gift-balance">
              <span>Gift card balance</span>
              <strong>{money(user.giftBalance)}</strong>
            </div>
          ) : null}
          <p className="account-hint">Billed monthly on this device.</p>
          <button type="button" className="account-cancel" onClick={() => togglePanel('cancel')}>
            Cancel Membership
          </button>
        </div>
        {panel === 'cancel' ? (
          <div className="account-prefs account-cancel-panel">
            {cancelDone ? (
              <>
                <p className="account-prefs-lead">Membership stays on</p>
                <p className="account-inline-note">
                  There is no membership to cancel on this device. {plan.name} stays available in this browser. FLIX does
                  not charge a card.
                </p>
                <button type="button" className="account-change" onClick={() => setPanel(null)}>
                  Back to Account
                </button>
              </>
            ) : (
              <>
                <p className="account-prefs-lead">Why are you leaving FLIX?</p>
                <p className="account-inline-note">Tell us what’s going on. This does not end access on this device.</p>
                {CANCEL_REASONS.map((reason) => (
                  <label className="edit-check" key={reason.id}>
                    <input
                      type="radio"
                      name="cancel-reason"
                      checked={cancelReason === reason.id}
                      onChange={() => {
                        setAccountError(null)
                        setCancelReason(reason.id)
                      }}
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
                {accountError && panel === 'cancel' ? <p className="account-inline-error">{accountError}</p> : null}
                <div className="account-inline-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!cancelReason) {
                        setAccountError('Choose a reason to continue.')
                        return
                      }
                      setAccountError(null)
                      setCancelDone(true)
                    }}
                  >
                    Finish cancellation
                  </button>
                  <button type="button" className="account-change" onClick={() => setPanel(null)}>
                    Keep Membership
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
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
          <div className="account-row">
            <span>
              {user?.paymentLast4 ? `${user.paymentBrand || 'Card'} •••• ${user.paymentLast4}` : 'No payment method'}
            </span>
            <button type="button" className="account-change" onClick={() => togglePanel('payment')}>
              {user?.paymentLast4 ? 'Update payment method' : 'Add payment method'}
            </button>
          </div>
          {panel === 'payment' ? (
            <form className="account-inline" onSubmit={(event) => void savePayment(event)}>
              <label>
                Card number
                <input
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value.replace(/[^\d ]/g, '').slice(0, 23))}
                  placeholder="•••• •••• •••• ••••"
                  required
                />
              </label>
              <div className="account-inline-split">
                <label>
                  Expiration
                  <input
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={cardExp}
                    onChange={(event) => setCardExp(event.target.value.replace(/[^\d/]/g, '').slice(0, 5))}
                    placeholder="MM/YY"
                  />
                </label>
                <label>
                  CVC
                  <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cardCvc}
                    onChange={(event) => setCardCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="CVC"
                  />
                </label>
              </div>
              <p className="account-inline-note">
                FLIX keeps only the brand and last four digits on this device. It does not charge a card.
              </p>
              {accountError ? <p className="account-inline-error">{accountError}</p> : null}
              <div className="account-inline-actions">
                <button type="submit" className="btn btn-primary" disabled={accountBusy}>
                  Save
                </button>
                {user?.paymentLast4 ? (
                  <button
                    type="button"
                    className="account-change"
                    onClick={() => {
                      void updateAccount({ paymentBrand: null, paymentLast4: null })
                      setPanel(null)
                    }}
                  >
                    Remove
                  </button>
                ) : null}
                <button type="button" className="account-change" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          <div className="account-row">
            <span>Billing details</span>
            <button type="button" className="account-change" onClick={() => togglePanel('billing')}>
              {panel === 'billing' ? 'Hide' : 'Open'}
            </button>
          </div>
          {panel === 'billing' ? (
            <div className="account-billing">
              <div className="account-billing-row">
                <strong>{lastBilled}</strong>
                <span>
                  {plan.name} · {plan.price}
                </span>
                <span>
                  {user?.paymentLast4
                    ? `${user.paymentBrand || 'Card'} •••• ${user.paymentLast4}`
                    : 'No payment method'}
                </span>
              </div>
              <p className="account-inline-note">
                Next payment {nextPay}
                {user?.giftBalance ? ` · Gift card balance ${money(user.giftBalance)}` : ''}. FLIX does not store
                receipts or charge a card on this device.
              </p>
            </div>
          ) : null}
          <div className="account-row is-actions">
            <button type="button" className="account-change" onClick={() => togglePanel('gift')}>
              Redeem gift card or promo code
            </button>
          </div>
          {panel === 'gift' ? (
            <form className="account-inline" onSubmit={(event) => void saveGift(event)}>
              <label>
                Gift card or promo code
                <input
                  value={giftDraft}
                  onChange={(event) => setGiftDraft(formatGiftCode(event.target.value))}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="XXXX-XXXX-XXXX"
                  required
                />
              </label>
              {giftApplied ? (
                <p className="account-inline-note">
                  {money(giftApplied)} applied. Gift card balance {money(user?.giftBalance ?? 0)}. FLIX still does not
                  charge a card.
                </p>
              ) : (
                <p className="account-inline-note">
                  Credit stays on this device and applies to the next payment shown here. FLIX does not charge a card.
                </p>
              )}
              {accountError ? <p className="account-inline-error">{accountError}</p> : null}
              <div className="account-inline-actions">
                <button type="submit" className="btn btn-primary" disabled={accountBusy}>
                  Redeem
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
              {plan.name} <span className="spec-badge">{plan.quality}</span>
              <em className="account-plan-row-price">{plan.price} a month</em>
            </span>
            <button type="button" className="account-change" onClick={() => togglePanel('plan')}>
              Change plan
            </button>
          </div>
          {panel === 'plan' ? (
            <div className="account-plan-picker">
              {PLANS.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className={`account-plan-tile ${entry.id === planId ? 'is-on' : ''}`}
                  onClick={() => {
                    setPlanId(entry.id)
                    void updateAccount({ planId: entry.id })
                    setPanel(null)
                  }}
                >
                  <strong>{entry.name}</strong>
                  <span className="spec-badge">{entry.quality}</span>
                  <span className="account-tile-price">{entry.price} a month</span>
                  <em>{entry.devices}</em>
                  {entry.id === planId ? <small>Current plan</small> : null}
                </button>
              ))}
            </div>
          ) : null}
          <div className="account-row">
            <span>HD · 5.1 · spatial audio</span>
          </div>
        </div>
      </section>

      <section className="account-block">
        <h2>Extra Members</h2>
        <div className="account-block-body">
          <p className="account-inline-note account-extra-lead">
            Share FLIX with someone who doesn’t live with you. Extra members get their own invite on this account.
          </p>
          <div className="account-row">
            <span>
              {extraMembers.length
                ? `${extraMembers.length} of ${extraSlots || extraMembers.length} spot${
                    (extraSlots || extraMembers.length) === 1 ? '' : 's'
                  } used`
                : extraSlots
                  ? `No extra members`
                  : `Not included on ${plan.name}`}
            </span>
            <span>{extraSlots ? `${plan.name} · ${extraSlots} spot${extraSlots === 1 ? '' : 's'}` : plan.name}</span>
          </div>
          {extraMembers.length ? (
            <ul className="account-devices account-extra-list">
              {extraMembers.map((member) => (
                <li key={member.id}>
                  <span>
                    <strong>{member.name}</strong>
                    <em>{member.email}</em>
                  </span>
                  <button type="button" className="account-change" onClick={() => removeExtraMember(member.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {extraSlots > 0 && extraMembers.length < extraSlots ? (
            <div className="account-row is-actions">
              <button type="button" className="account-change" onClick={() => togglePanel('extra')}>
                Add extra member
              </button>
            </div>
          ) : extraSlots < 1 ? (
            <p className="account-inline-note">
              Extra members are not included on {plan.name}. Change plan to Standard or Premium.
            </p>
          ) : (
            <p className="account-inline-note">All extra member spots are used on {plan.name}.</p>
          )}
          {panel === 'extra' ? (
            <form className="account-inline" onSubmit={(event) => void saveExtra(event)}>
              <label>
                Name
                <input
                  value={extraName}
                  onChange={(event) => setExtraName(event.target.value)}
                  autoComplete="name"
                  maxLength={40}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={extraEmail}
                  onChange={(event) => setExtraEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <p className="account-inline-note">
                FLIX does not create another household or charge for extra members. This invite stays on this account.
              </p>
              {accountError && panel === 'extra' ? <p className="account-inline-error">{accountError}</p> : null}
              <div className="account-inline-actions">
                <button type="submit" className="btn btn-primary" disabled={accountBusy}>
                  Send invite
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

      <section className="account-block">
        <h2>Settings</h2>
        <div className="account-block-body">
          <div className="account-row">
            <span>Appearance</span>
            <span>Dark</span>
          </div>
          <div className="account-row">
            <span>Playback settings</span>
            <button type="button" className="account-change" onClick={() => togglePanel('playback')}>
              Change
            </button>
          </div>
          {panel === 'playback' ? (
            activeProfile ? (
              <div className="edit-autoplay account-prefs">
                <label className="edit-check">
                  <input
                    type="checkbox"
                    checked={activeProfile.autoplayNext !== false}
                    onChange={(event) => {
                      void updateProfile(activeProfile.id, { autoplayNext: event.target.checked })
                    }}
                  />
                  <span>
                    Autoplay next episode
                    <small>Play the next episode automatically on all devices.</small>
                  </span>
                </label>
                <label className="edit-check">
                  <input
                    type="checkbox"
                    checked={activeProfile.autoplayPreview !== false}
                    onChange={(event) => {
                      void updateProfile(activeProfile.id, { autoplayPreview: event.target.checked })
                    }}
                  />
                  <span>
                    Autoplay previews
                    <small>Play previews while browsing on all devices.</small>
                  </span>
                </label>
                <label className="edit-check">
                  <input
                    type="checkbox"
                    checked={Boolean(activeProfile.skipIntros)}
                    onChange={(event) => {
                      void updateProfile(activeProfile.id, { skipIntros: event.target.checked })
                    }}
                  />
                  <span>
                    Auto-skip recaps and intros
                    <small>Skip the recap and intro on TV shows.</small>
                  </span>
                </label>
                <fieldset className="account-data-usage">
                  <legend>Data usage per screen</legend>
                  <p>Auto picks quality from this connection. Playback still stays in this browser.</p>
                  {DATA_USAGE_OPTIONS.map((entry) => (
                    <label className="edit-check" key={entry.id}>
                      <input
                        type="radio"
                        name="data-usage"
                        checked={(activeProfile.dataUsage ?? 'auto') === entry.id}
                        onChange={() => {
                          void updateProfile(activeProfile.id, { dataUsage: entry.id as DataUsage })
                        }}
                      />
                      <span>
                        {entry.label}
                        <small>{entry.detail}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
            ) : (
              <p className="account-inline-note">Choose a profile to change autoplay next episode, previews, and skip intros.</p>
            )
          ) : null}
          <div className="account-row">
            <span>Communication settings</span>
            <button type="button" className="account-change" onClick={() => togglePanel('comms')}>
              Change
            </button>
          </div>
          {panel === 'comms' ? (
            <div className="edit-autoplay account-prefs">
              <p className="account-prefs-lead">Email me about</p>
              <label className="edit-check">
                <input
                  type="checkbox"
                  checked={commsFor(user).offers}
                  onChange={(event) => {
                    void updateAccount({ comms: { offers: event.target.checked } })
                  }}
                />
                <span>
                  Special offers and promotions
                  <small>Deals and limited-time offers for this account.</small>
                </span>
              </label>
              <label className="edit-check">
                <input
                  type="checkbox"
                  checked={commsFor(user).news}
                  onChange={(event) => {
                    void updateAccount({ comms: { news: event.target.checked } })
                  }}
                />
                <span>
                  News and announcements
                  <small>New features and updates from FLIX.</small>
                </span>
              </label>
              <label className="edit-check">
                <input
                  type="checkbox"
                  checked={commsFor(user).recs}
                  onChange={(event) => {
                    void updateAccount({ comms: { recs: event.target.checked } })
                  }}
                />
                <span>
                  Recommendations
                  <small>Titles we think you’ll like, based on this profile.</small>
                </span>
              </label>
              <p className="account-inline-note">
                FLIX does not send email from this device. These choices stay on this account.
              </p>
            </div>
          ) : null}
          <div className="account-row">
            <span>Privacy</span>
            <button type="button" className="account-change" onClick={() => togglePanel('privacy')}>
              Change
            </button>
          </div>
          {panel === 'privacy' ? (
            activeProfile ? (
              <div className="edit-autoplay account-prefs">
                <label className="edit-check">
                  <input
                    type="checkbox"
                    checked={activeProfile.personalizedRecs !== false}
                    onChange={(event) => {
                      void updateProfile(activeProfile.id, { personalizedRecs: event.target.checked })
                    }}
                  />
                  <span>
                    Personalized recommendations
                    <small>Use titles you’ve watched and rated to choose rows on Home, My Netflix, and My List.</small>
                  </span>
                </label>
                <label className="edit-check">
                  <input
                    type="checkbox"
                    checked={activeProfile.shareActivity !== false}
                    onChange={(event) => {
                      void updateProfile(activeProfile.id, { shareActivity: event.target.checked })
                    }}
                  />
                  <span>
                    Share viewing activity
                    <small>Other profiles on this account can use what you watch for suggestions.</small>
                  </span>
                </label>
                <p className="account-inline-note">
                  These choices stay on this profile. Turning recommendations off uses popular titles instead of your
                  taste.
                </p>
              </div>
            ) : (
              <p className="account-inline-note">Choose a profile to change privacy settings.</p>
            )
          ) : null}
          <div className="account-row">
            <span>Download settings</span>
            <button type="button" className="account-change" onClick={() => togglePanel('downloads')}>
              Change
            </button>
          </div>
          {panel === 'downloads' ? (
            activeProfile ? (
              <div className="edit-autoplay account-prefs">
                <fieldset className="account-data-usage is-lead">
                  <legend>Download video quality</legend>
                  <p>Standard is faster. Higher looks better and uses more storage.</p>
                  {DOWNLOAD_QUALITY_OPTIONS.map((entry) => (
                    <label className="edit-check" key={entry.id}>
                      <input
                        type="radio"
                        name="download-quality"
                        checked={(activeProfile.downloadQuality ?? 'standard') === entry.id}
                        onChange={() => {
                          void updateProfile(activeProfile.id, { downloadQuality: entry.id as DownloadQuality })
                        }}
                      />
                      <span>
                        {entry.label}
                        <small>{entry.detail}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <label className="edit-check">
                  <input
                    type="checkbox"
                    checked={activeProfile.smartDownloads !== false}
                    onChange={(event) => {
                      void updateProfile(activeProfile.id, { smartDownloads: event.target.checked })
                    }}
                  />
                  <span>
                    Smart Downloads
                    <small>Replace a finished episode with the next one. Downloads still stay on this device.</small>
                  </span>
                </label>
                <p className="account-inline-note">
                  FLIX does not store video files. These choices label downloads on My Netflix.
                </p>
              </div>
            ) : (
              <p className="account-inline-note">Choose a profile to change download settings.</p>
            )
          ) : null}
          <div className="account-row">
            <span>Test participation</span>
            <button type="button" className="account-change" onClick={() => togglePanel('tests')}>
              Change
            </button>
          </div>
          {panel === 'tests' ? (
            <div className="edit-autoplay account-prefs">
              <label className="edit-check">
                <input
                  type="checkbox"
                  checked={testsOn(user)}
                  onChange={(event) => {
                    void updateAccount({ tests: event.target.checked })
                  }}
                />
                <span>
                  Get early access to new features
                  <small>Help improve FLIX by joining product tests on this device.</small>
                </span>
              </label>
              <p className="account-inline-note">
                FLIX does not run remote experiments. This choice stays on this account.
              </p>
            </div>
          ) : null}
          <div className="account-row">
            <span>Manage devices</span>
            <button type="button" className="account-change" onClick={() => togglePanel('devices')}>
              Change
            </button>
          </div>
          {panel === 'devices' ? (
            <ul className="account-devices">
              {(user?.devices?.length ? user.devices : upsertCurrentDevice([])).map((device) => {
                const here = device.id === currentDeviceId()
                return (
                  <li key={device.id} className={here ? 'is-here' : ''}>
                    <span>
                      <strong>{device.label}</strong>
                      <em>{here ? 'This device · Active now' : `Last used ${formatDeviceUsed(device.lastUsed)}`}</em>
                    </span>
                    {here ? null : (
                      <button type="button" className="account-change" onClick={() => signOutDevice(device.id)}>
                        Sign out
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : null}
          <div className="account-row is-actions">
            <button
              type="button"
              className="account-change"
              onClick={() => {
                signOutOtherDevices()
                togglePanel('signout')
              }}
            >
              Sign out of all devices
            </button>
          </div>
          {panel === 'signout' ? (
            <p className="account-inline-note">
              Other devices were signed out. You’re still signed in here. Use Switch Profiles to change who’s watching.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
