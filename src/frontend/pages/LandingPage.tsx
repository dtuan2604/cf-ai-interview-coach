import { Link } from 'react-router-dom'
import { appConfig } from '../services/config'

const architectureItems = [
  {
    title: 'Workers AI',
    body: 'Generates interview questions, evaluates answers, and powers the final report.',
  },
  {
    title: 'Durable Objects',
    body: 'Own one interview session at a time with ordered turns, scoring state, and prompt context.',
  },
  {
    title: 'D1',
    body: 'Stores queryable session records, reports, and history data across interviews.',
  },
]

export function LandingPage() {
  return (
    <section className="stack-xl">
      <div className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Text-first interview simulation</p>
          <h2>Practice interviews with stateful coaching, not a generic chat window.</h2>
          <p className="hero-text">
            The MVP focuses on a guided interview workflow: configure a role, run a structured
            session, receive answer-by-answer feedback, and finish with a report backed by
            Cloudflare-native state and persistence.
          </p>
          <div className="actions">
            <Link className="button button-primary" to="/setup">
              Start setup
            </Link>
            <Link className="button button-secondary" to="/history">
              Review history
            </Link>
          </div>
        </div>
        <div className="hero-meta panel">
          <p className="subtle">Frontend model label</p>
          <strong>{appConfig.defaultModelLabel}</strong>
          <p className="subtle">
            Real model IDs stay in Worker environment configuration so deployment can swap
            models without code edits.
          </p>
          <p className="subtle">Current transport: {appConfig.apiTransport}</p>
        </div>
      </div>

      <div className="info-grid">
        {architectureItems.map((item) => (
          <article key={item.title} className="panel stack-sm">
            <p className="eyebrow">Platform mapping</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>

      <div className="info-grid">
        <article className="panel stack-sm">
          <p className="eyebrow">MVP focus</p>
          <h3>Stable text mode first</h3>
          <p>
            Voice is intentionally secondary and turn-based. The shared interview engine matters
            more than streaming complexity for the assignment.
          </p>
        </article>
        <article className="panel stack-sm">
          <p className="eyebrow">State boundary</p>
          <h3>Durable Objects vs D1</h3>
          <p>
            Durable Objects keep per-session working state hot and ordered. D1 keeps durable,
            structured data that supports history, analytics, and reports.
          </p>
        </article>
      </div>
    </section>
  )
}
