import { buildMockHistoryEntry } from '../../shared/mockSession'
import type {
  HistorySessionSummary,
  InterviewReport,
  InterviewSessionState,
} from '../../shared/types'

type BindValue = string | number | null

type D1PreparedStatementLike = {
  bind(...values: BindValue[]): D1PreparedStatementLike
  first<T>(column?: string): Promise<T | null>
  run(): Promise<unknown>
  all<T>(): Promise<{ results: T[] }>
}

export type D1DatabaseLike = {
  prepare(query: string): D1PreparedStatementLike
}

type SessionRow = {
  id: string
  role: string
  interview_type: string
  difficulty: string
  mode: string
  status: string
  overall_score: number | null
  latest_summary: string | null
  ended_at: string | null
  updated_at: string
}

type ReportRow = {
  session_id: string
  role: string
  interview_type: string
  overall_score: number | null
  summary: string
  readiness_assessment: string
  strengths_json: string
  growth_areas_json: string
  next_steps_json: string
  standout_moments_json: string
  created_at: string
  updated_at: string
}

type FeedbackRow = {
  session_id: string
  question_index: number
  question_text: string
  answer_text: string
  score: number | null
  strengths_json: string
  improvements_json: string
  summary: string
  created_at: string
}

type SessionSnapshotRow = {
  id: string
  role: string
  interview_type: string
  difficulty: string
  mode: string
  status: string
  question_count: number
  current_question_index: number
  overall_score: number | null
  latest_summary: string | null
  started_at: string
  ended_at: string | null
  created_at: string
  updated_at: string
}

export type PersistedFeedbackRecord = {
  sessionId: string
  questionIndex: number
  questionText: string
  answerText: string
  score: number
  strengths: string[]
  improvements: string[]
  summary: string
  createdAt: string
}

export type PersistedSessionSnapshot = {
  id: string
  role: string
  interviewType: string
  difficulty: string
  mode: string
  status: string
  questionCount: number
  currentQuestionIndex: number
  overallScore: number
  latestSummary: string | null
  startedAt: string
  endedAt: string | null
  createdAt: string
  updatedAt: string
}

function getLastAnswerMetadata(session: InterviewSessionState) {
  const userTurns = session.transcript.filter((turn) => turn.speaker === 'user')
  const lastUserTurn = userTurns.at(-1)
  if (!lastUserTurn) {
    return null
  }

  const transcriptIndex = session.transcript.findLastIndex((turn) => turn.id === lastUserTurn.id)
  const questionTurn = [...session.transcript.slice(0, transcriptIndex)]
    .reverse()
    .find((turn) => turn.speaker === 'assistant')

  if (!questionTurn) {
    return null
  }

  return {
    id: `${session.id}:${userTurns.length - 1}`,
    questionIndex: userTurns.length - 1,
    questionText: questionTurn.text,
    answerText: lastUserTurn.text,
    createdAt: lastUserTurn.createdAt,
  }
}

