import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { difficultyOptions, interviewTypeOptions, roleOptions } from '../services/mockInterview'
import { startMockSession } from '../slices/sessionSlice'
import { resetSetup, setDifficulty, setInterviewType, setMode, setRole } from '../slices/setupSlice'
import { store } from '../store'

export function SetupPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const setup = useAppSelector((state) => state.setup)

  const handleStart = () => {
    dispatch(
      startMockSession({
        role: setup.role,
        interviewType: setup.interviewType,
        difficulty: setup.difficulty,
        mode: setup.mode,
      }),
    )
    const sessionId = store.getState().session.current?.id
    if (sessionId) {
      navigate(`/interview/${sessionId}`)
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

        <button className="button button-primary" onClick={handleStart}>
          Launch mock session
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
          Next steps will swap this local session bootstrap for a Worker API that creates a real
          interview session and binds it to one Durable Object per session.
        </p>
      </aside>
    </section>
  )
}
