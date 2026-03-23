import { Link, useParams } from 'react-router-dom'
import { useAppSelector } from '../hooks/redux'

export function ReportPage() {
  const { sessionId } = useParams()
  const session = useAppSelector((state) => state.session.current)
  const historyItem = useAppSelector((state) =>
    state.history.items.find((item) => item.id === sessionId),
  )

  const isCurrentSession = session?.id === sessionId
  const title = isCurrentSession ? session?.role : historyItem?.role
  const score = isCurrentSession ? session?.latestEvaluation?.score : historyItem?.score

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Final report</p>
          <h2>{title ?? 'Session report'} </h2>
        </div>
        <Link className="text-link" to="/history">
          Back to history
        </Link>
      </div>

      <div className="info-grid">
        <article className="panel stack-sm">
          <p className="subtle">Overall score</p>
          <strong className="score-large">
            {typeof score === 'number' ? `${score.toFixed(1)}/10` : 'Pending'}
          </strong>
          <p>
            Step 1 uses a local mock report. A later Worker step will replace this with a
            structured report generated from D1 records and session memory.
          </p>
        </article>
        <article className="panel stack-sm">
          <p className="subtle">Readiness assessment</p>
          <p>
            Candidate shows a solid baseline, with the biggest upside coming from tighter
            structure, clearer impact framing, and more explicit tradeoff reasoning.
          </p>
        </article>
      </div>

      <div className="info-grid">
        <article className="panel stack-sm">
          <h3>Strengths</h3>
          <p>Communication is clear and direct. Answers usually identify the right direction.</p>
        </article>
        <article className="panel stack-sm">
          <h3>Growth areas</h3>
          <p>Add sharper examples, metrics, and decision criteria to make responses interview-ready.</p>
        </article>
        <article className="panel stack-sm">
          <h3>Next steps</h3>
          <p>Practice with role-specific follow-ups and maintain a tighter answer structure.</p>
        </article>
      </div>
    </section>
  )
}
