import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loadInterviewReport } from '../slices/reportSlice'

export function ReportPage() {
  const { sessionId } = useParams()
  const dispatch = useAppDispatch()
  const report = useAppSelector((state) => state.report.current)
  const status = useAppSelector((state) => state.report.status)
  const error = useAppSelector((state) => state.report.error)

  useEffect(() => {
    if (sessionId) {
      void dispatch(loadInterviewReport(sessionId))
    }
  }, [dispatch, sessionId])

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Final report</p>
          <h2>{report?.role ?? 'Session report'}</h2>
        </div>
        <Link className="text-link" to="/history">
          Back to history
        </Link>
      </div>

      {status === 'loading' ? (
        <section className="panel stack-sm">
          <h3>Loading report</h3>
          <p className="subtle">Fetching the persisted session report from D1.</p>
        </section>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}

      {!report && status !== 'loading' ? (
        <section className="panel stack-sm">
          <h3>No persisted report found</h3>
          <p className="subtle">
            End a session after running the D1 migration and the report will be stored here.
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
          </div>
        </>
      ) : null}
    </section>
  )
}
