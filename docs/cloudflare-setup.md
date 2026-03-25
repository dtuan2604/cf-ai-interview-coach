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
5. Copy `wrangler.example.jsonc` to a local untracked `wrangler.jsonc`.
6. Copy the returned `database_id` into the local `wrangler.jsonc` under the `d1_databases` binding.
7. Verify the Durable Object binding and migration entry for `InterviewSessionDurableObject` are present in `wrangler.jsonc`.
8. Enable Workers AI in the Cloudflare dashboard for the account you are using.
9. Create a Pages project connected to the repository.
10. Set the Pages build command to `npm run build`.
11. Set the Pages output directory to `dist`.
12. Add Pages environment variables:
    - `VITE_API_TRANSPORT=worker`
    - `VITE_API_BASE_URL=https://<your-worker-domain>/`
    - `VITE_APP_TITLE=AI Interview Coach` or your preferred title for the app header and browser tab
13. Add Worker environment variables for `AI_RUNTIME_MODE`, `AI_INTERVIEW_MODEL`, `AI_EVALUATION_MODEL`, and `AI_REPORT_MODEL`.
14. Set `AI_RUNTIME_MODE=workers` in production if you want real Workers AI inference. Keep `mock` only for demos or smoke tests.
15. Add secrets or environment-specific vars in the Cloudflare dashboard instead of hardcoding model IDs.
16. Run the local D1 migrations with `npm run db:migrate:local`.
17. Run the remote D1 migrations with `npx wrangler d1 migrations apply interview-coach-db --remote` when you are ready to deploy.
18. Deploy the Worker with `npx wrangler deploy`.
19. Trigger a Pages production deployment from the dashboard or by pushing to the production branch.
20. Open the deployed Pages URL, start a session, complete it, confirm the report loads, and confirm delete works from history and report views.

## Wrangler Configuration Targets

The local untracked Worker configuration should include entries equivalent to:

```toml
name = "cf-ai-interview-coach-api"
main = "src/worker/index.ts"
compatibility_date = "2026-03-23"

[vars]
AI_RUNTIME_MODE = "mock"
AI_INTERVIEW_MODEL = "YOUR_WORKERS_AI_CHAT_MODEL"
AI_EVALUATION_MODEL = "YOUR_WORKERS_AI_EVALUATION_MODEL"
AI_REPORT_MODEL = "YOUR_WORKERS_AI_REPORT_MODEL"

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

The repo now ships `wrangler.example.jsonc` instead of a committed live Wrangler config so D1 IDs do not need to live in git. Copy it to a local untracked `wrangler.jsonc` before running `wrangler dev` or `wrangler deploy`. `AI_RUNTIME_MODE=mock` remains the recommended local default until you want to spend Workers AI usage on live inference. The current MVP voice path does not require extra Cloudflare setup because transcription happens in the browser before the transcript is submitted to the Worker. The example env files in the repo have been trimmed to only the variables that are currently read by the application.

## Production Deployment Notes

- The frontend and API are deployed separately in the current architecture:
  - Cloudflare Pages serves the Vite frontend build from `dist`.
  - Cloudflare Workers serves the API, Durable Object, D1, and Workers AI bindings.
- Deploy the Worker first so the Pages project can point `VITE_API_BASE_URL` at a live API origin.
- If you add a custom domain later, update `VITE_API_BASE_URL` to the Worker custom domain and redeploy Pages.
- Session deletion works by clearing the Durable Object first and then deleting the D1 records, so production verification should include deleting a completed session and confirming it no longer appears in history or reports.
