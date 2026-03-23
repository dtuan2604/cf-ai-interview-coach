# Coaching Prompts

This document defines the prompt strategy for the AI Interview Coach. Step 1 adds the prompt contracts and control strategy before Workers AI is wired into the runtime.

## Prompt Goals

- Keep the product in interview-coach mode instead of generic assistant mode.
- Separate question generation, answer evaluation, and final report generation.
- Preserve session continuity through Durable Object memory while controlling prompt growth.
- Keep model selection configurable through Worker environment variables instead of hardcoding model IDs in business logic.

## Model Configuration

The Worker will read the following environment variables at runtime:

- `AI_INTERVIEW_MODEL`: model used to generate the next interview question and adjust coaching direction.
- `AI_EVALUATION_MODEL`: model used to score and critique each answer.
- `AI_REPORT_MODEL`: model used to generate the final post-session report.
- `AI_TRANSCRIPTION_MODEL`: optional speech-to-text model for turn-based voice mode.

The application code should support fallbacks such as:

```text
AI_EVALUATION_MODEL || AI_INTERVIEW_MODEL
AI_REPORT_MODEL || AI_EVALUATION_MODEL || AI_INTERVIEW_MODEL
```

## System Prompt Template

Purpose: establish the product as a structured interview coach.

```text
You are an AI Interview Coach running a structured mock interview.

Your job:
- Stay in interviewer mode.
- Ask one question at a time.
- Tailor difficulty to the selected role and interview type.
- Use prior answers and coaching notes from memory.
- Keep the session realistic, concise, and professional.
- Do not reveal internal scoring rubrics unless explicitly asked in the report context.

Session configuration:
- Role: {{role}}
- Interview type: {{interviewType}}
- Difficulty: {{difficulty}}
- Mode: {{mode}}
- Question index: {{questionIndex}} of {{targetQuestionCount}}

Working memory:
- Session summary: {{summaryMemory}}
- Recent turns: {{recentTurns}}
- Coaching flags: {{coachingFlags}}
```

## Evaluation Prompt Template

Purpose: score the latest answer in a structured way and return machine-readable output.

```text
Evaluate the candidate's latest interview answer.

Context:
- Role: {{role}}
- Interview type: {{interviewType}}
- Difficulty: {{difficulty}}
- Current question: {{question}}
- Previous coaching flags: {{coachingFlags}}

Candidate answer:
{{answer}}

Return JSON with:
- scoreOverall (0-10)
- rubricScores.communication
- rubricScores.technicalDepth
- rubricScores.structure
- strengths (array)
- improvements (array)
- followUpNeeded (boolean)
- followUpQuestion (string | null)
- memoryUpdate (short summary for session memory)
```

## Final Report Prompt Template

Purpose: convert the session record into a polished coaching summary saved in D1.

```text
Generate a final interview coaching report.

Inputs:
- Session configuration
- Aggregated scores
- Key strengths
- Improvement themes
- Question-by-question evaluation summaries
- Session memory summary

Return JSON with:
- overallAssessment
- readinessLevel
- strengths
- growthAreas
- recommendedNextSteps
- standoutMoments
- reportSummary
```

## Memory Injection Strategy

- Durable Object holds the ordered live session state, recent transcript, question index, live scoring, and rolling summary memory.
- Prompt context should include:
- the latest summary memory
- the last 4-8 turns
- the current question metadata
- the latest evaluation highlights
- Earlier turns should be condensed into a summary string before prompt size becomes unstable.

## Prompt Size Control

- Keep a rolling summary in the Durable Object.
- Include only recent turns verbatim.
- Persist full transcript and structured evaluations to D1 at checkpoints or session end.
- Use token caps from environment configuration such as `SESSION_SUMMARY_MAX_TOKENS` and `REPORT_MAX_TOKENS`.

## Notes For Later Steps

- Evaluation and report prompts should request JSON to keep Worker parsing deterministic.
- Voice mode should reuse the same evaluation and next-question prompts after transcription.
- Prompt builders belong in a shared Worker-side `prompts/` module and should be unit tested.
