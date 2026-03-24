import test from 'node:test'
import assert from 'node:assert/strict'
import { buildQuestionPrompt, buildReportPrompt } from '../src/worker/ai/prompts.ts'
import type {
  PersistedFeedbackRecord,
  PersistedSessionSnapshot,
} from '../src/worker/db/interviewRepository.ts'

test('question prompt includes the selected interview configuration', () => {
  const prompt = buildQuestionPrompt(
    {
      role: 'Product Manager',
      interviewType: 'Behavioral',
      difficulty: 'Mid',
      mode: 'voice',
    },
    null,
  )

  assert.match(prompt, /Role: Product Manager/)
  assert.match(prompt, /Interview type: Behavioral/)
  assert.match(prompt, /Mode: voice/)
  assert.match(prompt, /"question":"string"/)
})

test('report prompt includes persisted feedback records', () => {
  const session: PersistedSessionSnapshot = {
    id: 'session-report',
    role: 'Backend Engineer',
    interviewType: 'Technical',
    difficulty: 'Senior',
    mode: 'text',
    status: 'completed',
    questionCount: 3,
    currentQuestionIndex: 2,
    overallScore: 8.5,
    latestSummary: 'Good depth overall.',
    startedAt: '2026-03-24T00:00:00.000Z',
    endedAt: '2026-03-24T00:10:00.000Z',
    createdAt: '2026-03-24T00:00:00.000Z',
    updatedAt: '2026-03-24T00:10:00.000Z',
  }

  const feedback: PersistedFeedbackRecord[] = [
    {
      sessionId: session.id,
      questionIndex: 0,
      questionText: 'How would you design a durable job system?',
      answerText: 'I would separate queueing, execution, and retry ownership.',
      score: 8,
      strengths: ['Clear structure'],
      improvements: ['Add failure examples'],
      summary: 'Strong foundation with room for deeper edge-case handling.',
      createdAt: '2026-03-24T00:02:00.000Z',
    },
  ]

  const prompt = buildReportPrompt(session, feedback)

  assert.match(prompt, /Question 1: How would you design a durable job system\?/)
  assert.match(prompt, /Strong foundation with room for deeper edge-case handling\./)
  assert.match(prompt, /"standoutMoments":\["string"\]/)
})
