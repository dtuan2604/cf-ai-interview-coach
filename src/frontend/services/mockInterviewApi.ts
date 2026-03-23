import {
  applyMockAnswer,
  completeMockSession,
  createMockSession,
} from '../../shared/mockSession'
import type {
  EndSessionRequest,
  EndSessionResponse,
  HealthResponse,
  InterviewSessionState,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '../../shared/types'

const sessions = new Map<string, InterviewSessionState>()

function getSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) {
    throw new Error(`Session ${sessionId} was not found in the mock transport.`)
  }

  return session
}

export const mockInterviewApi = {
  async getHealth(): Promise<HealthResponse> {
    return {
      ok: true,
      service: 'cf-ai-interview-coach-frontend-mock',
      status: 'ok',
      transport: 'mock',
    }
  },
  async startSession(payload: StartSessionRequest): Promise<StartSessionResponse> {
    const session = createMockSession(payload)
    sessions.set(session.id, session)

    return {
      session,
      transport: 'mock',
    }
  },
  async submitAnswer(payload: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const session = applyMockAnswer(getSession(payload.sessionId), payload.answer)
    sessions.set(session.id, session)

    return {
      session,
      transport: 'mock',
    }
  },
  async endSession(payload: EndSessionRequest): Promise<EndSessionResponse> {
    const result = completeMockSession(getSession(payload.sessionId))
    sessions.set(result.session.id, result.session)

    return {
      ...result,
      transport: 'mock',
    }
  },
}
