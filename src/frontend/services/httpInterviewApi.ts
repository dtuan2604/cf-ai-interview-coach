import type {
  EndSessionRequest,
  EndSessionResponse,
  GetHistoryResponse,
  GetSessionResponse,
  GetReportResponse,
  HealthResponse,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitVoiceTurnRequest,
  SubmitVoiceTurnResponse,
} from '../../shared/types'
import { buildApiUrl } from './api'

async function postJson<TResponse>(path: string, body: object): Promise<TResponse> {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as TResponse
}

export const httpInterviewApi = {
  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(buildApiUrl('/api/health'))
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as HealthResponse
  },
  async getHistory(): Promise<GetHistoryResponse> {
    const response = await fetch(buildApiUrl('/api/history'))
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as GetHistoryResponse
  },
  async getReport(sessionId: string): Promise<GetReportResponse> {
    const response = await fetch(buildApiUrl(`/api/reports/${sessionId}`))
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as GetReportResponse
  },
  async getSession(sessionId: string): Promise<GetSessionResponse> {
    const response = await fetch(buildApiUrl(`/api/sessions/${sessionId}`))
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as GetSessionResponse
  },
  startSession(payload: StartSessionRequest) {
    return postJson<StartSessionResponse>('/api/sessions/start', payload)
  },
  submitAnswer(payload: SubmitAnswerRequest) {
    return postJson<SubmitAnswerResponse>(
      `/api/sessions/${payload.sessionId}/answer`,
      payload,
    )
  },
  submitVoiceTurn(payload: SubmitVoiceTurnRequest) {
    return postJson<SubmitVoiceTurnResponse>(
      `/api/sessions/${payload.sessionId}/voice-turn`,
      payload,
    )
  },
  endSession(payload: EndSessionRequest) {
    return postJson<EndSessionResponse>(`/api/sessions/${payload.sessionId}/end`, payload)
  },
}
