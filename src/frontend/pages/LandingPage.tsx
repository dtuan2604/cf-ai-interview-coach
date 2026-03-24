import { Link } from 'react-router-dom'

const experienceItems = [
  {
    title: 'Realistic practice',
    body: 'Work through focused interview questions that feel structured and role-specific.',
  },
  {
    title: 'Live coaching',
    body: 'Get answer-by-answer feedback that highlights strengths, gaps, and what to sharpen next.',
  },
  {
    title: 'Saved reports',
    body: 'Review completed sessions, track patterns, and return to coaching summaries later.',
  },
]

export function LandingPage() {
  return (
    <section className="stack-xl">
      <div className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Interview simulation</p>
          <h2>Practice interviews with stateful coaching, not a generic chat window.</h2>
          <p className="hero-text">
            Guided interview workflow: configure a role, run a structured
            session, receive answer-by-answer feedback, and finish with a clear report you can
            revisit after the conversation ends.
          </p>
          <div className="actions">
            <Link className="button button-primary" to="/setup">
              Start setup
            </Link>
            <Link className="button button-secondary" to="/history">
              Review history
            </Link>
          </div>
        </div>
        <div className="hero-meta panel">
          <p className="subtle">Session format</p>
          <strong>Guided, one question at a time</strong>
          <p className="subtle">
            Choose text or voice, answer in your own style, and let the coach steer the next step
            based on how the conversation is going.
          </p>
          <p className="subtle">Best for focused practice, not open-ended chatting.</p>
        </div>
      </div>

      <div className="info-grid">
        {experienceItems.map((item) => (
          <article key={item.title} className="panel stack-sm">
            <p className="eyebrow">Experience</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>

      <div className="info-grid">
        <article className="panel stack-sm">
          <p className="eyebrow">MVP focus</p>
          <h3>Stable text mode first</h3>
          <p>
            Text is the most reliable way to rehearse complete answers. Voice adds a more natural
            practice mode when you want to speak your responses aloud.
          </p>
        </article>
        <article className="panel stack-sm">
          <p className="eyebrow">Coaching style</p>
          <h3>Structured, not chatty</h3>
          <p>
            The coach stays in interview mode, keeps the pace moving, and finishes with a report
            instead of drifting into a generic assistant conversation.
          </p>
        </article>
      </div>
    </section>
  )
}
