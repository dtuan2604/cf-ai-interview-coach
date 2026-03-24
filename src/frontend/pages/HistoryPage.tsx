import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loadInterviewHistory } from '../slices/historySlice'

export function HistoryPage() {
  const dispatch = useAppDispatch()
  const sessions = useAppSelector((state) => state.history.items)
  const status = useAppSelector((state) => state.history.status)
  const error = useAppSelector((state) => state.history.error)

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(loadInterviewHistory())
    }
  }, [dispatch, status])

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Session history</p>
          <h2>Saved interview sessions</h2>
        </div>
        <p className="subtle">
          Return to past practice sessions and reopen the full coaching report for each one.
        </p>
      </div>

      {status === 'loading' ? (
        <section className="panel stack-sm">
          <h3>Loading history</h3>
          <p className="subtle">Gathering your saved interview sessions.</p>
        </section>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}

      {status !== 'loading' && sessions.length === 0 ? (
        <section className="panel stack-sm">
          <h3>No sessions yet</h3>
          <p className="subtle">
            Complete your first interview session and it will appear here.
          </p>
        </section>
      ) : null}

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
