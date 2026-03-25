# Coaching Prompts

This document defines the prompt strategy for the AI Interview Coach as it exists in the current Worker implementation.

## Prompt Goals

- Keep the product in interview-coach mode instead of generic assistant mode.
- Separate question generation, answer evaluation, and final report generation.
- Preserve session continuity through Durable Object memory while controlling prompt growth.
- Keep model selection configurable through Worker environment variables instead of hardcoding model IDs in business logic.

## Model Configuration

The Worker will read the following environment variables at runtime:

- `AI_RUNTIME_MODE`: `mock` for safe local development, `workers` to call Workers AI.
- `AI_INTERVIEW_MODEL`: model used to generate the next interview question and adjust coaching direction.
- `AI_EVALUATION_MODEL`: model used to score and critique each answer.
- `AI_REPORT_MODEL`: model used to generate the final post-session report.

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
- summary
- readinessAssessment
- strengths
- growthAreas
- nextSteps
- standoutMoments
```

## Memory Injection Strategy

- Durable Object holds the ordered live session state, recent transcript, question index, and latest evaluation.
- Prompt context should include the last 6 turns.
- Prompt context should include the current question metadata.
- Prompt context should include the latest evaluation highlights.
- The current implementation does not yet maintain a rolling summary string.

## Prompt Size Control

- Include only recent turns verbatim.
- Persist structured session metadata, per-answer evaluations, and the final report to D1.
- Keep the full transcript in Durable Object storage for the live session.

## Current Runtime Notes

- Evaluation and report prompts should request JSON to keep Worker parsing deterministic.
- Voice mode should reuse the same evaluation and next-question prompts after transcription.
- The current MVP runs voice in the browser: the AI speaks the latest interviewer response aloud, browser speech recognition captures the user's answer, and the app waits about 4 seconds of silence before submitting the turn through the same Worker session flow as text input.
- Prompt builders belong in a shared Worker-side `prompts/` module and should be unit tested.
- Final report generation should use D1 session and evaluation records as the primary source rather than live Durable Object state.
