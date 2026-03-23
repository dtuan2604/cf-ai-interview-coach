import type {
  EndSessionRequest,
  EndSessionResponse,
  HealthResponse,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '../../shared/types'
import { appConfig } from './config'
import { httpInterviewApi } from './httpInterviewApi'
import { mockInterviewApi } from './mockInterviewApi'

export type InterviewApi = {
  getHealth: () => Promise<HealthResponse>
  startSession: (payload: StartSessionRequest) => Promise<StartSessionResponse>
  submitAnswer: (payload: SubmitAnswerRequest) => Promise<SubmitAnswerResponse>
  endSession: (payload: EndSessionRequest) => Promise<EndSessionResponse>
}

export const interviewApi: InterviewApi =
  appConfig.apiTransport === 'worker' ? httpInterviewApi : mockInterviewApi
