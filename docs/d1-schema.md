# D1 Schema Notes

The project uses D1 for structured, queryable, long-term records. Durable Objects remain the source of truth for live session coordination.

## Tables

### `interview_sessions`

Stores session-level metadata:

- setup selections such as role, interview type, difficulty, and mode
- current and final session status
- latest summary and overall score snapshot
- timestamps for start, end, create, and update
- no full transcript payload; the live transcript stays in the Durable Object

### `interview_feedback`

Stores one structured evaluation row per answered question:

- question index and question text
- answer text
- numeric score
- strengths, improvements, and evaluation summary

### `interview_reports`

Stores the persisted final report:

- overall score and summary
- readiness assessment
- strengths
- growth areas
- next steps
- standout moments

## Why This Split Exists

- Durable Objects: ordered working state for the live interview
- D1: persistent records for history pages, report pages, and future analytics

That separation is intentional and matches the architecture described in the assignment.

## Delete Behavior

Deleting a saved session is a cross-store operation:

1. Clear the Durable Object session state so the live session can no longer be restored.
2. Delete the matching `interview_reports`, `interview_feedback`, and `interview_sessions` rows from D1.

That ordering prevents a stale live session from surviving after its long-term records are removed.
