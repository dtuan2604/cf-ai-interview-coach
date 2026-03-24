import type { InterviewSessionState, InterviewSetupInput } from '../../shared/types'

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
