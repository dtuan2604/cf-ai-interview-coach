import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loadInterviewReport } from '../slices/reportSlice'
import { deleteInterviewSession } from '../slices/sessionSlice'

export function ReportPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const report = useAppSelector((state) => state.report.current)
  const status = useAppSelector((state) => state.report.status)
  const error = useAppSelector((state) => state.report.error)
  const deleteStatus = useAppSelector((state) => state.session.deleteStatus)
  const deleteSessionId = useAppSelector((state) => state.session.deleteSessionId)
  const deleteError = useAppSelector((state) => state.session.deleteError)

  useEffect(() => {
    if (sessionId) {
      void dispatch(loadInterviewReport(sessionId))
    }
  }, [dispatch, sessionId])

  const handleDelete = async () => {
    if (!sessionId) {
      return
    }

    const confirmed = window.confirm(
      'Delete this saved interview session? This also removes its report and feedback history.',
    )

    if (!confirmed) {
      return
    }

    const result = await dispatch(deleteInterviewSession({ sessionId }))
    if (deleteInterviewSession.fulfilled.match(result)) {
      navigate('/history')
    }
  }

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Final report</p>
          <h2>{report?.role ?? 'Session report'}</h2>
        </div>
        <div className="actions">
          <Link className="text-link" to="/history">
            Back to history
          </Link>
          <button
            className="button button-secondary"
            onClick={() => void handleDelete()}
            disabled={!sessionId || deleteStatus === 'loading'}
          >
            {deleteStatus === 'loading' && deleteSessionId === sessionId ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {status === 'loading' ? (
        <section className="panel stack-sm">
          <h3>Loading report</h3>
          <p className="subtle">Preparing your coaching report.</p>
        </section>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
      {deleteError ? <p className="error-text">{deleteError}</p> : null}

      {!report && status !== 'loading' ? (
        <section className="panel stack-sm">
          <h3>No report found</h3>
          <p className="subtle">
            Finish a session and the full coaching summary will appear here.
          </p>
        </section>
      ) : null}

      {report ? (
        <>
          <div className="info-grid">
            <article className="panel stack-sm">
              <p className="subtle">Overall score</p>
              <strong className="score-large">{report.overallScore.toFixed(1)}/10</strong>
              <p>{report.summary}</p>
            </article>
            <article className="panel stack-sm">
              <p className="subtle">Readiness assessment</p>
              <p>{report.readinessAssessment}</p>
            </article>
          </div>

          <div className="info-grid">
            <article className="panel stack-sm">
              <h3>Strengths</h3>
              <p>{report.strengths.join(', ')}</p>
            </article>
            <article className="panel stack-sm">
              <h3>Growth areas</h3>
              <p>{report.growthAreas.join(', ')}</p>
            </article>
            <article className="panel stack-sm">
              <h3>Next steps</h3>
              <p>{report.nextSteps.join(', ')}</p>
            </article>
            <article className="panel stack-sm">
              <h3>Standout moments</h3>
              <p>{report.standoutMoments.join(', ')}</p>
            </article>
          </div>
        </>
      ) : null}
    </section>
  )
}
