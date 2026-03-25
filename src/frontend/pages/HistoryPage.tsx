import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loadInterviewHistory } from '../slices/historySlice'
import { deleteInterviewSession } from '../slices/sessionSlice'

export function HistoryPage() {
  const dispatch = useAppDispatch()
  const sessions = useAppSelector((state) => state.history.items)
  const status = useAppSelector((state) => state.history.status)
  const error = useAppSelector((state) => state.history.error)
  const deleteStatus = useAppSelector((state) => state.session.deleteStatus)
  const deleteSessionId = useAppSelector((state) => state.session.deleteSessionId)
  const deleteError = useAppSelector((state) => state.session.deleteError)

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(loadInterviewHistory())
    }
  }, [dispatch, status])

  const handleDelete = async (sessionId: string, role: string) => {
    const confirmed = window.confirm(
      `Delete the saved ${role} interview session? This also removes its report and feedback history.`,
    )

    if (!confirmed) {
      return
    }

    await dispatch(deleteInterviewSession({ sessionId }))
  }

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
      {deleteError ? <p className="error-text">{deleteError}</p> : null}

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
              <div className="actions">
                <Link className="text-link" to={`/reports/${session.id}`}>
                  Open report
                </Link>
                <button
                  className="button button-secondary"
                  onClick={() => void handleDelete(session.id, session.role)}
                  disabled={deleteStatus === 'loading'}
                >
                  {deleteStatus === 'loading' && deleteSessionId === session.id
                    ? 'Deleting...'
                    : 'Delete'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
