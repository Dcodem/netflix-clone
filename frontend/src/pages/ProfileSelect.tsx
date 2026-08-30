import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AvatarArt } from '../components/AvatarArt'
import { CatalogImage } from '../components/CatalogImage'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, DoubleThumbUpIcon, LockIcon, PencilIcon, PlusIcon, ThumbDownIcon, ThumbUpIcon } from '../components/Icons'
import { FooterNoteDialog, FOOTER_NOTES } from '../components/SiteFooter'
import { useAuth } from '../auth/AuthContext'
import { useProfiles } from '../profiles/ProfileContext'
import { playProfileSting } from '../lib/sounds'
import { activityStamp, profileRatingRows } from '../lib/netflix'
import {
  PROFILE_AVATARS,
  PROFILE_LANGUAGES,
  PROFILE_MATURITY,
  avatarFor,
  type Profile,
} from '../profiles/types'

type EditPanel = 'language' | 'maturity' | 'lock' | 'handle' | 'activity' | 'ratings' | null

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
  const { user, logout } = useAuth()
  const {
    profiles,
    selectProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    unlockProfile,
    removeHistory,
    rateTitle,
    activeProfile,
  } = useProfiles()
  const navigate = useNavigate()
  const location = useLocation()
  const [managing, setManaging] = useState(() => Boolean((location.state as { manage?: boolean } | null)?.manage))
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
  const [editSkipIntros, setEditSkipIntros] = useState(false)
  const [editLang, setEditLang] = useState<(typeof PROFILE_LANGUAGES)[number]>('English')
  const [editMaturity, setEditMaturity] = useState<(typeof PROFILE_MATURITY)[number]>('All Maturity Ratings')
  const [editHandle, setEditHandle] = useState('')
  const [editPanel, setEditPanel] = useState<EditPanel>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [pinTarget, setPinTarget] = useState<Profile | null>(null)
  const [pinGuess, setPinGuess] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinShake, setPinShake] = useState(0)
  const [pickingAvatar, setPickingAvatar] = useState(false)
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

  useEffect(() => {
    if ((location.state as { manage?: boolean } | null)?.manage) {
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, navigate])

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
    setEditSkipIntros(Boolean(profile.skipIntros))
    setEditLang(profile.language || 'English')
    setEditMaturity(profile.maturity || 'All Maturity Ratings')
    setEditHandle(profile.gameHandle || '')
    setEditPanel(null)
    setPickingAvatar(false)
  }

  function toggleEditPanel(panel: Exclude<EditPanel, null>) {
    setEditPanel((current) => (current === panel ? null : panel))
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
    setPickingAvatar(false)
  }

  const editing = profiles.find((profile) => profile.id === editingId) ?? null
  const ratingRows = editing ? profileRatingRows(editing) : []
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
      skipIntros: editSkipIntros,
      language: editLang,
      maturity: editMaturity,
      gameHandle: editHandle,
    })
    setEditingId(null)
    setPickingAvatar(false)
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
          setPickingAvatar(false)
          setManaging(false)
        }}
        aria-label="Flix"
      >
        FLIX
      </button>
      {pinTarget ? (
        <form className="pin-sheet" onSubmit={onPin}>
          <div className="pin-profile">
            <span className="profile-avatar pin-avatar" style={{ background: avatarFor(pinTarget).color }}>
              <AvatarArt avatar={avatarFor(pinTarget)} alt={pinTarget.name} />
            </span>
            <strong>{pinTarget.name}</strong>
          </div>
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
      ) : pickingAvatar ? (
        <div className="icon-picker-page">
          <button type="button" className="icon-picker-back" onClick={() => setPickingAvatar(false)} aria-label="Back">
            <ChevronLeftIcon className="icon" />
          </button>
          <p className="icon-picker-kicker">{editing ? 'Edit Profile' : 'Add Profile'}</p>
          <h1>Choose a profile icon</h1>
          <div className="avatar-picker is-page">
            {PROFILE_AVATARS.map((avatar) => {
              const on = (editing ? editPicked.id : picked.id) === avatar.id
              return (
                <button
                  type="button"
                  key={avatar.id}
                  className={`profile-avatar picker ${on ? 'is-on' : ''}`}
                  style={{ background: avatar.color }}
                  onClick={() => {
                    if (editing) setEditAvatarId(avatar.id)
                    else setAvatarId(avatar.id)
                    setPickingAvatar(false)
                  }}
                  aria-label={avatar.label}
                >
                  <AvatarArt avatar={avatar} alt={avatar.label} />
                </button>
              )
            })}
          </div>
        </div>
      ) : adding ? (
        <form className="add-profile-sheet" onSubmit={onAdd}>
          <h1>Add Profile</h1>
          <p className="profiles-sub">Add a profile for another person watching Flix.</p>
          <div className="add-profile-row">
            <button
              type="button"
              className="profile-avatar is-managing"
              style={{ background: picked.color }}
              aria-label="Change profile picture"
              onClick={() => setPickingAvatar(true)}
            >
              <AvatarArt avatar={picked} alt={picked.label} />
              <span className="profile-pencil" aria-hidden="true">
                <PencilIcon className="icon" />
              </span>
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
              onClick={() => setPickingAvatar(true)}
            >
              <AvatarArt avatar={editPicked} alt={editPicked.label} />
              <span className="profile-pencil" aria-hidden="true">
                <PencilIcon className="icon" />
              </span>
            </button>
            <div className="edit-profile-fields">
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Name"
                autoFocus
                required
                maxLength={20}
                aria-label="Profile name"
              />
              <button
                type="button"
                className={`edit-row ${editPanel === 'language' ? 'is-open' : ''}`}
                onClick={() => toggleEditPanel('language')}
              >
                <span className="edit-row-copy">
                  <strong>Display Language</strong>
                  <em>{editLang}</em>
                </span>
                <ChevronRightIcon className="icon" />
              </button>
              {editPanel === 'language' ? (
                <div className="edit-row-panel" role="listbox" aria-label="Language">
                  {PROFILE_LANGUAGES.map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      className={lang === editLang ? 'is-on' : ''}
                      onClick={() => {
                        setEditLang(lang)
                        setEditPanel(null)
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className={`edit-row ${editPanel === 'maturity' ? 'is-open' : ''}`}
                onClick={() => toggleEditPanel('maturity')}
              >
                <span className="edit-row-copy">
                  <strong>Maturity Settings</strong>
                  <em>{editMaturity}</em>
                </span>
                <ChevronRightIcon className="icon" />
              </button>
              {editPanel === 'maturity' ? (
                <div className="edit-row-panel" role="listbox" aria-label="Maturity Settings">
                  {PROFILE_MATURITY.map((level) => (
                    <button
                      type="button"
                      key={level}
                      className={level === editMaturity ? 'is-on' : ''}
                      onClick={() => {
                        setEditMaturity(level)
                        setEditPanel(null)
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className={`edit-row ${editPanel === 'lock' ? 'is-open' : ''}`}
                onClick={() => toggleEditPanel('lock')}
              >
                <span className="edit-row-copy">
                  <strong>Profile Lock</strong>
                  <em>{editing.pinHash && !removePin ? 'On' : 'Off'}</em>
                </span>
                <ChevronRightIcon className="icon" />
              </button>
              {editPanel === 'lock' ? (
                <div className="edit-row-panel edit-lock-panel">
                  <p>Require a PIN to select this profile from Who&apos;s watching.</p>
                  <input
                    className="edit-pin-field"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={editPin}
                    onChange={(event) => {
                      setRemovePin(false)
                      setEditPin(event.target.value.replace(/\D/g, '').slice(0, 4))
                    }}
                    placeholder={editing.pinHash && !removePin ? 'New PIN' : 'Set a PIN'}
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
              ) : null}
              <button
                type="button"
                className={`edit-row ${editPanel === 'handle' ? 'is-open' : ''}`}
                onClick={() => toggleEditPanel('handle')}
              >
                <span className="edit-row-copy">
                  <strong>Game Handle</strong>
                  <em>{editHandle || 'Create a Game Handle'}</em>
                </span>
                <ChevronRightIcon className="icon" />
              </button>
              {editPanel === 'handle' ? (
                <div className="edit-row-panel edit-lock-panel">
                  <p>Play and connect with friends across games on FLIX.</p>
                  <input
                    className="edit-pin-field"
                    value={editHandle}
                    maxLength={16}
                    onChange={(event) =>
                      setEditHandle(event.target.value.replace(/[^\w-]/g, '').slice(0, 16))
                    }
                    placeholder="Set a handle"
                    aria-label="Game handle"
                  />
                </div>
              ) : null}
              <button
                type="button"
                className={`edit-row ${editPanel === 'activity' ? 'is-open' : ''}`}
                onClick={() => toggleEditPanel('activity')}
              >
                <span className="edit-row-copy">
                  <strong>Viewing activity</strong>
                  <em>
                    {editing.history.length
                      ? `${editing.history.length} title${editing.history.length === 1 ? '' : 's'}`
                      : 'None'}
                  </em>
                </span>
                <ChevronRightIcon className="icon" />
              </button>
              {editPanel === 'activity' ? (
                <div className="edit-row-panel edit-activity-panel">
                  {editing.history.length ? (
                    editing.history.map((entry) => {
                      const episode =
                        entry.kind === 'show' && entry.seasonNumber && entry.episodeNumber
                          ? `S${entry.seasonNumber}:E${entry.episodeNumber}`
                          : null
                      return (
                        <div className="activity-row" key={`${entry.id}-${entry.watchedAt}`}>
                          <CatalogImage
                            item={{
                              title: entry.title,
                              kind: entry.kind,
                              poster_url: entry.poster_url,
                            }}
                            prefer="backdrop"
                            alt=""
                          />
                          <span className="activity-copy">
                            <strong>{entry.title}</strong>
                            <em>
                              {episode ? `${episode} · ` : ''}
                              {activityStamp(entry.watchedAt)}
                            </em>
                          </span>
                          <button
                            type="button"
                            className="activity-remove"
                            aria-label={`Remove ${entry.title}`}
                            onClick={() => removeHistory(editing.id, entry.id)}
                          >
                            <CloseIcon className="icon" />
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <p>No titles watched on this profile yet.</p>
                  )}
                </div>
              ) : null}
              <button
                type="button"
                className={`edit-row ${editPanel === 'ratings' ? 'is-open' : ''}`}
                onClick={() => toggleEditPanel('ratings')}
              >
                <span className="edit-row-copy">
                  <strong>Ratings</strong>
                  <em>
                    {ratingRows.length
                      ? `${ratingRows.length} title${ratingRows.length === 1 ? '' : 's'}`
                      : 'None'}
                  </em>
                </span>
                <ChevronRightIcon className="icon" />
              </button>
              {editPanel === 'ratings' ? (
                <div className="edit-row-panel edit-activity-panel">
                  {ratingRows.length ? (
                    ratingRows.map(({ item, rating }) => (
                      <div className="activity-row" key={`${item.id}-${rating}`}>
                        <CatalogImage
                          item={{
                            title: item.title,
                            kind: item.kind,
                            poster_url: item.poster_url,
                          }}
                          prefer="backdrop"
                          alt=""
                        />
                        <span className="activity-copy">
                          <strong>{item.title}</strong>
                          <em className="activity-rating">
                            {rating === 'love' ? (
                              <DoubleThumbUpIcon className="icon" />
                            ) : rating === 'down' ? (
                              <ThumbDownIcon className="icon" />
                            ) : (
                              <ThumbUpIcon className="icon" />
                            )}
                            {rating === 'love' ? 'Loved' : rating === 'down' ? 'Not for me' : 'Liked'}
                          </em>
                        </span>
                        <button
                          type="button"
                          className="activity-remove"
                          aria-label={`Remove rating for ${item.title}`}
                          onClick={() => rateTitle(item, null, editing.id)}
                        >
                          <CloseIcon className="icon" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No titles rated on this profile yet.</p>
                  )}
                </div>
              ) : null}
              <button
                type="button"
                className="edit-row"
                onClick={() => setTransferOpen(true)}
              >
                <span className="edit-row-copy">
                  <strong>Transfer this profile</strong>
                  <em>Copy this profile to another account</em>
                </span>
                <ChevronRightIcon className="icon" />
              </button>
            </div>
          </div>
          <div className="edit-autoplay">
            <h2>Autoplay controls</h2>
            <label className="edit-check">
              <input
                type="checkbox"
                checked={editAutoplayNext}
                onChange={(event) => setEditAutoplayNext(event.target.checked)}
              />
              <span>
                Autoplay next episode
                <small>Play the next episode automatically on all devices.</small>
              </span>
            </label>
            <label className="edit-check">
              <input
                type="checkbox"
                checked={editAutoplayPreview}
                onChange={(event) => setEditAutoplayPreview(event.target.checked)}
              />
              <span>
                Autoplay previews
                <small>Play previews while browsing on all devices.</small>
              </span>
            </label>
            <label className="edit-check">
              <input
                type="checkbox"
                checked={editSkipIntros}
                onChange={(event) => setEditSkipIntros(event.target.checked)}
              />
              <span>
                Auto-skip recaps and intros
                <small>Skip the recap and intro on TV shows.</small>
              </span>
            </label>
          </div>
          <div className="add-profile-actions">
            <button type="submit" className="btn btn-light">
              Save
            </button>
            <button
              type="button"
              className="btn manage-profiles"
              onClick={() => {
                setEditingId(null)
                setPickingAvatar(false)
                setEditPanel(null)
                setTransferOpen(false)
              }}
            >
              Cancel
            </button>
            {profiles.length > 1 ? (
              <button
                type="button"
                className="btn manage-profiles is-danger"
                onClick={() => {
                  const id = editing.id
                  setEditingId(null)
                  setPickingAvatar(false)
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
          {!managing ? (
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
          ) : null}
        </>
      )}
      {transferOpen ? (
        <FooterNoteDialog
          title="Transfer Profile"
          body={FOOTER_NOTES['Transfer Profile']}
          onClose={() => setTransferOpen(false)}
        />
      ) : null}
    </main>
  )
}
