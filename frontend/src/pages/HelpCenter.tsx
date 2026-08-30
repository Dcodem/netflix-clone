import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon } from '../components/Icons'
import { filterHelpTopics } from '../lib/help'

export function HelpCenter() {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const topics = useMemo(() => filterHelpTopics(query), [query])

  return (
    <main className="page-pad account-page help-page">
      <h1>Help Center</h1>
      <p className="help-lead">Find answers about watching, Account, and profiles on this device.</p>
      <label className="help-search">
        <SearchIcon className="icon" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search help"
          autoComplete="off"
        />
      </label>

      {topics.length ? (
        topics.map((topic) => (
          <section className="help-topic" key={topic.id}>
            <h2>{topic.title}</h2>
            <div className="help-articles">
              {topic.articles.map((article) => {
                const open = openId === article.id
                return (
                  <article className={`help-article ${open ? 'is-open' : ''}`} key={article.id}>
                    <button
                      type="button"
                      className="help-article-toggle"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : article.id)}
                    >
                      <span>{article.title}</span>
                    </button>
                    {open ? <p className="help-article-body">{article.body}</p> : null}
                  </article>
                )
              })}
            </div>
          </section>
        ))
      ) : (
        <p className="help-empty">No help articles match “{query.trim()}”.</p>
      )}

      <p className="help-foot">
        FLIX is a browser-only demo. There is no support inbox.{' '}
        <Link to="/account">Account</Link> keeps membership, playback, and privacy on this device.
      </p>
    </main>
  )
}
