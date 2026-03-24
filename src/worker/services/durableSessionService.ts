import type {
  EndSessionRequest,
  EndSessionResponse,
  GetSessionResponse,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '../../shared/types'
import { generateFinalReport } from '../ai/reportEngine'
import {
  getSessionSnapshot,
  listFeedbackForSession,
  upsertLatestEvaluation,
  upsertReport,
  upsertSession,
} from '../db/interviewRepository'
import type { WorkerEnv } from '../index'

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T | { error?: string }

  if (!response.ok) {
    const error =
      typeof payload === 'object' && payload && 'error' in payload
        ? payload.error
        : `Durable Object request failed with status ${response.status}`

    throw new Error(error)
  }

  return payload as T
}

function getSessionStub(env: WorkerEnv, sessionId: string) {
  const durableObjectId = env.INTERVIEW_SESSIONS.idFromName(sessionId)
  return env.INTERVIEW_SESSIONS.get(durableObjectId)
}

export async function getSession(
  env: WorkerEnv,
  sessionId: string,
): Promise<GetSessionResponse> {
  return readJson<GetSessionResponse>(
    await getSessionStub(env, sessionId).fetch('https://session.internal/internal/session'),
  )
}

export async function startSession(
  env: WorkerEnv,
  payload: StartSessionRequest,
): Promise<StartSessionResponse> {
  const sessionId = `session-${crypto.randomUUID()}`
  const response = await readJson<StartSessionResponse>(
    await getSessionStub(env, sessionId).fetch('https://session.internal/internal/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        sessionId,
      }),
    }),
  )

  await upsertSession(env.DB, response.session)
  return response
}

export async function submitAnswer(
  env: WorkerEnv,
  payload: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const response = await readJson<SubmitAnswerResponse>(
    await getSessionStub(env, payload.sessionId).fetch(
      'https://session.internal/internal/answer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    ),
  )

  await upsertSession(env.DB, response.session)
  await upsertLatestEvaluation(env.DB, response.session)
  return response
}

export async function endSession(
  env: WorkerEnv,
  payload: EndSessionRequest,
): Promise<EndSessionResponse> {
  const response = await readJson<EndSessionResponse>(
    await getSessionStub(env, payload.sessionId).fetch('https://session.internal/internal/end', {
      method: 'POST',
    }),
  )

  await upsertSession(env.DB, response.session)

  const [sessionSnapshot, feedback] = await Promise.all([
    getSessionSnapshot(env.DB, response.session.id),
    listFeedbackForSession(env.DB, response.session.id),
  ])

  if (!sessionSnapshot) {
    throw new Error(`Session ${response.session.id} was not found in D1 after completion.`)
  }

  const report = await generateFinalReport(env, sessionSnapshot, feedback)
  await upsertReport(env.DB, report)
  return response
}
