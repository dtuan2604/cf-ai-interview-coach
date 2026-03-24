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
import { buildEvaluationPrompt, buildQuestionPrompt } from './prompts'
import { getAiRuntimeMode } from './runtime'

type AiTextResponse =
  | string
  | {
      response?: string
      text?: string
      result?: { response?: string; text?: string }
    }

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

function extractResponseText(response: AiTextResponse): string {
  if (typeof response === 'string') {
    return response
  }

  if (response.response) {
    return response.response
  }

  if (response.text) {
    return response.text
  }

  if (response.result?.response) {
    return response.result.response
  }

  if (response.result?.text) {
    return response.result.text
  }

  throw new Error('Workers AI returned an unsupported response shape.')
}

function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T
    }

    throw new Error('Workers AI did not return valid JSON.')
  }
}

async function runTextModel(
  env: WorkerEnv,
  model: string,
  prompt: string,
) {
  if (!env.AI) {
    throw new Error('Workers AI binding is not configured.')
  }

  const response = await env.AI.run(model, {
    prompt,
  })

  return extractResponseText(response as AiTextResponse)
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
  return parsed.question.trim()
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

  return {
    score: Number(parsed.score),
    strengths: parsed.strengths.slice(0, 3),
    improvements: parsed.improvements.slice(0, 3),
    summary: parsed.summary,
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
