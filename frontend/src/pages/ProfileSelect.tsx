import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AvatarArt } from '../components/AvatarArt'
import { useAuth } from '../auth/AuthContext'
import { useProfiles } from '../profiles/ProfileContext'
import { PROFILE_AVATARS, avatarFor, type Profile } from '../profiles/types'

export function ProfileSelect() {
  const { user, logout } = useAuth()
  const { profiles, selectProfile, createProfile, renameProfile, deleteProfile, unlockProfile, activeProfile } =
    useProfiles()
  const navigate = useNavigate()
  const [managing, setManaging] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [kids, setKids] = useState(false)
  const [pin, setPin] = useState('')
  const [avatarId, setAvatarId] = useState(PROFILE_AVATARS[0].id)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [pinTarget, setPinTarget] = useState<Profile | null>(null)
  const [pinGuess, setPinGuess] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (activeProfile && !managing && !adding && !pinTarget) {
    return <Navigate to="/browse" replace />
  }

  async function onSelect(profile: Profile) {
    if (managing) return
    if (profile.pinHash) {
      setPinTarget(profile)
      setPinGuess('')
      setPinError(null)
      return
    }
    selectProfile(profile.id)
    navigate('/browse')
  }

  async function onPin(event: FormEvent) {
    event.preventDefault()
    if (!pinTarget) return
    const ok = await unlockProfile(pinTarget.id, pinGuess)
    if (!ok) {
      setPinError('That PIN does not match.')
      return
    }
    setPinTarget(null)
    navigate('/browse')
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    await createProfile(name, { kids, avatarId: kids ? 'kids' : avatarId, pin: kids ? undefined : pin })
    setName('')
    setPin('')
    setKids(false)
    setAdding(false)
  }

  return (
    <main className="profiles-page">
      <h1>{adding ? 'Add a profile' : "Who's watching?"}</h1>
      <div className="profile-grid">
        {profiles.map((profile) => {
          const avatar = avatarFor(profile)
          return (
            <div key={profile.id} className="profile-cell">
              <button
                type="button"
                className={`profile-avatar ${managing ? 'is-managing' : ''} ${profile.kids ? 'is-kids' : ''}`}
                style={{ background: avatar.color }}
                onClick={() => onSelect(profile)}
              >
                <AvatarArt avatar={avatar} alt={profile.name} />
              </button>
              {editingId === profile.id ? (
                <form
                  className="profile-edit"
                  onSubmit={(event) => {
                    event.preventDefault()
                    renameProfile(profile.id, editName)
                    setEditingId(null)
                  }}
                >
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    autoFocus
                  />
                </form>
              ) : (
                <div className="profile-name">
                  {profile.name}
                  {profile.kids ? <span className="kids-tag">Kids</span> : null}
                  {profile.pinHash ? <span className="kids-tag">PIN</span> : null}
                </div>
              )}
              {managing ? (
                <div className="profile-manage">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(profile.id)
                      setEditName(profile.name)
                    }}
                  >
                    Rename
                  </button>
                  <button type="button" className="danger" onClick={() => deleteProfile(profile.id)}>
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
        {adding ? null : (
          <button type="button" className="profile-add" onClick={() => setAdding(true)}>
            <span>+</span>
            Add profile
          </button>
        )}
      </div>
      {pinTarget ? (
        <form className="profile-form pin-form" onSubmit={onPin}>
          <p>Enter the PIN for {pinTarget.name}</p>
          <input
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pinGuess}
            onChange={(event) => setPinGuess(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            autoFocus
            required
          />
          {pinError ? <p className="login-error">{pinError}</p> : null}
          <button type="submit" className="btn btn-primary">
            Continue
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPinTarget(null)}>
            Cancel
          </button>
        </form>
      ) : null}
      {adding ? (
        <form className="profile-form add-profile-form" onSubmit={onAdd}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            autoFocus
            required
          />
          <p className="section-sub">Pick a profile picture</p>
          <div className="avatar-picker">
            {PROFILE_AVATARS.map((avatar) => (
              <button
                type="button"
                key={avatar.id}
                className={`profile-avatar picker ${(!kids && avatarId === avatar.id) || (kids && avatar.id === 'kids') ? 'is-on' : ''}`}
                style={{ background: avatar.color }}
                onClick={() => {
                  setAvatarId(avatar.id)
                  setKids(avatar.id === 'kids')
                }}
                aria-label={avatar.label}
              >
                <AvatarArt avatar={avatar} alt={avatar.label} />
              </button>
            ))}
          </div>
          <label className="kids-check">
            <input
              type="checkbox"
              checked={kids}
              onChange={(event) => {
                const next = event.target.checked
                setKids(next)
                if (next) setAvatarId('kids')
              }}
            />
            Kids profile (only PG titles)
          </label>
          {!kids ? (
            <input
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Optional 4-digit PIN"
            />
          ) : null}
          <button type="submit" className="btn btn-primary">
            Create
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : null}
      {profiles.length && !adding ? (
        <button
          type="button"
          className="btn manage-profiles"
          onClick={() => setManaging((value) => !value)}
        >
          {managing ? 'Done' : 'Manage Profiles'}
        </button>
      ) : null}
      <button
        type="button"
        className="btn btn-ghost manage-btn"
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        Sign out
      </button>
    </main>
  )
}
