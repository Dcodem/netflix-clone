import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AvatarArt } from '../components/AvatarArt'
import { LockIcon, PencilIcon, PlusIcon } from '../components/Icons'
import { useAuth } from '../auth/AuthContext'
import { useProfiles } from '../profiles/ProfileContext'
import { playProfileSting } from '../lib/sounds'
import { PROFILE_AVATARS, avatarFor, type Profile } from '../profiles/types'

function PinBoxes({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
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
    <div className={`pin-boxes ${error ? 'is-error' : ''}`}>
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
          disabled={disabled}
          autoFocus={index === 0}
          aria-label={`PIN digit ${index + 1}`}
          onChange={(event) => write(index, event.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
        />
      ))}
    </div>
  )
}

export function ProfileSelect() {
  const { user } = useAuth()
  const {
    profiles,
    selectProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    unlockProfile,
    activeProfile,
  } = useProfiles()
  const navigate = useNavigate()
  const [managing, setManaging] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [avatarId, setAvatarId] = useState(PROFILE_AVATARS[0].id)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAvatarId, setEditAvatarId] = useState(PROFILE_AVATARS[0].id)
  const [editPin, setEditPin] = useState('')
  const [removePin, setRemovePin] = useState(false)
  const [editAutoplayNext, setEditAutoplayNext] = useState(true)
  const [editAutoplayPreview, setEditAutoplayPreview] = useState(true)
  const [pinTarget, setPinTarget] = useState<Profile | null>(null)
  const [pinGuess, setPinGuess] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinShake, setPinShake] = useState(0)
  const unlocking = useRef(false)

  async function submitPin(guess = pinGuess) {
    if (!pinTarget || unlocking.current) return
    unlocking.current = true
    const ok = await unlockProfile(pinTarget.id, guess)
    if (!ok) {
      unlocking.current = false
      setPinError('Incorrect PIN. Please try again.')
      setPinGuess('')
      setPinShake((count) => count + 1)
      return
    }
    setPinTarget(null)
    playProfileSting()
    navigate('/browse', { state: { fromProfile: true } })
  }

  useEffect(() => {
    if (pinGuess.length === 4 && pinTarget) void submitPin(pinGuess)
    // unlock when the fourth digit is entered, like Netflix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinGuess, pinTarget])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (activeProfile && !managing && !adding && !pinTarget && !editingId) {
    return <Navigate to="/browse" replace />
  }

  function startEdit(profile: Profile) {
    setEditingId(profile.id)
    setEditName(profile.name)
    setEditAvatarId(profile.avatarId)
    setEditPin('')
    setRemovePin(false)
    setEditAutoplayNext(profile.autoplayNext !== false)
    setEditAutoplayPreview(profile.autoplayPreview !== false)
  }

  async function onSelect(profile: Profile) {
    if (managing) {
      startEdit(profile)
      return
    }
    if (profile.pinHash) {
      unlocking.current = false
      setPinTarget(profile)
      setPinGuess('')
      setPinError(null)
      return
    }
    selectProfile(profile.id)
    playProfileSting()
    navigate('/browse', { state: { fromProfile: true } })
  }

  async function onPin(event: FormEvent) {
    event.preventDefault()
    await submitPin()
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    await createProfile(name, { avatarId, pin })
    setName('')
    setPin('')
    setAdding(false)
  }

  const editing = profiles.find((profile) => profile.id === editingId) ?? null
  const picked = PROFILE_AVATARS.find((avatar) => avatar.id === avatarId) ?? PROFILE_AVATARS[0]
  const editPicked = PROFILE_AVATARS.find((avatar) => avatar.id === editAvatarId) ?? PROFILE_AVATARS[0]

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    await updateProfile(editing.id, {
      name: editName,
      avatarId: editAvatarId,
      pin: removePin ? null : editPin.length === 4 ? editPin : undefined,
      autoplayNext: editAutoplayNext,
      autoplayPreview: editAutoplayPreview,
    })
    setEditingId(null)
    setManaging(true)
  }

  return (
    <main className="profiles-page">
      <button
        type="button"
        className="logo profiles-logo"
        onClick={() => {
          setPinTarget(null)
          setAdding(false)
          setEditingId(null)
          setManaging(false)
        }}
        aria-label="Flix"
      >
        FLIX
      </button>
      {pinTarget ? (
        <form className="pin-sheet" onSubmit={onPin}>
          <h1>Profile Lock is currently on.</h1>
          <p className="profiles-sub">Enter your PIN to access this profile.</p>
          <PinBoxes key={pinShake} value={pinGuess} onChange={setPinGuess} error={Boolean(pinError)} />
          {pinError ? <p className="pin-error">{pinError}</p> : null}
          <button type="submit" className="visually-hidden">
            Continue
          </button>
          <button
            type="button"
            className="pin-forgot"
            onClick={() => setPinError('Ask the account holder to reset this PIN from Manage Profiles.')}
          >
            Forgot PIN?
          </button>
        </form>
      ) : adding ? (
        <form className="add-profile-sheet" onSubmit={onAdd}>
          <h1>Add Profile</h1>
          <p className="profiles-sub">Add a profile for another person watching Flix.</p>
          <div className="add-profile-row">
            <button
              type="button"
              className="profile-avatar"
              style={{ background: picked.color }}
              aria-label="Change profile picture"
              onClick={() => {
                const next = PROFILE_AVATARS[(PROFILE_AVATARS.findIndex((a) => a.id === picked.id) + 1) % PROFILE_AVATARS.length]
                setAvatarId(next.id)
              }}
            >
              <AvatarArt avatar={picked} alt={picked.label} />
            </button>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              autoFocus
              required
              aria-label="Profile name"
            />
          </div>
          <div className="avatar-picker">
            {PROFILE_AVATARS.map((avatar) => (
              <button
                type="button"
                key={avatar.id}
                className={`profile-avatar picker ${picked.id === avatar.id ? 'is-on' : ''}`}
                style={{ background: avatar.color }}
                onClick={() => {
                  setAvatarId(avatar.id)
                }}
                aria-label={avatar.label}
              >
                <AvatarArt avatar={avatar} alt={avatar.label} />
              </button>
            ))}
          </div>
          <input
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Optional PIN"
          />
          <div className="add-profile-actions">
            <button type="submit" className="btn btn-light">
              Continue
            </button>
            <button type="button" className="btn manage-profiles" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : editing ? (
        <form className="add-profile-sheet edit-profile-sheet" onSubmit={onSaveEdit}>
          <h1>Edit Profile</h1>
          <div className="add-profile-row">
            <button
              type="button"
              className="profile-avatar is-managing"
              style={{ background: editPicked.color }}
              aria-label="Change profile picture"
              onClick={() => {
                const next =
                  PROFILE_AVATARS[
                    (PROFILE_AVATARS.findIndex((avatar) => avatar.id === editPicked.id) + 1) % PROFILE_AVATARS.length
                  ]
                setEditAvatarId(next.id)
              }}
            >
              <AvatarArt avatar={editPicked} alt={editPicked.label} />
              <span className="profile-pencil" aria-hidden="true">
                <PencilIcon className="icon" />
              </span>
            </button>
            <input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              placeholder="Name"
              autoFocus
              required
              maxLength={20}
              aria-label="Profile name"
            />
          </div>
          <div className="avatar-picker">
            {PROFILE_AVATARS.map((avatar) => (
              <button
                type="button"
                key={avatar.id}
                className={`profile-avatar picker ${editPicked.id === avatar.id ? 'is-on' : ''}`}
                style={{ background: avatar.color }}
                onClick={() => {
                  setEditAvatarId(avatar.id)
                }}
                aria-label={avatar.label}
              >
                <AvatarArt avatar={avatar} alt={avatar.label} />
              </button>
            ))}
          </div>
          <div className="edit-pin-row">
            <input
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={editPin}
              onChange={(event) => {
                setRemovePin(false)
                setEditPin(event.target.value.replace(/\D/g, '').slice(0, 4))
              }}
              placeholder={editing.pinHash ? 'New PIN' : 'Optional PIN'}
              aria-label="Profile PIN"
            />
            {editing.pinHash ? (
              <label className="profile-check">
                <input
                  type="checkbox"
                  checked={removePin}
                  onChange={(event) => {
                    setRemovePin(event.target.checked)
                    if (event.target.checked) setEditPin('')
                  }}
                />
                Remove PIN
              </label>
            ) : null}
          </div>
          <label className="edit-toggle">
            <span>
              Autoplay next episode
              <small>Play the next episode automatically on all devices.</small>
            </span>
            <input
              type="checkbox"
              checked={editAutoplayNext}
              onChange={(event) => setEditAutoplayNext(event.target.checked)}
            />
          </label>
          <label className="edit-toggle">
            <span>
              Autoplay previews
              <small>Play previews while browsing on all devices.</small>
            </span>
            <input
              type="checkbox"
              checked={editAutoplayPreview}
              onChange={(event) => setEditAutoplayPreview(event.target.checked)}
            />
          </label>
          <div className="add-profile-actions">
            <button type="submit" className="btn btn-light">
              Save
            </button>
            <button type="button" className="btn manage-profiles" onClick={() => setEditingId(null)}>
              Cancel
            </button>
            {profiles.length > 1 ? (
              <button
                type="button"
                className="btn manage-profiles is-danger"
                onClick={() => {
                  const id = editing.id
                  setEditingId(null)
                  deleteProfile(id)
                }}
              >
                Delete Profile
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <>
          <h1>{managing ? 'Manage Profiles' : "Who's watching?"}</h1>
          <div className="profile-grid">
            {profiles.map((profile) => {
              const avatar = avatarFor(profile)
              return (
                <button
                  type="button"
                  key={profile.id}
                  className={`profile-cell ${managing ? 'is-managing' : ''}`}
                  onClick={() => onSelect(profile)}
                  aria-label={managing ? `Edit ${profile.name}` : `Watch as ${profile.name}`}
                >
                  <span
                    className={`profile-avatar ${managing ? 'is-managing' : ''}`}
                    style={{ background: avatar.color }}
                  >
                    <AvatarArt avatar={avatar} alt="" />
                    {managing ? (
                      <span className="profile-pencil" aria-hidden="true">
                        <PencilIcon className="icon" />
                      </span>
                    ) : null}
                  </span>
                  <span className="profile-name">{profile.name}</span>
                  {profile.pinHash && !managing ? <LockIcon className="profile-lock" /> : null}
                </button>
              )
            })}
            <button type="button" className="profile-cell" onClick={() => setAdding(true)} aria-label="Add profile">
              <span className="profile-add">
                <span className="profile-add-plus">
                  <PlusIcon className="icon" />
                </span>
              </span>
              <span className="profile-name">Add Profile</span>
            </button>
          </div>
          {profiles.length ? (
            <button
              type="button"
              className={`btn manage-profiles ${managing ? 'is-done' : ''}`}
              onClick={() => setManaging((value) => !value)}
            >
              {managing ? 'Done' : 'Manage Profiles'}
            </button>
          ) : null}
        </>
      )}
    </main>
  )
}
