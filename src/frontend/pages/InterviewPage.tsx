import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  endInterviewSession,
  loadInterviewSession,
  submitInterviewAnswer,
} from '../slices/sessionSlice'

export function InterviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const session = useAppSelector((state) => state.session.current)
  const loadStatus = useAppSelector((state) => state.session.loadStatus)
  const answerStatus = useAppSelector((state) => state.session.answerStatus)
  const endStatus = useAppSelector((state) => state.session.endStatus)
  const sessionError = useAppSelector((state) => state.session.error)
  const transport = useAppSelector((state) => state.session.transport)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (sessionId && (!session || session.id !== sessionId)) {
      void dispatch(loadInterviewSession(sessionId))
    }
  }, [dispatch, session, sessionId])

  const currentQuestion = useMemo(() => {
    if (!session) {
      return ''
    }

    return session.questions[session.questionIndex] ?? 'Session complete.'
  }, [session])

  if (!sessionId) {
    return <Navigate to="/setup" replace />
  }

  if (loadStatus === 'loading' && (!session || session.id !== sessionId)) {
    return (
      <section className="panel stack-sm">
        <p className="eyebrow">Session loading</p>
        <h2>Restoring interview state</h2>
        <p className="subtle">
          The Worker is loading the current session snapshot from its Durable Object.
        </p>
      </section>
    )
  }

  if (!session || session.id !== sessionId) {
    return (
      <section className="panel stack-sm">
        <p className="eyebrow">Session unavailable</p>
        <h2>We could not restore this interview.</h2>
        <p className="subtle">
          {sessionError ?? 'The session may have expired or the Worker is not running.'}
        </p>
        <Link className="text-link" to="/setup">
          Start a new session
        </Link>
      </section>
    )
  }

  const handleSubmit = async () => {
    if (!draft.trim()) {
      return
    }

    const result = await dispatch(
      submitInterviewAnswer({
        sessionId: session.id,
        answer: draft,
      }),
    )

    if (submitInterviewAnswer.fulfilled.match(result)) {
      setDraft('')
    }
  }

  const handleEndSession = async () => {
    const result = await dispatch(
      endInterviewSession({
        sessionId: session.id,
      }),
    )

    if (endInterviewSession.fulfilled.match(result)) {
      navigate(`/reports/${result.payload.session.id}`)
    }
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
          <p className="subtle">Transport: {transport}</p>
          <p className="subtle">
            Text mode is the stable path. Voice mode will stay turn-based and will reuse this
            same interview engine after transcription is added.
          </p>
          {sessionError ? <p className="error-text">{sessionError}</p> : null}
          <textarea
            className="answer-box"
            rows={8}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Answer the current question: ${currentQuestion}`}
          />
          <div className="actions">
            <button
              className="button button-primary"
              onClick={() => void handleSubmit()}
              disabled={answerStatus === 'loading' || session.status === 'completed'}
            >
              {answerStatus === 'loading' ? 'Submitting...' : 'Submit answer'}
            </button>
            <button
              className="button button-secondary"
              onClick={() => void handleEndSession()}
              disabled={endStatus === 'loading'}
            >
              {endStatus === 'loading' ? 'Ending...' : 'End session'}
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
            The UI now flows through an explicit API client. Durable Objects own live
            session state, and D1 stores reports, evaluations, and history records.
          </p>
          <Link className="text-link" to="/history">
            View mock history
          </Link>
        </div>
      </aside>
    </section>
  )
}
