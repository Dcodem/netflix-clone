import { Link } from 'react-router-dom'

const WAYS = [
  {
    id: 'computer',
    title: 'Computer',
    body: 'Play titles in this browser window. Overlay chrome uses the catalog runtime as the clock.',
    available: true,
  },
  {
    id: 'mobile',
    title: 'Phone & Tablet',
    body: 'The same FLIX site on a phone. Home, New & Hot, and My Netflix sit in the dock.',
    available: true,
  },
  {
    id: 'tv',
    title: 'Smart TV',
    body: 'There is no FLIX TV app, Chromecast pairing, or living-room build in this demo.',
    available: false,
  },
  {
    id: 'console',
    title: 'Game consoles',
    body: 'There is no FLIX app for consoles. Playback stays on this device.',
    available: false,
  },
] as const

export function WaysToWatch() {
  return (
    <main className="page-pad account-page ways-page">
      <h1>Ways to Watch</h1>
      <p className="help-lead">Watch FLIX in this browser. There is no TV app or extra download.</p>
      <ul className="ways-grid">
        {WAYS.map((way) => (
          <li className={`ways-card ${way.available ? 'is-on' : 'is-off'}`} key={way.id}>
            <p className="ways-card-kicker">{way.available ? 'Available' : 'Not on this demo'}</p>
            <h2>{way.title}</h2>
            <p>{way.body}</p>
          </li>
        ))}
      </ul>
      <p className="help-foot">
        Open a title and choose Play. Cast looks for devices on this network but does not pair.{' '}
        <Link to="/browse">Back to Home</Link>
      </p>
    </main>
  )
}
