import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useProfiles } from '../profiles/ProfileContext'

export function ProfileSelect() {
  const { profiles, selectProfile, createProfile, renameProfile, deleteProfile, activeProfile } =
    useProfiles()
  const navigate = useNavigate()
  const [managing, setManaging] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  if (activeProfile && !managing && !adding) {
    return <Navigate to="/browse" replace />
  }

  function onSelect(id: string) {
    if (managing) return
    selectProfile(id)
    navigate('/browse')
  }

  function onAdd(event: FormEvent) {
    event.preventDefault()
    const profile = createProfile(name)
    setName('')
    setAdding(false)
    selectProfile(profile.id)
    navigate('/browse')
  }

  return (
    <main className="profiles-page">
      <h1>Who&apos;s watching?</h1>
      <p className="profiles-sub">Profiles stay on this device. Watch history builds a taste row just for you.</p>
      <div className="profile-grid">
        {profiles.map((profile) => (
          <div key={profile.id} className="profile-cell">
            <button
              type="button"
              className="profile-avatar"
              style={{ background: profile.color }}
              onClick={() => onSelect(profile.id)}
            >
              {profile.name.slice(0, 1).toUpperCase()}
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
              <div className="profile-name">{profile.name}</div>
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
        ))}
        <button type="button" className="profile-add" onClick={() => setAdding(true)}>
          <span>+</span>
          Add profile
        </button>
      </div>
      {adding ? (
        <form className="profile-form" onSubmit={onAdd}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            autoFocus
            required
          />
          <button type="submit" className="btn btn-primary">
            Create
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : null}
      {profiles.length ? (
        <button type="button" className="btn btn-ghost manage-btn" onClick={() => setManaging((v) => !v)}>
          {managing ? 'Done' : 'Manage profiles'}
        </button>
      ) : null}
    </main>
  )
}
