export type InterviewMode = 'text' | 'voice'

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
