import { InterviewSessionDurableObject } from './durable/InterviewSessionDurableObject'
import type { D1DatabaseLike } from './db/interviewRepository'
import { handleCorsPreflight, withCors } from './routes/cors'
import { handleEndSession } from './routes/endSession'
import { handleGetHistory } from './routes/getHistory'
import { handleGetReport } from './routes/getReport'
import { handleHealth } from './routes/health'
import { json } from './routes/json'
import { handleGetSession } from './routes/getSession'
import { handleStartSession } from './routes/startSession'
import { handleSubmitAnswer } from './routes/submitAnswer'

type DurableObjectIdLike = object
type DurableObjectStubLike = {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>
}
type DurableObjectNamespaceLike = {
  idFromName(name: string): DurableObjectIdLike
  get(id: DurableObjectIdLike): DurableObjectStubLike
}
type AiBindingLike = {
  run(model: string, payload: unknown): Promise<unknown>
}

export type WorkerEnv = {
  INTERVIEW_SESSIONS: DurableObjectNamespaceLike
  DB: D1DatabaseLike
  AI?: AiBindingLike
  AI_INTERVIEW_MODEL?: string
  AI_EVALUATION_MODEL?: string
  AI_REPORT_MODEL?: string
  AI_TRANSCRIPTION_MODEL?: string
  AI_RUNTIME_MODE?: string
  SESSION_SUMMARY_MAX_TOKENS?: string
  REPORT_MAX_TOKENS?: string
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url)
    const reportMatch = url.pathname.match(/^\/api\/reports\/([^/]+)$/)
    const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/)
    const answerMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/answer$/)
    const endMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/end$/)

    if (request.method === 'OPTIONS') {
      return handleCorsPreflight()
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return withCors(handleHealth(env))
    }

    if (request.method === 'GET' && url.pathname === '/api/history') {
      return withCors(await handleGetHistory(env))
    }

    if (request.method === 'GET' && reportMatch?.[1]) {
      return withCors(await handleGetReport(env, reportMatch[1]))
    }

    if (request.method === 'GET' && sessionMatch?.[1]) {
      return withCors(await handleGetSession(env, sessionMatch[1]))
    }

    if (request.method === 'POST' && url.pathname === '/api/sessions/start') {
      return withCors(await handleStartSession(request, env))
    }

    if (request.method === 'POST' && answerMatch?.[1]) {
      return withCors(await handleSubmitAnswer(request, env, answerMatch[1]))
    }

    if (request.method === 'POST' && endMatch?.[1]) {
      return withCors(await handleEndSession(env, endMatch[1]))
    }

    return withCors(
      json(
        {
          ok: false,
          error: 'Worker API scaffold not implemented in this step.',
        },
        { status: 404 },
      ),
    )
  },
}

export { InterviewSessionDurableObject }
