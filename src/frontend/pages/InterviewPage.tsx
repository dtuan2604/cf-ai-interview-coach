import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { recordCompletedSession } from '../slices/historySlice'
import { endSession, submitMockAnswer } from '../slices/sessionSlice'

export function InterviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const session = useAppSelector((state) => state.session.current)
  const [draft, setDraft] = useState('')

  const currentQuestion = useMemo(() => {
    if (!session) {
      return ''
    }

    return session.questions[session.questionIndex] ?? 'Session complete.'
  }, [session])

  if (!session || session.id !== sessionId) {
    return <Navigate to="/setup" replace />
  }

  const handleSubmit = () => {
    if (!draft.trim()) {
      return
    }

    dispatch(submitMockAnswer({ text: draft }))
    setDraft('')
  }

  const handleEndSession = () => {
    dispatch(endSession())
    dispatch(
      recordCompletedSession({
        role: session.role,
        interviewType: session.interviewType,
        difficulty: session.difficulty,
        mode: session.mode === 'voice' ? 'Voice' : 'Text',
        status: 'completed',
        score: session.latestEvaluation?.score ?? 7,
        completedAt: new Date().toISOString(),
        summary:
          session.latestEvaluation?.summary ??
          'Mock session ended before the real Worker evaluation pipeline was connected.',
      }),
    )
    navigate(`/reports/${session.id}`)
  }

  return (
    <section className="interview-layout">
      <div className="stack-lg">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Interview session</p>
            <h2>
              {session.role} · {session.interviewType}
            </h2>
          </div>
          <div className="progress-box">
            <span className="subtle">Question</span>
            <strong>
              {Math.min(session.questionIndex + 1, session.totalQuestions)}/
              {session.totalQuestions}
            </strong>
          </div>
        </div>

        <div className="panel conversation-panel">
          {session.transcript.map((turn) => (
            <article key={turn.id} className={`turn turn-${turn.speaker}`}>
              <header className="panel-row">
                <strong className="turn-label">{turn.speaker}</strong>
                <span className="subtle">
                  {new Date(turn.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </header>
              <p>{turn.text}</p>
            </article>
          ))}
        </div>

        <div className="panel stack-md">
          <div className="panel-row">
            <h3>Answer input</h3>
            <span className="pill">{session.mode === 'voice' ? 'voice' : 'text'} mode</span>
          </div>
          <p className="subtle">
            Text mode is the stable path. Voice mode will stay turn-based and will reuse this
            same interview engine after transcription is added.
          </p>
          <textarea
            className="answer-box"
            rows={8}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Answer the current question: ${currentQuestion}`}
          />
          <div className="actions">
            <button className="button button-primary" onClick={handleSubmit}>
              Submit answer locally
            </button>
            <button className="button button-secondary" onClick={handleEndSession}>
              End session
            </button>
          </div>
        </div>
      </div>

      <aside className="stack-md">
        <div className="panel stack-sm">
          <h3>Live coaching</h3>
          <p className="subtle">
            This sidebar is where per-answer evaluation and memory-aware coaching will surface
            once the Worker pipeline is connected.
          </p>
          <div className="metric-card">
            <span className="subtle">Latest score</span>
            <strong>{session.latestEvaluation?.score?.toFixed(1) ?? 'Pending'}</strong>
          </div>
          <div>
            <p className="subtle">Current focus</p>
            <p>
              {session.latestEvaluation?.summary ??
                'Waiting for the first answer. Future steps replace this mock state with Workers AI evaluation.'}
            </p>
          </div>
        </div>

        <div className="panel stack-sm">
          <h3>Architecture checkpoint</h3>
          <p className="subtle">
            Durable Object later owns this session. D1 later stores reports, evaluations, and
            history records.
          </p>
          <Link className="text-link" to="/history">
            View mock history
          </Link>
        </div>
      </aside>
    </section>
  )
}
