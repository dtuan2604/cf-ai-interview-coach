import type {
  EndSessionRequest,
  EndSessionResponse,
  GetHistoryResponse,
  GetReportResponse,
  GetSessionResponse,
  HealthResponse,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitVoiceTurnRequest,
  SubmitVoiceTurnResponse,
} from '../../shared/types'
import { appConfig } from './config'
import { httpInterviewApi } from './httpInterviewApi'
import { mockInterviewApi } from './mockInterviewApi'

export type InterviewApi = {
  getHealth: () => Promise<HealthResponse>
  getHistory: () => Promise<GetHistoryResponse>
  getReport: (sessionId: string) => Promise<GetReportResponse>
  getSession: (sessionId: string) => Promise<GetSessionResponse>
  startSession: (payload: StartSessionRequest) => Promise<StartSessionResponse>
  submitAnswer: (payload: SubmitAnswerRequest) => Promise<SubmitAnswerResponse>
  submitVoiceTurn: (payload: SubmitVoiceTurnRequest) => Promise<SubmitVoiceTurnResponse>
  endSession: (payload: EndSessionRequest) => Promise<EndSessionResponse>
}

export const interviewApi: InterviewApi =
  appConfig.apiTransport === 'worker' ? httpInterviewApi : mockInterviewApi
