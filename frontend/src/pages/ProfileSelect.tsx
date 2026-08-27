import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AvatarArt } from '../components/AvatarArt'
import { PencilIcon, PlusIcon } from '../components/Icons'
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
    if (managing) {
      setEditingId(profile.id)
      setEditName(profile.name)
      return
    }
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
      setPinError('Incorrect PIN. Please try again.')
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

  const picked = PROFILE_AVATARS.find((avatar) => avatar.id === (kids ? 'kids' : avatarId)) ?? PROFILE_AVATARS[0]

  return (
    <main className="profiles-page">
      <div className="logo profiles-logo">FLIX</div>
      {pinTarget ? (
        <form className="pin-sheet" onSubmit={onPin}>
          <div className="profile-avatar pin-avatar" style={{ background: avatarFor(pinTarget).color }}>
            <AvatarArt avatar={avatarFor(pinTarget)} alt={pinTarget.name} />
          </div>
          <h1>Enter your PIN</h1>
          <p className="profiles-sub">Unlock {pinTarget.name} to keep watching.</p>
          <input
            className="pin-input"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pinGuess}
            onChange={(event) => setPinGuess(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            autoFocus
            required
            aria-label="PIN"
          />
          {pinError ? <p className="login-error">{pinError}</p> : null}
          <button type="submit" className="btn btn-primary">
            Continue
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPinTarget(null)}>
            Cancel
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
                setKids(next.id === 'kids')
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
            Kid?
          </label>
          {!kids ? (
            <input
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Optional PIN"
            />
          ) : null}
          <div className="add-profile-actions">
            <button type="submit" className="btn btn-light">
              Continue
            </button>
            <button type="button" className="btn manage-profiles" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1>{managing ? 'Manage Profiles' : "Who's watching?"}</h1>
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
                    {managing ? (
                      <span className="profile-pencil" aria-hidden="true">
                        <PencilIcon className="icon" />
                      </span>
                    ) : null}
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
                      <input value={editName} onChange={(event) => setEditName(event.target.value)} autoFocus />
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
            <div className="profile-cell">
              <button type="button" className="profile-add" onClick={() => setAdding(true)} aria-label="Add profile">
                <span className="profile-add-plus">
                  <PlusIcon className="icon" />
                </span>
              </button>
              <div className="profile-name">Add Profile</div>
            </div>
          </div>
          {profiles.length ? (
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
            className="profiles-signout"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Sign out
          </button>
        </>
      )}
    </main>
  )
}
