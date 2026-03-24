import type { InterviewSessionState, InterviewSetupInput } from '../../shared/types'
import type {
  PersistedFeedbackRecord,
  PersistedSessionSnapshot,
} from '../db/interviewRepository'

function formatRecentTurns(session: InterviewSessionState | null) {
  if (!session) {
    return 'No prior turns yet.'
  }

  return session.transcript
    .slice(-6)
    .map((turn) => `${turn.speaker.toUpperCase()}: ${turn.text}`)
    .join('\n')
}

export function buildQuestionPrompt(
  config: InterviewSetupInput,
  session: InterviewSessionState | null,
) {
  const questionIndex = session ? session.questionIndex + 1 : 1

  return `
You are an AI interview coach running a structured mock interview.

Return raw JSON only with this shape:
{"question":"string"}

Rules:
- Ask exactly one interview question.
- Keep the tone professional and realistic.
- Tailor the question to the role, interview type, and difficulty.
- Use the recent transcript and latest coaching feedback if available.
- Do not include explanations or markdown.

Configuration:
- Role: ${config.role}
- Interview type: ${config.interviewType}
- Difficulty: ${config.difficulty}
- Mode: ${config.mode}
- Question number: ${questionIndex}

Recent context:
${formatRecentTurns(session)}

Latest evaluation summary:
${session?.latestEvaluation?.summary ?? 'None yet.'}
`.trim()
}

export function buildEvaluationPrompt(
  session: InterviewSessionState,
  answer: string,
) {
  const currentQuestion = session.questions[session.questionIndex] ?? 'Unknown question'

  return `
You are evaluating a candidate's mock interview answer.

Return raw JSON only with this shape:
{"score":number,"strengths":["string"],"improvements":["string"],"summary":"string"}

Rules:
- Score from 0 to 10.
- Provide 1-3 strengths.
- Provide 1-3 improvements.
- Keep the summary concise and coaching-oriented.
- Do not include markdown or commentary outside the JSON.

Interview context:
- Role: ${session.role}
- Interview type: ${session.interviewType}
- Difficulty: ${session.difficulty}
- Current question: ${currentQuestion}

Candidate answer:
${answer}
`.trim()
}

export function buildReportPrompt(
  session: PersistedSessionSnapshot,
  feedback: PersistedFeedbackRecord[],
) {
  const feedbackBlock = feedback.length > 0
    ? feedback
        .map((item) => [
          `Question ${item.questionIndex + 1}: ${item.questionText}`,
          `Score: ${item.score}`,
          `Strengths: ${item.strengths.join(', ') || 'None'}`,
          `Improvements: ${item.improvements.join(', ') || 'None'}`,
          `Summary: ${item.summary}`,
        ].join('\n'))
        .join('\n\n')
    : 'No completed answer evaluations were stored for this session.'

  return `
You are writing the final report for a structured AI interview coach product.

Return raw JSON only with this shape:
{"summary":"string","readinessAssessment":"string","strengths":["string"],"growthAreas":["string"],"nextSteps":["string"],"standoutMoments":["string"]}

Rules:
- Keep the tone professional, direct, and coaching-oriented.
- Use the evaluation records as the primary evidence.
- Provide 2-4 strengths.
- Provide 2-4 growth areas.
- Provide 2-4 next steps.
- Provide 1-3 standout moments grounded in the session.
- Do not include markdown or commentary outside the JSON.

Session metadata:
- Role: ${session.role}
- Interview type: ${session.interviewType}
- Difficulty: ${session.difficulty}
- Mode: ${session.mode}
- Overall score: ${session.overallScore}
- Latest summary: ${session.latestSummary ?? 'None'}

Evaluation records:
${feedbackBlock}
`.trim()
}
