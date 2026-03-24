import type { InterviewReport } from '../../shared/types'
import type {
  PersistedFeedbackRecord,
  PersistedSessionSnapshot,
} from '../db/interviewRepository'
import type { WorkerEnv } from '../index'
import { parseJsonObject, runTextModel } from './client'
import { buildReportPrompt } from './prompts'
import { getAiRuntimeMode } from './runtime'

type ReportPayload = Pick<
  InterviewReport,
  'summary' | 'readinessAssessment' | 'strengths' | 'growthAreas' | 'nextSteps' | 'standoutMoments'
>

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function normalizeStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

function buildFallbackReport(
  session: PersistedSessionSnapshot,
  feedback: PersistedFeedbackRecord[],
): InterviewReport {
  const createdAt = new Date().toISOString()
  const averageScore =
    feedback.length > 0
      ? Number(
          (
            feedback.reduce((total, item) => total + item.score, 0) / feedback.length
          ).toFixed(1),
        )
      : session.overallScore

  const strengths = unique(feedback.flatMap((item) => item.strengths)).slice(0, 4)
  const growthAreas = unique(feedback.flatMap((item) => item.improvements)).slice(0, 4)
  const standoutMoments = feedback
    .filter((item) => item.score >= averageScore)
    .slice(0, 3)
    .map((item) => `Question ${item.questionIndex + 1}: ${item.summary}`)

  return {
    sessionId: session.id,
    role: session.role,
    interviewType: session.interviewType,
    overallScore: averageScore,
    summary:
      session.latestSummary ??
      'This session established a useful baseline, but the candidate should improve precision and impact framing.',
    readinessAssessment:
      averageScore >= 8
        ? 'Strong baseline with room to sharpen depth and impact framing.'
        : averageScore >= 6
          ? 'Solid baseline, but the next gains come from clearer examples and stronger specificity.'
          : 'Early baseline. The candidate needs more structure, depth, and evidence in each answer.',
    strengths: strengths.length > 0 ? strengths : ['Clear communication'],
    growthAreas:
      growthAreas.length > 0
        ? growthAreas
        : ['Add more specifics', 'Tie examples to outcomes'],
    nextSteps: [
      'Practice answers with a tighter problem-action-result structure.',
      'Add concrete metrics or business outcomes to each story.',
      'Prepare one deeper follow-up example for each core interview theme.',
    ],
    standoutMoments:
      standoutMoments.length > 0
        ? standoutMoments
        : ['The session established a workable baseline for further practice.'],
    createdAt,
    updatedAt: createdAt,
  }
}

async function generateReportWithAi(
  env: WorkerEnv,
  session: PersistedSessionSnapshot,
  feedback: PersistedFeedbackRecord[],
): Promise<InterviewReport> {
  const model =
    env.AI_REPORT_MODEL || env.AI_EVALUATION_MODEL || env.AI_INTERVIEW_MODEL

  if (!model) {
    throw new Error('AI_REPORT_MODEL, AI_EVALUATION_MODEL, or AI_INTERVIEW_MODEL must be configured.')
  }

  const response = await runTextModel(env, model, buildReportPrompt(session, feedback))
  const parsed = parseJsonObject<ReportPayload>(response)
  const createdAt = new Date().toISOString()

  return {
    sessionId: session.id,
    role: session.role,
    interviewType: session.interviewType,
    overallScore: session.overallScore,
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'This session showed useful baseline signal, but the candidate needs sharper specifics and stronger impact framing.',
    readinessAssessment:
      typeof parsed.readinessAssessment === 'string' && parsed.readinessAssessment.trim()
        ? parsed.readinessAssessment.trim()
        : 'Solid early baseline with room to strengthen precision, evidence, and delivery.',
    strengths: normalizeStringList(parsed.strengths, ['Clear communication']).slice(0, 4),
    growthAreas: normalizeStringList(
      parsed.growthAreas,
      ['Add more specifics and stronger business impact framing'],
    ).slice(0, 4),
    nextSteps: normalizeStringList(
      parsed.nextSteps,
      ['Practice answers with clearer structure and measurable outcomes'],
    ).slice(0, 4),
    standoutMoments: normalizeStringList(
      parsed.standoutMoments,
      ['The session produced a useful baseline answer to build on.'],
    ).slice(0, 3),
    createdAt,
    updatedAt: createdAt,
  }
}

export async function generateFinalReport(
  env: WorkerEnv,
  session: PersistedSessionSnapshot,
  feedback: PersistedFeedbackRecord[],
): Promise<InterviewReport> {
  const fallbackReport = buildFallbackReport(session, feedback)

  if (getAiRuntimeMode(env) !== 'workers') {
    return fallbackReport
  }

  try {
    return await generateReportWithAi(env, session, feedback)
  } catch (error) {
    console.warn('Workers AI report generation failed. Falling back to deterministic report.', error)
    return fallbackReport
  }
}
