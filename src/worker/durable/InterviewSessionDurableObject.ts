import {
  completeMockSession,
} from '../../shared/mockSession'
import type {
  EndSessionResponse,
  GetSessionResponse,
  InterviewSessionState,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '../../shared/types'
import { advanceInterviewSession, startInterviewSession } from '../ai/interviewEngine'
import type { WorkerEnv } from '../index'
import { json } from '../routes/json'

type DurableObjectStorageLike = {
  get<T>(key: string): Promise<T | undefined>
  put<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<boolean>
}

type DurableObjectStateLike = {
  storage: DurableObjectStorageLike
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>
}

type StartPayload = StartSessionRequest & { sessionId: string }

export class InterviewSessionDurableObject {
  readonly state: DurableObjectStateLike
  private readonly env: WorkerEnv
  private readonly initialized: Promise<void>
  private session: InterviewSessionState | null = null

  constructor(state: DurableObjectStateLike, env: WorkerEnv) {
    this.state = state
    this.env = env
    this.initialized = this.state.blockConcurrencyWhile(async () => {
      this.session = (await this.state.storage.get<InterviewSessionState>('session')) ?? null
    })
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialized

    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/internal/session') {
      return this.handleGetSession()
    }

    if (request.method === 'POST' && url.pathname === '/internal/start') {
      return this.handleStart(request)
    }

    if (request.method === 'POST' && url.pathname === '/internal/answer') {
      return this.handleAnswer(request)
    }

    if (request.method === 'POST' && url.pathname === '/internal/end') {
      return this.handleEnd()
    }

    if (request.method === 'POST' && url.pathname === '/internal/delete') {
      return this.handleDelete()
    }

    return json(
      {
        ok: false,
        error: 'Durable Object route not found.',
      },
      { status: 404 },
    )
  }

  private async persistSession(session: InterviewSessionState) {
    this.session = session
    await this.state.storage.put('session', session)
  }

  private handleGetSession() {
    if (!this.session) {
      return json(
        {
          ok: false,
          error: 'Session not found.',
        },
        { status: 404 },
      )
    }

    const response: GetSessionResponse = {
      session: this.session,
      transport: 'worker',
    }

    return json(response)
  }

  private async handleStart(request: Request) {
    const payload = (await request.json()) as StartPayload
    const session = await startInterviewSession(this.env, payload)
    await this.persistSession(session)

    const response: StartSessionResponse = {
      session,
      transport: 'worker',
    }

    return json(response)
  }

  private async handleAnswer(request: Request) {
    if (!this.session) {
      return json(
        {
          ok: false,
          error: 'Session not found.',
        },
        { status: 404 },
      )
    }

    const payload = (await request.json()) as SubmitAnswerRequest
    const session = await advanceInterviewSession(this.env, this.session, payload)
    await this.persistSession(session)

    const response: SubmitAnswerResponse = {
      session,
      transport: 'worker',
    }

    return json(response)
  }

  private async handleEnd() {
    if (!this.session) {
      return json(
        {
          ok: false,
          error: 'Session not found.',
        },
        { status: 404 },
      )
    }

    const response: EndSessionResponse = {
      ...completeMockSession(this.session),
      transport: 'worker',
    }

    await this.persistSession(response.session)
    return json(response)
  }

  private async handleDelete() {
    this.session = null
    await this.state.storage.delete('session')

    return json({
      ok: true,
    })
  }
}
