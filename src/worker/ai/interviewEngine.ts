import {
  applyMockAnswer,
  createMockSession,
} from '../../shared/mockSession'
import type {
  EvaluationSnapshot,
  InterviewSessionState,
  InterviewSetupInput,
  SubmitAnswerRequest,
  TranscriptTurn,
} from '../../shared/types'
import type { WorkerEnv } from '../index'
import { parseJsonObject, runTextModel } from './client'
import { buildEvaluationPrompt, buildQuestionPrompt } from './prompts'
import { getAiRuntimeMode } from './runtime'

function createTurn(
  speaker: TranscriptTurn['speaker'],
  text: string,
  createdAt = new Date().toISOString(),
): TranscriptTurn {
  return {
    id: crypto.randomUUID(),
    speaker,
    text,
    createdAt,
  }
}

function normalizeStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

async function generateQuestionWithAi(
  env: WorkerEnv,
  config: InterviewSetupInput,
  session: InterviewSessionState | null,
) {
  const model = env.AI_INTERVIEW_MODEL
  if (!model) {
    throw new Error('AI_INTERVIEW_MODEL is not configured.')
  }

  const response = await runTextModel(env, model, buildQuestionPrompt(config, session))
  const parsed = parseJsonObject<{ question: string }>(response)
  const question = typeof parsed.question === 'string' ? parsed.question.trim() : ''
  if (!question) {
    throw new Error('Workers AI returned an empty interview question.')
  }

  return question
}

async function evaluateAnswerWithAi(
  env: WorkerEnv,
  session: InterviewSessionState,
  answer: string,
) {
  const model = env.AI_EVALUATION_MODEL || env.AI_INTERVIEW_MODEL
  if (!model) {
    throw new Error('AI_EVALUATION_MODEL or AI_INTERVIEW_MODEL must be configured.')
  }

  const response = await runTextModel(env, model, buildEvaluationPrompt(session, answer))
  const parsed = parseJsonObject<EvaluationSnapshot>(response)
  const score = typeof parsed.score === 'number' ? parsed.score : Number(parsed.score ?? 0)
  const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
    ? parsed.summary.trim()
    : 'The answer covered the basics, but it needs stronger specificity and clearer impact.'

  return {
    score: Number.isFinite(score) ? score : 0,
    strengths: normalizeStringList(parsed.strengths, ['Clear communication']).slice(0, 3),
    improvements: normalizeStringList(
      parsed.improvements,
      ['Add more specifics and measurable outcomes'],
    ).slice(0, 3),
    summary,
  } satisfies EvaluationSnapshot
}

export async function startInterviewSession(
  env: WorkerEnv,
  payload: InterviewSetupInput & { sessionId: string },
): Promise<InterviewSessionState> {
  if (getAiRuntimeMode(env) !== 'workers') {
    return createMockSession(payload, payload.sessionId)
  }

  const firstQuestion = await generateQuestionWithAi(env, payload, null)

  return {
    id: payload.sessionId,
    role: payload.role,
    interviewType: payload.interviewType,
    difficulty: payload.difficulty,
    mode: payload.mode,
    status: 'in_progress',
    questionIndex: 0,
    totalQuestions: 3,
    questions: [firstQuestion],
    transcript: [createTurn('assistant', firstQuestion)],
    latestEvaluation: null,
  }
}

export async function advanceInterviewSession(
  env: WorkerEnv,
  session: InterviewSessionState,
  payload: SubmitAnswerRequest,
): Promise<InterviewSessionState> {
  if (getAiRuntimeMode(env) !== 'workers') {
    return applyMockAnswer(session, payload.answer)
  }

  if (session.status !== 'in_progress' || !payload.answer.trim()) {
    return session
  }

  const evaluation = await evaluateAnswerWithAi(env, session, payload.answer)
  const transcript = [
    ...session.transcript,
    createTurn('user', payload.answer),
    createTurn('coach', `Coaching note: ${evaluation.summary}`),
  ]

  const nextQuestionIndex = session.questionIndex + 1
  if (nextQuestionIndex >= session.totalQuestions) {
    return {
      ...session,
      status: 'completed',
      transcript,
      latestEvaluation: evaluation,
    }
  }

  const nextSessionContext: InterviewSessionState = {
    ...session,
    questionIndex: nextQuestionIndex,
    transcript,
    latestEvaluation: evaluation,
  }

  const nextQuestion = await generateQuestionWithAi(
    env,
    {
      role: session.role,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      mode: session.mode,
    },
    nextSessionContext,
  )

  return {
    ...nextSessionContext,
    questions: [...session.questions, nextQuestion],
    transcript: [...transcript, createTurn('assistant', nextQuestion)],
  }
}
