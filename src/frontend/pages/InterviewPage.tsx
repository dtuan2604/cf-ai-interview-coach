import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useVoiceConversation } from '../hooks/useVoiceConversation'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  endInterviewSession,
  loadInterviewSession,
  submitInterviewAnswer,
  submitInterviewVoiceTurn,
} from '../slices/sessionSlice'

export function InterviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const session = useAppSelector((state) => state.session.current)
  const loadStatus = useAppSelector((state) => state.session.loadStatus)
  const answerStatus = useAppSelector((state) => state.session.answerStatus)
  const voiceStatus = useAppSelector((state) => state.session.voiceStatus)
  const endStatus = useAppSelector((state) => state.session.endStatus)
  const sessionError = useAppSelector((state) => state.session.error)
  const transport = useAppSelector((state) => state.session.transport)
  const [draft, setDraft] = useState('')
  const {
    isRecognitionSupported,
    isSpeechSupported,
    silenceMs,
    isConversationActive,
    isListening,
    isSpeaking,
    transcript: voiceTranscript,
    durationMs: voiceDurationMs,
    readyTurn,
    error: voiceError,
    setTranscript: setVoiceTranscript,
    startConversation,
    stopConversation,
    startListening,
    speakText,
    clearTranscript: clearVoiceTranscript,
    clearReadyTurn,
    finalizeManualTurn,
  } = useVoiceConversation()
  const lastSpokenResponseRef = useRef('')
  const lastSessionIdRef = useRef<string | null>(null)
  const autoEndingSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (sessionId && (!session || session.id !== sessionId)) {
      void dispatch(loadInterviewSession(sessionId))
    }
  }, [dispatch, session, sessionId])

  useEffect(() => {
    if (!session) {
      return
    }

    if (lastSessionIdRef.current !== session.id) {
      lastSessionIdRef.current = session.id
      lastSpokenResponseRef.current = ''
      autoEndingSessionRef.current = null
      stopConversation()
      clearVoiceTranscript()
      clearReadyTurn()
    }
  }, [
    clearReadyTurn,
    clearVoiceTranscript,
    session,
    stopConversation,
  ])

  const currentQuestion = useMemo(() => {
    if (!session) {
      return ''
    }

    return session.questions[session.questionIndex] ?? 'Session complete.'
  }, [session])

  const latestAiResponse = useMemo(() => {
    if (!session || session.mode !== 'voice') {
      return { signature: '', spokenText: '' }
    }

    const trailingTurns = []
    for (let index = session.transcript.length - 1; index >= 0; index -= 1) {
      const turn = session.transcript[index]
      if (turn.speaker === 'user') {
        break
      }

      trailingTurns.unshift(turn)
    }

    if (trailingTurns.length === 0) {
      return { signature: '', spokenText: '' }
    }

    return {
      signature: trailingTurns.map((turn) => turn.id).join('|'),
      spokenText: trailingTurns
        .map((turn) =>
          turn.speaker === 'coach' ? turn.text.replace(/^Coaching note:\s*/i, '') : turn.text,
        )
        .join(' '),
    }
  }, [session])

  useEffect(() => {
    if (!session || session.mode !== 'voice') {
      return
    }

    if (!isConversationActive) {
      return
    }

    if (!latestAiResponse.signature) {
      return
    }

    if (lastSpokenResponseRef.current === latestAiResponse.signature) {
      return
    }

    if (voiceStatus === 'loading' || endStatus === 'loading') {
      return
    }

    lastSpokenResponseRef.current = latestAiResponse.signature
    speakText(latestAiResponse.spokenText, () => {
      if (session.status === 'in_progress') {
        startListening()
      }
    })
  }, [
    endStatus,
    isConversationActive,
    latestAiResponse,
    session,
    speakText,
    startListening,
    voiceStatus,
  ])

  useEffect(() => {
    if (!session || session.mode !== 'voice') {
      return
    }

    if (!readyTurn || voiceStatus === 'loading') {
      return
    }

    const pendingTurn = readyTurn
    clearReadyTurn()

    void dispatch(
      submitInterviewVoiceTurn({
        sessionId: session.id,
        transcript: pendingTurn.transcript,
        source: pendingTurn.source,
        durationMs: pendingTurn.durationMs,
      }),
    ).then((result) => {
      if (submitInterviewVoiceTurn.rejected.match(result)) {
        setVoiceTranscript(pendingTurn.transcript)
      } else {
        clearVoiceTranscript()
      }
    })
  }, [clearReadyTurn, clearVoiceTranscript, dispatch, readyTurn, session, setVoiceTranscript, voiceStatus])

  useEffect(() => {
    if (!session || session.status !== 'completed') {
      return
    }

    if (endStatus === 'loading') {
      return
    }

    if (autoEndingSessionRef.current === session.id) {
      return
    }

    autoEndingSessionRef.current = session.id
    stopConversation()

    void dispatch(
      endInterviewSession({
        sessionId: session.id,
      }),
    ).then((result) => {
      if (endInterviewSession.fulfilled.match(result)) {
        navigate(`/reports/${result.payload.session.id}`)
        return
      }

      autoEndingSessionRef.current = null
    })
  }, [dispatch, endStatus, navigate, session, stopConversation])

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

  const handleStartVoiceConversation = () => {
    lastSpokenResponseRef.current = ''
    startConversation()
  }

  const handleStopVoiceConversation = () => {
    stopConversation()
  }

  const handleEndSession = async () => {
    stopConversation()
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
            Text mode remains the stable path. Voice mode now runs as a browser-based spoken
            conversation loop on top of the same Worker session engine.
          </p>
          {sessionError ? <p className="error-text">{sessionError}</p> : null}
          {session.mode === 'voice' ? (
            <div className="stack-md">
              <div className="voice-panel">
                <div className="panel-row">
                  <div className="stack-sm">
                    <h3>Voice conversation</h3>
                    <p className="subtle">
                      The interviewer speaks first, listens for your answer, then responds after
                      roughly {(silenceMs / 1000).toFixed(0)} seconds of silence.
                    </p>
                  </div>
                  <span
                    className={`pill ${isSpeaking || isListening ? 'pill-live' : ''}`}
                  >
                    {isSpeaking
                      ? 'ai speaking'
                      : isListening
                        ? 'listening'
                        : isConversationActive
                          ? 'waiting'
                          : 'paused'}
                  </span>
                </div>
                <div className="actions">
                  <button
                    className="button button-primary"
                    onClick={handleStartVoiceConversation}
                    disabled={isConversationActive || session.status === 'completed'}
                  >
                    Start voice conversation
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={handleStopVoiceConversation}
                    disabled={!isConversationActive}
                  >
                    Pause voice conversation
                  </button>
                </div>
                {!isRecognitionSupported ? (
                  <p className="subtle">
                    Browser speech recognition is not available here. You can still type your
                    response below and send it through the same voice-turn flow.
                  </p>
                ) : null}
                {!isSpeechSupported ? (
                  <p className="subtle">
                    Browser speech playback is not available here, so AI responses will remain on
                    screen only.
                  </p>
                ) : null}
                {voiceError ? <p className="error-text">{voiceError}</p> : null}
                <textarea
                  className="answer-box"
                  rows={8}
                  value={voiceTranscript}
                  onChange={(event) => setVoiceTranscript(event.target.value)}
                  placeholder={`Live transcript for: ${currentQuestion}`}
                />
                <div className="panel-row">
                  <p className="subtle">
                    {isSpeaking
                      ? 'AI is speaking. Listening will resume automatically after playback.'
                      : isListening
                        ? `Listening now. The system waits about ${(silenceMs / 1000).toFixed(0)} seconds after you stop speaking before it responds.`
                        : voiceStatus === 'loading'
                          ? 'Submitting the captured answer to the Worker.'
                          : voiceDurationMs
                            ? `Latest voice turn lasted ${(voiceDurationMs / 1000).toFixed(1)}s.`
                            : 'Start the voice conversation to hear the interviewer and answer out loud.'}
                  </p>
                  <button
                    className="button button-secondary"
                    onClick={finalizeManualTurn}
                    disabled={!voiceTranscript.trim() || voiceStatus === 'loading'}
                  >
                    Respond now
                  </button>
                </div>
              </div>
              <div className="actions">
                <button
                  className="button button-secondary"
                  onClick={clearVoiceTranscript}
                  disabled={isListening || voiceStatus === 'loading'}
                >
                  Clear transcript
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
          ) : (
            <>
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
            </>
          )}
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
