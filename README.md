# AI Interview Coach

Cloudflare-based AI Interview Coach built with a text-first experience and an optional turn-based voice path. The product is intentionally shaped as a guided interview workflow rather than a generic chatbot.

- Production Link: [AI Interview Coach](https://cf-ai-interview-coach.tysonhoanglearning.workers.dev/)
- List of future improvement is included under [docs/improvements.md](docs/improvements.md)

## Product Scope

- Primary MVP path: structured text interview sessions
- Secondary MVP path: optional browser-based voice conversation that reuses the same interview engine
- Key assignment requirements covered by the target architecture:
- LLM via Workers AI
- workflow and coordination via Durable Objects and optional Workflows
- user input via chat and voice
- memory and state via Durable Objects plus D1 persistence

## Architecture

- Frontend: React + TypeScript on Cloudflare Pages
- Backend API: Cloudflare Workers
- LLM inference: Workers AI
- Live session state: Durable Objects
- Structured long-term persistence: D1
- Optional long-running report generation: Cloudflare Workflows

## Why These Cloudflare Products

- Pages serves the React frontend cleanly and supports preview deployments.
- Workers provide a low-latency API layer close to Workers AI, D1, and Durable Objects.
- Workers AI keeps inference inside the Cloudflare platform and avoids a separate model gateway.
- Durable Objects are the right fit for per-session ordered coordination, live transcript state, current question index, and rolling prompt context.
- D1 is the right fit for structured session metadata, reports, evaluation records, and history queries across sessions.
- Workflows are optional for the MVP and are best deferred until final report generation is heavy enough to justify asynchronous orchestration.

## Current Step

Current scaffold status:

- app shell and route structure
- Redux-style store scaffold with async session thunks
- shared interview types
- explicit frontend API boundary
- Worker-powered local transport with one Durable Object per live session
- D1-backed history and persisted report metadata
- Workers AI adapter path with configuration-driven runtime mode
- Final report generation from D1-backed session and evaluation records
- Conversational voice mode with browser speech capture, silence-based turn detection, and shared Worker session processing
- Saved-session deletion from history and report views, with Durable Object cleanup before D1 cleanup
- setup documentation and prompt strategy docs

Durable Object-backed session state, D1-backed history/report metadata, Workers AI adapter paths, inline final report generation, and conversational voice mode are now in place.

## Folder Structure

```text
src/
  worker/
    index.ts
    routes/
    services/
    ai/
    db/
    durable/
  frontend/
    components/
    pages/
    store/
    slices/
    services/
    hooks/
  shared/
    types.ts

migrations/
prompts/
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create local env files from the checked-in examples:

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
cp wrangler.example.jsonc wrangler.jsonc
```

3. Keep the frontend on Worker transport in `.env`:

```dotenv
VITE_APP_TITLE=AI Interview Coach
VITE_API_TRANSPORT=worker
VITE_API_BASE_URL=/
```

4. If you want real Workers AI locally, update `.dev.vars` and set `AI_RUNTIME_MODE=workers`. Otherwise leave it as `mock` for local development.

5. Fill the local `wrangler.jsonc` placeholders before running the Worker:

- set `database_id`
- set `preview_database_id`
- keep `AI_RUNTIME_MODE=mock` in the config unless you want local Workers AI calls

6. Start the Worker in one terminal:

```bash
npm run dev:worker
```

7. Start the frontend in another terminal:

```bash
npm run dev
```

8. Open the local Vite URL and verify:

- landing page renders
- setup page updates interview preferences
- interview session route opens through the Worker
- report and history pages render
- saved sessions can be deleted from history and report pages

9. Run the full local verification bundle when needed:

```bash
npm run verify
```

## Environment Variables

Copy `.env.example` to `.env` and update as needed.

Frontend:

- `VITE_APP_TITLE`
- `VITE_API_TRANSPORT`
- `VITE_API_BASE_URL`

Worker runtime:

- `AI_RUNTIME_MODE`
- `AI_INTERVIEW_MODEL`
- `AI_EVALUATION_MODEL`
- `AI_REPORT_MODEL`

The checked-in example files `.env.example` and `.dev.vars.example` only include variables that are actively used by the current codebase.

Model IDs are intentionally configuration-driven so the LLM choice is swappable without code changes. The current MVP voice path uses browser speech recognition, browser speech synthesis, a 4-second silence window, and a manual transcript fallback.

The frontend transport is also configuration-driven:

- `VITE_API_TRANSPORT=worker` is now the recommended local path for development.
- `VITE_API_TRANSPORT=mock` remains available as a fallback if you want to bypass the Worker temporarily.

The Vite dev server proxies `/api` requests to the local Worker on `http://127.0.0.1:8787`.

## Deploy To Cloudflare Production

1. Authenticate Wrangler:

```bash
npx wrangler login
```

2. Create the production D1 database if you do not already have one:

```bash
npx wrangler d1 create interview-coach-db
```

3. Copy `wrangler.example.jsonc` to an untracked local `wrangler.jsonc` and fill in the production `database_id` values:

```bash
cp wrangler.example.jsonc wrangler.jsonc
```

4. Apply the remote D1 migrations:

```bash
npx wrangler d1 migrations apply interview-coach-db --remote
```

5. Set production Worker variables in your local `wrangler.jsonc` or your deployment pipeline:

```text
AI_RUNTIME_MODE=workers
AI_INTERVIEW_MODEL=<your Workers AI model>
AI_EVALUATION_MODEL=<your Workers AI model>
AI_REPORT_MODEL=<your Workers AI model>
```

6. Deploy the Worker:

```bash
npx wrangler deploy
```

7. Create a Cloudflare Pages project for this repo and use:

```text
Build command: npm run build
Output directory: dist
```

8. Set Pages production environment variables:

```text
VITE_APP_TITLE=AI Interview Coach
VITE_API_TRANSPORT=worker
VITE_API_BASE_URL=https://<your-worker-domain>/
```

9. Trigger the Pages production deployment from the dashboard or by pushing to the production branch.

10. Smoke test production:

- start and finish a text session
- run a voice session
- open the generated report
- delete a completed session from history
- delete a completed session from the report page

## Worker Bindings

```toml
[vars]
AI_RUNTIME_MODE = "mock"

[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "interview-coach-db"
database_id = "REPLACE_WITH_D1_DATABASE_ID"
preview_database_id = "REPLACE_WITH_PREVIEW_D1_DATABASE_ID"

[[durable_objects.bindings]]
name = "INTERVIEW_SESSIONS"
class_name = "InterviewSessionDurableObject"
```

## Manual Cloudflare Setup

See [docs/cloudflare-setup.md](docs/cloudflare-setup.md) for the concrete checklist covering:

- Cloudflare account setup
- Wrangler authentication
- D1 database creation
- Durable Object binding and migration registration
- Pages project creation
- Workers AI enablement
- environment variable and secret configuration
- untracked Wrangler config setup from `wrangler.example.jsonc`

## Testing And Schema Docs

- [docs/testing.md](docs/testing.md) for automated and manual verification guidance
- [docs/d1-schema.md](docs/d1-schema.md) for the D1 persistence model

## Prompt Strategy

See [prompts/COACHING_PROMPTS.md](prompts/COACHING_PROMPTS.md) for:

- system prompt contract
- evaluation prompt contract
- report prompt contract
- memory injection strategy
- prompt growth control
- model configuration rules
