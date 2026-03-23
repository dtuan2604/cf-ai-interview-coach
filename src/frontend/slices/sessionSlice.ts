import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { buildMockQuestionPlan } from '../services/mockInterview'
import type {
  EvaluationSnapshot,
  InterviewSessionState,
  TranscriptTurn,
} from '../../shared/types'

type SessionState = {
  current: InterviewSessionState | null
}

const initialState: SessionState = {
  current: null,
}

function buildEvaluation(answer: string, questionIndex: number): EvaluationSnapshot {
  const trimmed = answer.trim()
  const baseScore = Math.min(9, Math.max(5, Math.round(trimmed.length / 30) + 5))

  return {
    score: Number((baseScore + questionIndex * 0.2).toFixed(1)),
    strengths: trimmed.length > 120
      ? ['Concrete detail', 'Clear structure']
      : ['Concise response'],
    improvements: trimmed.length > 80
      ? ['Add measurable outcome']
      : ['Expand with specifics', 'Connect answer to business impact'],
    summary:
      trimmed.length > 80
        ? 'Good signal. Push deeper on outcomes and technical tradeoffs.'
        : 'Response is directionally useful but still too thin for interview depth.',
  }
}

function buildCoachTurn(evaluation: EvaluationSnapshot): TranscriptTurn {
  return {
    id: crypto.randomUUID(),
    speaker: 'coach',
    text: `Coaching note: ${evaluation.summary}`,
    createdAt: new Date().toISOString(),
  }
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startMockSession: (state, action: PayloadAction<{
      role: string
      interviewType: string
      difficulty: string
      mode: 'text' | 'voice'
    }>) => {
      const sessionId = `session-${crypto.randomUUID()}`
      const questions = buildMockQuestionPlan(action.payload.role, action.payload.interviewType)
      state.current = {
        id: sessionId,
        role: action.payload.role,
        interviewType: action.payload.interviewType,
        difficulty: action.payload.difficulty,
        mode: action.payload.mode,
        status: 'in_progress',
        questionIndex: 0,
        totalQuestions: questions.length,
        questions,
        transcript: [
          {
            id: crypto.randomUUID(),
            speaker: 'assistant',
            text: questions[0],
            createdAt: new Date().toISOString(),
          },
        ],
        latestEvaluation: null,
      }
    },
    submitMockAnswer: (state, action: PayloadAction<{ text: string }>) => {
      const session = state.current
      if (!session || session.status !== 'in_progress') {
        return
      }

      const answer = action.payload.text.trim()
      if (!answer) {
        return
      }

      const evaluation = buildEvaluation(answer, session.questionIndex)

      session.transcript.push({
        id: crypto.randomUUID(),
        speaker: 'user',
        text: answer,
        createdAt: new Date().toISOString(),
      })

      session.transcript.push(buildCoachTurn(evaluation))
      session.latestEvaluation = evaluation

      const nextQuestionIndex = session.questionIndex + 1
      if (nextQuestionIndex < session.totalQuestions) {
        session.questionIndex = nextQuestionIndex
        session.transcript.push({
          id: crypto.randomUUID(),
          speaker: 'assistant',
          text: session.questions[nextQuestionIndex],
          createdAt: new Date().toISOString(),
        })
        return
      }

      session.status = 'completed'
    },
    endSession: (state) => {
      if (state.current) {
        state.current.status = 'completed'
      }
    },
  },
})

export const { endSession, startMockSession, submitMockAnswer } = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
