import type {
  EvaluationSnapshot,
  HistorySessionSummary,
  InterviewReport,
  InterviewSessionState,
  InterviewSetupInput,
  TranscriptTurn,
} from './types'

const questionPlans: Record<string, string[]> = {
  'Frontend Engineer|Technical': [
    'Walk me through how you would diagnose a React page that feels slow after a feature launch.',
    'How would you design a resilient frontend state model for an interview session with live feedback?',
    'Describe a tradeoff you would make when deciding between client-side and server-side rendering for a dashboard.',
  ],
  'Frontend Engineer|Behavioral': [
    'Tell me about a time you pushed back on a product request because the implementation risk was too high.',
    'Describe a project where you had to balance speed with code quality.',
    'How do you handle disagreement with a designer or product manager on scope?',
  ],
  'Product Manager|Behavioral': [
    'Tell me about a time you had to prioritize under severe resource constraints.',
    'How do you create alignment when engineering and business goals diverge?',
    'Describe a product decision you would reverse if you had the chance.',
  ],
}

export function buildMockQuestionPlan(role: string, interviewType: string) {
  return (
    questionPlans[`${role}|${interviewType}`] ?? [
      `Tell me how you would prepare for a ${interviewType.toLowerCase()} interview for a ${role} role.`,
      'What would you improve about your most recent answer if you had one more minute?',
      'What is one area of this role where you would need to ramp up fastest?',
    ]
  )
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

function buildTurn(
  speaker: TranscriptTurn['speaker'],
  text: string,
  createdAt = new Date().toISOString(),
): TranscriptTurn {
  return {
    id: crypto.randomUUID(),
    speaker,
    text,
    createdAt,
  }
}

export function buildMockHistoryEntry(session: InterviewSessionState): HistorySessionSummary {
  return {
    id: session.id,
    role: session.role,
    interviewType: session.interviewType,
    difficulty: session.difficulty,
    mode: session.mode === 'voice' ? 'Voice' : 'Text',
    status: 'completed',
    score: session.latestEvaluation?.score ?? 7,
    completedAt: new Date().toISOString(),
    summary:
      session.latestEvaluation?.summary ??
      'Mock session ended before the real Worker evaluation pipeline was connected.',
  }
}

export function buildMockReport(session: InterviewSessionState): InterviewReport {
  const createdAt = new Date().toISOString()
  const strengths = session.latestEvaluation?.strengths ?? ['Clear communication']
  const growthAreas =
    session.latestEvaluation?.improvements ?? ['Add sharper examples and more measurable impact']

  return {
    sessionId: session.id,
    role: session.role,
    interviewType: session.interviewType,
    overallScore: session.latestEvaluation?.score ?? 7,
    summary:
      session.latestEvaluation?.summary ??
      'Solid baseline. Strongest next step is turning general answers into sharper interview stories.',
    readinessAssessment:
      session.latestEvaluation?.score && session.latestEvaluation.score >= 8
        ? 'Strong baseline with room to sharpen impact framing.'
        : 'Developing baseline that needs more specificity and structure.',
    strengths,
    growthAreas,
    nextSteps: [
      'Practice answers with explicit structure.',
      'Add measurable outcomes to examples.',
      'Prepare one follow-up detail for each core story.',
    ],
    standoutMoments: session.transcript
      .filter((turn) => turn.speaker === 'user')
      .slice(-2)
      .map((turn) => turn.text),
    createdAt,
    updatedAt: createdAt,
  }
}

export function createMockSession(
  input: InterviewSetupInput,
  sessionId = `session-${crypto.randomUUID()}`,
): InterviewSessionState {
  const questions = buildMockQuestionPlan(input.role, input.interviewType)

  return {
    id: sessionId,
    role: input.role,
    interviewType: input.interviewType,
    difficulty: input.difficulty,
    mode: input.mode,
    status: 'in_progress',
    questionIndex: 0,
    totalQuestions: questions.length,
    questions,
    transcript: [buildTurn('assistant', questions[0])],
    latestEvaluation: null,
  }
}

export function applyMockAnswer(
  session: InterviewSessionState,
  answer: string,
): InterviewSessionState {
  if (session.status !== 'in_progress' || !answer.trim()) {
    return session
  }

  const evaluation = buildEvaluation(answer, session.questionIndex)
  const transcript = [
    ...session.transcript,
    buildTurn('user', answer),
    buildTurn('coach', `Coaching note: ${evaluation.summary}`),
  ]

  const nextQuestionIndex = session.questionIndex + 1
  if (nextQuestionIndex < session.totalQuestions) {
    return {
      ...session,
      questionIndex: nextQuestionIndex,
      transcript: [
        ...transcript,
        buildTurn('assistant', session.questions[nextQuestionIndex]),
      ],
      latestEvaluation: evaluation,
    }
  }

  return {
    ...session,
    status: 'completed',
    transcript,
    latestEvaluation: evaluation,
  }
}

export function completeMockSession(session: InterviewSessionState) {
  const completedSession = {
    ...session,
    status: 'completed' as const,
  }

  return {
    session: completedSession,
    historyEntry: buildMockHistoryEntry(completedSession),
  }
}
