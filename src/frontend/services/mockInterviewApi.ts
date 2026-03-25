import {
  applyMockAnswer,
  buildMockHistoryEntry,
  buildMockReport,
  completeMockSession,
  createMockSession,
} from '../../shared/mockSession'
import type {
  DeleteSessionRequest,
  DeleteSessionResponse,
  EndSessionRequest,
  EndSessionResponse,
  GetHistoryResponse,
  GetReportResponse,
  GetSessionResponse,
  HealthResponse,
  InterviewSessionState,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitVoiceTurnRequest,
  SubmitVoiceTurnResponse,
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
  async getHistory(): Promise<GetHistoryResponse> {
    return {
      items: [...sessions.values()]
        .filter((session) => session.status === 'completed')
        .map((session) => buildMockHistoryEntry(session))
        .sort((left, right) => right.completedAt.localeCompare(left.completedAt)),
      transport: 'mock',
    }
  },
  async getReport(sessionId: string): Promise<GetReportResponse> {
    const session = getSession(sessionId)
    return {
      report: buildMockReport(session),
      transport: 'mock',
    }
  },
  async getSession(sessionId: string): Promise<GetSessionResponse> {
    return {
      session: getSession(sessionId),
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
  async submitVoiceTurn(payload: SubmitVoiceTurnRequest): Promise<SubmitVoiceTurnResponse> {
    const acceptedTranscript = payload.transcript.trim()
    const session = applyMockAnswer(getSession(payload.sessionId), acceptedTranscript)
    sessions.set(session.id, session)

    return {
      session,
      acceptedTranscript,
      source: payload.source,
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
  async deleteSession(payload: DeleteSessionRequest): Promise<DeleteSessionResponse> {
    sessions.delete(payload.sessionId)

    return {
      ok: true,
      sessionId: payload.sessionId,
      transport: 'mock',
    }
  },
}
