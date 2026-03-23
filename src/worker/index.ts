import { handleCorsPreflight, withCors } from './routes/cors'
import { handleEndSession } from './routes/endSession'
import { handleHealth } from './routes/health'
import { json } from './routes/json'
import { handleStartSession } from './routes/startSession'
import { handleSubmitAnswer } from './routes/submitAnswer'

export type WorkerEnv = {
  AI_INTERVIEW_MODEL?: string
  AI_EVALUATION_MODEL?: string
  AI_REPORT_MODEL?: string
  AI_TRANSCRIPTION_MODEL?: string
  SESSION_SUMMARY_MAX_TOKENS?: string
  REPORT_MAX_TOKENS?: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const answerMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/answer$/)
    const endMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/end$/)

    if (request.method === 'OPTIONS') {
      return handleCorsPreflight()
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return withCors(handleHealth())
    }

    if (request.method === 'POST' && url.pathname === '/api/sessions/start') {
      return withCors(await handleStartSession(request))
    }

    if (request.method === 'POST' && answerMatch?.[1]) {
      return withCors(await handleSubmitAnswer(request, answerMatch[1]))
    }

    if (request.method === 'POST' && endMatch?.[1]) {
      return withCors(await handleEndSession(endMatch[1]))
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
