import {
  applyMockAnswer,
  completeMockSession,
  createMockSession,
} from '../../shared/mockSession'
import type {
  EndSessionRequest,
  EndSessionResponse,
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
    throw new Error(`Session ${sessionId} was not found in the Worker mock service.`)
  }

  return session
}

export async function startSession(payload: StartSessionRequest): Promise<StartSessionResponse> {
  const session = createMockSession(payload)
  sessions.set(session.id, session)

  return {
    session,
    transport: 'worker',
  }
}

export async function submitAnswer(
  payload: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const session = applyMockAnswer(getSession(payload.sessionId), payload.answer)
  sessions.set(session.id, session)

  return {
    session,
    transport: 'worker',
  }
}

export async function endSession(payload: EndSessionRequest): Promise<EndSessionResponse> {
  const result = completeMockSession(getSession(payload.sessionId))
  sessions.set(result.session.id, result.session)

  return {
    ...result,
    transport: 'worker',
  }
}
