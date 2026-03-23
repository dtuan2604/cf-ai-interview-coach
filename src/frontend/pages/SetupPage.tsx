import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { difficultyOptions, interviewTypeOptions, roleOptions } from '../services/mockInterview'
import { startInterviewSession } from '../slices/sessionSlice'
import { resetSetup, setDifficulty, setInterviewType, setMode, setRole } from '../slices/setupSlice'

export function SetupPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const setup = useAppSelector((state) => state.setup)
  const startStatus = useAppSelector((state) => state.session.startStatus)
  const sessionError = useAppSelector((state) => state.session.error)

  const handleStart = async () => {
    const result = await dispatch(
      startInterviewSession({
        role: setup.role,
        interviewType: setup.interviewType,
        difficulty: setup.difficulty,
        mode: setup.mode,
      }),
    )

    if (startInterviewSession.fulfilled.match(result)) {
      navigate(`/interview/${result.payload.session.id}`)
    }
  }

  return (
    <section className="setup-layout">
      <div className="panel stack-md">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Interview setup</p>
            <h2>Define the coaching session</h2>
          </div>
          <button className="button button-secondary" onClick={() => dispatch(resetSetup())}>
            Reset
          </button>
        </div>

        <label className="field">
          <span>Role</span>
          <select value={setup.role} onChange={(event) => dispatch(setRole(event.target.value))}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Interview type</span>
          <select
            value={setup.interviewType}
            onChange={(event) => dispatch(setInterviewType(event.target.value))}
          >
            {interviewTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Difficulty</span>
          <select
            value={setup.difficulty}
            onChange={(event) => dispatch(setDifficulty(event.target.value))}
          >
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="field">
          <span>Mode</span>
          <div className="toggle-row">
            <button
              type="button"
              className={setup.mode === 'text' ? 'toggle toggle-active' : 'toggle'}
              onClick={() => dispatch(setMode('text'))}
            >
              Text-first
            </button>
            <button
              type="button"
              className={setup.mode === 'voice' ? 'toggle toggle-active' : 'toggle'}
              onClick={() => dispatch(setMode('voice'))}
            >
              Voice turns
            </button>
          </div>
        </fieldset>

        {sessionError ? <p className="error-text">{sessionError}</p> : null}

        <button
          className="button button-primary"
          onClick={() => void handleStart()}
          disabled={startStatus === 'loading'}
        >
          {startStatus === 'loading' ? 'Starting session...' : 'Launch session'}
        </button>
      </div>

      <aside className="panel stack-sm">
        <p className="eyebrow">Execution note</p>
        <h3>Why this step comes first</h3>
        <p>
          Before wiring Workers, Durable Objects, D1, and Workers AI, the product needs stable
          UI surfaces and clear state boundaries. This step makes the frontend executable while
          leaving integration points explicit.
        </p>
        <p className="subtle">
          The frontend now goes through an API contract boundary. The default transport is still
          mock, and the next backend step will point the same contract at the Worker runtime.
        </p>
      </aside>
    </section>
  )
}