export async function upsertSession(db: D1DatabaseLike, session: InterviewSessionState) {
  const existingStartedAt =
    (await db.prepare('SELECT started_at FROM interview_sessions WHERE id = ?')
      .bind(session.id)
      .first<string>('started_at')) ?? session.transcript[0]?.createdAt ?? new Date().toISOString()

  const updatedAt = new Date().toISOString()
  const endedAt = session.status === 'completed' ? updatedAt : null

  await db.prepare(
    `INSERT OR REPLACE INTO interview_sessions (
      id, role, interview_type, difficulty, mode, status,
      question_count, current_question_index, overall_score, latest_summary,
      started_at, ended_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    session.id,
    session.role,
    session.interviewType,
    session.difficulty,
    session.mode,
    session.status,
    session.totalQuestions,
    session.questionIndex,
    session.latestEvaluation?.score ?? null,
    session.latestEvaluation?.summary ?? null,
    existingStartedAt,
    endedAt,
    existingStartedAt,
    updatedAt,
  ).run()
}

export async function upsertLatestEvaluation(db: D1DatabaseLike, session: InterviewSessionState) {
  if (!session.latestEvaluation) {
    return
  }

  const metadata = getLastAnswerMetadata(session)
  if (!metadata) {
    return
  }

  await db.prepare(
    `INSERT OR REPLACE INTO interview_feedback (
      id, session_id, question_index, question_text, answer_text,
      score, strengths_json, improvements_json, summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    metadata.id,
    session.id,
    metadata.questionIndex,
    metadata.questionText,
    metadata.answerText,
    session.latestEvaluation.score,
    JSON.stringify(session.latestEvaluation.strengths),
    JSON.stringify(session.latestEvaluation.improvements),
    session.latestEvaluation.summary,
    metadata.createdAt,
  ).run()
}

export async function upsertReport(db: D1DatabaseLike, report: InterviewReport) {
  await db.prepare(
    `INSERT OR REPLACE INTO interview_reports (
      session_id, role, interview_type, overall_score, summary,
      readiness_assessment, strengths_json, growth_areas_json, next_steps_json,
      standout_moments_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    report.sessionId,
    report.role,
    report.interviewType,
    report.overallScore,
    report.summary,
    report.readinessAssessment,
    JSON.stringify(report.strengths),
    JSON.stringify(report.growthAreas),
    JSON.stringify(report.nextSteps),
    JSON.stringify(report.standoutMoments),
    report.createdAt,
    report.updatedAt,
  ).run()
}

export async function listHistory(db: D1DatabaseLike): Promise<HistorySessionSummary[]> {
  const rows = await db.prepare(
    `SELECT id, role, interview_type, difficulty, mode, status, overall_score,
            latest_summary, ended_at, updated_at
     FROM interview_sessions
     ORDER BY COALESCE(ended_at, updated_at) DESC`,
  ).all<SessionRow>()

  return rows.results.map((row) => ({
    id: row.id,
    role: row.role,
    interviewType: row.interview_type,
    difficulty: row.difficulty,
    mode: row.mode === 'voice' ? 'Voice' : 'Text',
    status: 'completed',
    score: row.overall_score ?? 0,
    completedAt: row.ended_at ?? row.updated_at,
    summary: row.latest_summary ?? 'Session completed without a final summary.',
  }))
}

export async function getReport(
  db: D1DatabaseLike,
  sessionId: string,
): Promise<InterviewReport | null> {
  const row = await db.prepare(
    `SELECT session_id, role, interview_type, overall_score, summary,
            readiness_assessment, strengths_json, growth_areas_json, next_steps_json,
            standout_moments_json, created_at, updated_at
     FROM interview_reports
     WHERE session_id = ?`,
  ).bind(sessionId).first<ReportRow>()

  if (!row) {
    return null
  }

  return {
    sessionId: row.session_id,
    role: row.role,
    interviewType: row.interview_type,
    overallScore: row.overall_score ?? 0,
    summary: row.summary,
    readinessAssessment: row.readiness_assessment,
    strengths: JSON.parse(row.strengths_json) as string[],
    growthAreas: JSON.parse(row.growth_areas_json) as string[],
    nextSteps: JSON.parse(row.next_steps_json) as string[],
    standoutMoments: JSON.parse(row.standout_moments_json) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getSessionSnapshot(
  db: D1DatabaseLike,
  sessionId: string,
): Promise<PersistedSessionSnapshot | null> {
  const row = await db.prepare(
    `SELECT id, role, interview_type, difficulty, mode, status, question_count,
            current_question_index, overall_score, latest_summary, started_at,
            ended_at, created_at, updated_at
     FROM interview_sessions
     WHERE id = ?`,
  ).bind(sessionId).first<SessionSnapshotRow>()

  if (!row) {
    return null
  }

  return {
    id: row.id,
    role: row.role,
    interviewType: row.interview_type,
    difficulty: row.difficulty,
    mode: row.mode,
    status: row.status,
    questionCount: row.question_count,
    currentQuestionIndex: row.current_question_index,
    overallScore: row.overall_score ?? 0,
    latestSummary: row.latest_summary,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listFeedbackForSession(
  db: D1DatabaseLike,
  sessionId: string,
): Promise<PersistedFeedbackRecord[]> {
  const rows = await db.prepare(
    `SELECT session_id, question_index, question_text, answer_text, score,
            strengths_json, improvements_json, summary, created_at
     FROM interview_feedback
     WHERE session_id = ?
     ORDER BY question_index ASC`,
  ).bind(sessionId).all<FeedbackRow>()

  return rows.results.map((row) => ({
    sessionId: row.session_id,
    questionIndex: row.question_index,
    questionText: row.question_text,
    answerText: row.answer_text,
    score: row.score ?? 0,
    strengths: JSON.parse(row.strengths_json) as string[],
    improvements: JSON.parse(row.improvements_json) as string[],
    summary: row.summary,
    createdAt: row.created_at,
  }))
}

export function buildHistoryFallback(session: InterviewSessionState) {
  return buildMockHistoryEntry(session)
}
