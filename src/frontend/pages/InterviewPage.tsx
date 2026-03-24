import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useVoiceConversation } from '../hooks/useVoiceConversation'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { buildApiUrl } from '../services/api'
import {
  endInterviewSession,
  loadInterviewSession,
  submitInterviewAnswer,
  submitInterviewVoiceTurn,
} from '../slices/sessionSlice'

export function InterviewPage() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const session = useAppSelector((state) => state.session.current)
  const loadStatus = useAppSelector((state) => state.session.loadStatus)
  const answerStatus = useAppSelector((state) => state.session.answerStatus)
  const voiceStatus = useAppSelector((state) => state.session.voiceStatus)
  const endStatus = useAppSelector((state) => state.session.endStatus)
  const sessionError = useAppSelector((state) => state.session.error)
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
  const finalizingSessionRef = useRef<string | null>(null)
  const currentPathRef = useRef('')
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const showLeaveDialog = pendingNavigation !== null

  const finalizeSession = useCallback(async (
    nextAction: 'report' | 'leave',
    onLeave?: () => void,
  ) => {
    if (!session || finalizingSessionRef.current === session.id) {
      return false
    }

    finalizingSessionRef.current = session.id
    stopConversation()

    const result = await dispatch(
      endInterviewSession({
        sessionId: session.id,
      }),
    )

    if (endInterviewSession.fulfilled.match(result)) {
      if (nextAction === 'report') {
        navigate(`/reports/${result.payload.session.id}`)
      } else {
        onLeave?.()
      }

      return true
    }

    finalizingSessionRef.current = null
    return false
  }, [dispatch, navigate, session, stopConversation])

  useEffect(() => {
    if (sessionId && (!session || session.id !== sessionId)) {
      void dispatch(loadInterviewSession(sessionId))
    }
  }, [dispatch, session, sessionId])

  useEffect(() => {
    currentPathRef.current = `${location.pathname}${location.search}${location.hash}`
  }, [location])

  useEffect(() => {
    if (!session) {
      return
    }

    if (lastSessionIdRef.current !== session.id) {
      lastSessionIdRef.current = session.id
      lastSpokenResponseRef.current = ''
      finalizingSessionRef.current = null
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
    void speakText(latestAiResponse.spokenText, () => {
      if (session.status === 'in_progress') {
        startListening()
        return
      }

      void finalizeSession('report')
    })
  }, [
    endStatus,
    finalizeSession,
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

    if (finalizingSessionRef.current === session.id) {
      return
    }

    if (session.mode === 'voice' && latestAiResponse.signature) {
      if (isSpeaking || lastSpokenResponseRef.current !== latestAiResponse.signature) {
        return
      }
    }

    void finalizeSession('report')
  }, [endStatus, finalizeSession, isSpeaking, latestAiResponse, session])

  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const handlePageHide = () => {
      if (finalizingSessionRef.current === session.id) {
        return
      }

      const url = buildApiUrl(`/api/sessions/${session.id}/end`)
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(url)
        return
      }

      void fetch(url, {
        method: 'POST',
        keepalive: true,
      })
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) {
        return
      }

      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      if (anchor.target && anchor.target !== '_self') {
        return
      }

      const destination = new URL(anchor.href, window.location.origin)
      if (destination.origin !== window.location.origin) {
        return
      }

      const nextPath = `${destination.pathname}${destination.search}${destination.hash}`
      if (nextPath === currentPathRef.current) {
        return
      }

      event.preventDefault()
      setPendingNavigation(nextPath)
    }

    const handlePopState = () => {
      if (finalizingSessionRef.current === session.id) {
        return
      }

      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (nextPath === currentPathRef.current) {
        return
      }

      window.history.pushState(null, '', currentPathRef.current)
      setPendingNavigation(nextPath)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('popstate', handlePopState)
    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleDocumentClick, true)
    }
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
          Restoring your session and recent progress.
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
          {sessionError ?? 'This session may have expired or is no longer available.'}
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
    await finalizeSession('report')
  }

  const handleConfirmLeave = async () => {
    const nextPath = pendingNavigation
    const didLeave = await finalizeSession('leave', () => {
      setPendingNavigation(null)
      if (nextPath) {
        navigate(nextPath)
      }
    })

    if (!didLeave) {
      setPendingNavigation(null)
    }
  }

  const handleStayInSession = () => {
    setPendingNavigation(null)
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
            Text mode remains the stable path. Voice mode now runs as a browser-based spoken
            conversation with one clear turn at a time.
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
                          ? 'Submitting your answer and preparing the next response.'
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
            Use this panel to track how your last answer landed and what to improve on the next one.
          </p>
          <div className="metric-card">
            <span className="subtle">Latest score</span>
            <strong>{session.latestEvaluation?.score?.toFixed(1) ?? 'Pending'}</strong>
          </div>
          <div>
            <p className="subtle">Current focus</p>
            <p>
              {session.latestEvaluation?.summary ??
                'Waiting for the first answer. Once you respond, coaching guidance will show up here.'}
            </p>
          </div>
        </div>

        <div className="panel stack-sm">
          <h3>Session tips</h3>
          <p className="subtle">
            Aim for clear structure, concrete examples, and direct outcomes. Shorter answers can
            still work if they stay specific.
          </p>
          <Link className="text-link" to="/history">
            View saved sessions
          </Link>
        </div>
      </aside>

      {showLeaveDialog ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card panel stack-md" role="dialog" aria-modal="true">
            <div className="stack-sm">
              <p className="eyebrow">Leave interview</p>
              <h3>End this unfinished session?</h3>
              <p className="subtle">
                If you leave now, the current interview will be ended and you will not return to
                this live session.
              </p>
            </div>
            <div className="actions">
              <button className="button button-secondary" onClick={handleStayInSession}>
                Stay here
              </button>
              <button
                className="button button-primary"
                onClick={() => void handleConfirmLeave()}
                disabled={endStatus === 'loading'}
              >
                {endStatus === 'loading' ? 'Ending...' : 'Leave interview'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
