import test from 'node:test'
import assert from 'node:assert/strict'
import { applyMockAnswer, createMockSession } from '../src/shared/mockSession.ts'

test('applyMockAnswer advances the interview and appends coach and assistant turns', () => {
  const session = createMockSession({
    role: 'Frontend Engineer',
    interviewType: 'Technical',
    difficulty: 'Mid',
    mode: 'text',
  }, 'session-test')

  const updated = applyMockAnswer(
    session,
    'I would start with production metrics, then profile the React tree and compare the change against the previous release.',
  )

  assert.equal(updated.questionIndex, 1)
  assert.equal(updated.status, 'in_progress')
  assert.equal(updated.transcript.at(-2)?.speaker, 'coach')
  assert.equal(updated.transcript.at(-1)?.speaker, 'assistant')
  assert.ok(updated.latestEvaluation)
})

test('applyMockAnswer completes the session on the final answer', () => {
  const session = createMockSession({
    role: 'Frontend Engineer',
    interviewType: 'Technical',
    difficulty: 'Mid',
    mode: 'text',
  }, 'session-complete')

  const afterFirst = applyMockAnswer(session, 'Answer one with enough detail to move forward.')
  const afterSecond = applyMockAnswer(afterFirst, 'Answer two with enough detail to move forward.')
  const completed = applyMockAnswer(afterSecond, 'Final answer that should complete the interview.')

  assert.equal(completed.status, 'completed')
  assert.ok(completed.latestEvaluation)
  assert.equal(completed.transcript.at(-1)?.speaker, 'coach')
})
