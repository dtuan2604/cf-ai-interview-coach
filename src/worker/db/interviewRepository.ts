import { buildMockHistoryEntry, buildMockReport } from '../../shared/mockSession'
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
  created_at: string
  updated_at: string
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

export async function upsertReport(db: D1DatabaseLike, session: InterviewSessionState) {
  const report = buildMockReport(session)

  await db.prepare(
    `INSERT OR REPLACE INTO interview_reports (
      session_id, role, interview_type, overall_score, summary,
      readiness_assessment, strengths_json, growth_areas_json, next_steps_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            created_at, updated_at
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function buildHistoryFallback(session: InterviewSessionState) {
  return buildMockHistoryEntry(session)
}
