import type {
  EndSessionRequest,
  EndSessionResponse,
  HealthResponse,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
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
  startSession(payload: StartSessionRequest) {
    return postJson<StartSessionResponse>('/api/sessions/start', payload)
  },
  submitAnswer(payload: SubmitAnswerRequest) {
    return postJson<SubmitAnswerResponse>(
      `/api/sessions/${payload.sessionId}/answer`,
      payload,
    )
  },
  endSession(payload: EndSessionRequest) {
    return postJson<EndSessionResponse>(`/api/sessions/${payload.sessionId}/end`, payload)
  },
}
