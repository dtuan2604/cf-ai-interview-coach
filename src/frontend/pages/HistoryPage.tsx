import { Link } from 'react-router-dom'
import { useAppSelector } from '../hooks/redux'

export function HistoryPage() {
  const sessions = useAppSelector((state) => state.history.items)

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Session history</p>
          <h2>Structured records live in D1 later</h2>
        </div>
        <p className="subtle">
          Step 1 uses local mock history so the frontend stays runnable before the D1 layer
          is added.
        </p>
      </div>

      <div className="history-grid">
        {sessions.map((session) => (
          <article key={session.id} className="panel">
            <div className="panel-row">
              <span className="pill">{session.status}</span>
              <span className="subtle">
                {new Date(session.completedAt).toLocaleDateString()}
              </span>
            </div>
            <h3>{session.role}</h3>
            <p className="subtle">
              {session.interviewType} · {session.difficulty} · {session.mode}
            </p>
            <p>{session.summary}</p>
            <div className="score-row">
              <strong>{session.score.toFixed(1)}/10</strong>
              <Link className="text-link" to={`/reports/${session.id}`}>
                Open report
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
