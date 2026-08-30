import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon } from '../components/Icons'
import { filterFaq } from '../lib/help'

export function Faq() {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const items = useMemo(() => filterFaq(query), [query])

  return (
    <main className="page-pad account-page help-page">
      <h1>FAQ</h1>
      <p className="help-lead">Common questions about watching and Account on this device.</p>
      <label className="help-search">
        <SearchIcon className="icon" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search FAQ"
          autoComplete="off"
        />
      </label>

      {items.length ? (
        <section className="help-topic">
          <div className="help-articles">
            {items.map((item) => {
              const open = openId === item.id
              return (
                <article className={`help-article ${open ? 'is-open' : ''}`} key={item.id}>
                  <button
                    type="button"
                    className="help-article-toggle"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <span>{item.title}</span>
                  </button>
                  {open ? <p className="help-article-body">{item.body}</p> : null}
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <p className="help-empty">No FAQ matches “{query.trim()}”.</p>
      )}

      <p className="help-foot">
        Need more detail?{' '}
        <Link to="/help">Help Center</Link> covers playback, captions, privacy, and My List.
      </p>
    </main>
  )
}
