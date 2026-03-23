# AI Interview Coach

Cloudflare-based AI Interview Coach built with a text-first experience and an optional turn-based voice path. The product is intentionally shaped as a guided interview workflow rather than a generic chatbot.

## Product Scope

- Primary MVP path: structured text interview sessions
- Secondary MVP path: optional turn-based voice input that reuses the same interview engine
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
- Worker-powered local transport with mock session logic behind the routes
- setup documentation and prompt strategy docs

The real Worker API, Durable Object memory, D1 schema, Workers AI calls, and voice capture pipeline are still upcoming.

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

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the frontend:

```bash
npm run dev
```

3. Open the local Vite URL and verify:

- landing page renders
- setup page updates interview preferences
- mock interview session route opens
- report and history pages render

## Environment Variables

Copy `.env.example` to `.env` and update as needed.

Frontend:

- `VITE_APP_TITLE`
- `VITE_API_TRANSPORT`
- `VITE_API_BASE_URL`
- `VITE_DEFAULT_MODEL_LABEL`

Worker runtime:

- `APP_ENV`
- `AI_INTERVIEW_MODEL`
- `AI_EVALUATION_MODEL`
- `AI_REPORT_MODEL`
- `AI_TRANSCRIPTION_MODEL`
- `SESSION_SUMMARY_MAX_TOKENS`
- `REPORT_MAX_TOKENS`

Model IDs are intentionally configuration-driven so the LLM choice is swappable without code changes.

The frontend transport is also configuration-driven:

- `VITE_API_TRANSPORT=worker` is now the recommended local path for development.
- `VITE_API_TRANSPORT=mock` remains available as a fallback if you want to bypass the Worker temporarily.

## Local Development With Worker Transport

Run the frontend and Worker in separate terminals:

```bash
npm run dev:worker
npm run dev
```

The Vite dev server proxies `/api` requests to the local Worker on `http://127.0.0.1:8787`.

## Planned Wrangler Bindings

```toml
[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "cf-ai-interview-coach"
database_id = "REPLACE_WITH_D1_DATABASE_ID"

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

## Prompt Strategy

See [prompts/COACHING_PROMPTS.md](prompts/COACHING_PROMPTS.md) for:

- system prompt contract
- evaluation prompt contract
- report prompt contract
- memory injection strategy
- prompt growth control
- model configuration rules
