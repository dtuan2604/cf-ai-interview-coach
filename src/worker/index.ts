import { json } from './routes/json'

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

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'cf-ai-interview-coach-api',
        status: 'placeholder',
      })
    }

    return json(
      {
        ok: false,
        error: 'Worker API scaffold not implemented in this step.',
      },
      { status: 404 },
    )
  },
}
