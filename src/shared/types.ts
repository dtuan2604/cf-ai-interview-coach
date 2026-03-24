export type InterviewMode = 'text' | 'voice'
export type ApiTransport = 'mock' | 'worker'

export type TranscriptSpeaker = 'assistant' | 'user' | 'coach'

export type SessionStatus = 'idle' | 'in_progress' | 'completed'

export type TranscriptTurn = {
  id: string
  speaker: TranscriptSpeaker
  text: string
  createdAt: string
}

export type EvaluationSnapshot = {
  score: number
  strengths: string[]
  improvements: string[]
  summary: string
}

export type InterviewSessionState = {
  id: string
  role: string
  interviewType: string
  difficulty: string
  mode: InterviewMode
  status: SessionStatus
  questionIndex: number
  totalQuestions: number
  questions: string[]
  transcript: TranscriptTurn[]
  latestEvaluation: EvaluationSnapshot | null
}

export type HistorySessionSummary = {
  id: string
  role: string
  interviewType: string
  difficulty: string
  mode: 'Text' | 'Voice'
  status: 'completed'
  score: number
  completedAt: string
  summary: string
}

export type InterviewReport = {
  sessionId: string
  role: string
  interviewType: string
  overallScore: number
  summary: string
  readinessAssessment: string
  strengths: string[]
  growthAreas: string[]
  nextSteps: string[]
  standoutMoments: string[]
  createdAt: string
  updatedAt: string
}

export type InterviewSetupInput = {
  role: string
  interviewType: string
  difficulty: string
  mode: InterviewMode
}

export type HealthResponse = {
  ok: boolean
  service: string
  status: 'ok' | 'placeholder'
  transport: ApiTransport | 'worker'
}

export type StartSessionRequest = InterviewSetupInput

export type StartSessionResponse = {
  session: InterviewSessionState
  transport: ApiTransport
}

export type GetSessionResponse = {
  session: InterviewSessionState
  transport: ApiTransport
}

export type SubmitAnswerRequest = {
  sessionId: string
  answer: string
}

export type SubmitAnswerResponse = {
  session: InterviewSessionState
  transport: ApiTransport
}

export type EndSessionRequest = {
  sessionId: string
}

export type EndSessionResponse = {
  session: InterviewSessionState
  historyEntry: HistorySessionSummary
  transport: ApiTransport
}

export type GetHistoryResponse = {
  items: HistorySessionSummary[]
  transport: ApiTransport
}

export type GetReportResponse = {
  report: InterviewReport | null
  transport: ApiTransport
}
