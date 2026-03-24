# Cloudflare Setup Guide

This guide lists the manual setup required outside the repo. The local Worker runtime, Durable Object binding, D1 persistence path, and Workers AI adapter path are already active in the repo.

## Required Cloudflare Products

- Cloudflare Pages for the React frontend
- Cloudflare Workers for the backend API
- Workers AI for model inference
- Durable Objects for per-session working memory
- D1 for structured persistence

## Recommended Manual Checklist

1. Create or sign in to a Cloudflare account.
2. Install Wrangler locally with `npm install`.
3. Authenticate Wrangler with `npx wrangler login`.
4. Create a D1 database with `npx wrangler d1 create <database-name>`.
5. Copy the returned `database_id` into the Worker configuration under the `d1_databases` binding.
6. Create a Durable Object namespace in the Worker configuration and add a migration entry for the class.
7. Enable Workers AI in the Cloudflare dashboard for the account you are using.
8. Create a Pages project connected to the repository.
9. Set the Pages build command to `npm run build`.
10. Set the Pages output directory to `dist`.
11. Add Worker environment variables for `AI_INTERVIEW_MODEL`, `AI_EVALUATION_MODEL`, `AI_REPORT_MODEL`, and optional voice configuration.
12. Add secrets or environment-specific vars in the Cloudflare dashboard instead of hardcoding model IDs.
13. Run the local D1 migrations with `npm run db:migrate:local`.
14. Run the remote D1 migrations with `npx wrangler d1 migrations apply <database-name> --remote` when you are ready to deploy.

## Wrangler Configuration Targets

The Worker configuration will eventually include entries equivalent to:

```toml
name = "cf-ai-interview-coach-api"
main = "workers/index.ts"
compatibility_date = "2026-03-23"

[vars]
APP_ENV = "local"
AI_INTERVIEW_MODEL = "YOUR_WORKERS_AI_CHAT_MODEL"
AI_EVALUATION_MODEL = "YOUR_WORKERS_AI_EVALUATION_MODEL"
AI_REPORT_MODEL = "YOUR_WORKERS_AI_REPORT_MODEL"
AI_TRANSCRIPTION_MODEL = "YOUR_WORKERS_AI_STT_MODEL"
SESSION_SUMMARY_MAX_TOKENS = "1200"
REPORT_MAX_TOKENS = "2200"

[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "interview-coach-db"
database_id = "REPLACE_WITH_D1_DATABASE_ID"

[[durable_objects.bindings]]
name = "INTERVIEW_SESSIONS"
class_name = "InterviewSessionDurableObject"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["InterviewSessionDurableObject"]
```

## Why This Split Matters

- Durable Objects: live per-session state, ordered turns, coordination, and prompt continuity.
- D1: long-term metadata, structured reports, history queries, and analytics-friendly records.

That separation is intentional and is the backbone of the architecture for this project.

## Current Local Runtime Note

The checked-in `wrangler.json` now includes the live Durable Object binding, migration, D1 binding, and AI binding so `wrangler dev` can run the real session-memory path locally. `AI_RUNTIME_MODE=mock` remains the recommended local default until you want to spend Workers AI usage on live inference. The current MVP voice path does not require extra Cloudflare setup because transcription happens in the browser before the transcript is submitted to the Worker.
