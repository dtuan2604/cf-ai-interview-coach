You are helping me build a Cloudflare-based AI assignment project. I want you to behave like a senior engineer and technical collaborator, not just a code generator.

Project goal:
Build an AI Interview Coach with text mode as the primary experience and voice mode as an optional secondary input mode. The project must clearly demonstrate Cloudflare’s AI application requirements:
- LLM
- workflow / coordination
- user input via chat or voice
- memory or state

Core product idea:
The app is an AI Interview Coach. A user selects a role, interview type, difficulty, and mode, then starts an interview session. The AI asks questions, the user answers via text or voice, the system evaluates each answer, remembers prior answers, adjusts future questions, and produces a final report. The system should support persistent multi-turn memory per interview session.

Technical direction:
I want the architecture to map clearly to Cloudflare’s platform:
- Frontend: Cloudflare Pages
- Backend/API: Cloudflare Workers
- LLM: Workers AI
- Stateful session memory: Durable Objects
- Structured persistence: D1
- Optional longer-running post-session report generation: Workflows
- Voice mode should be pragmatic and turn-based unless there is a compelling reason to do more

Important note:
The LLM model must be configurable via environment variables / configuration rather than hardcoded. I want the model choice to be swappable through .env / Cloudflare environment configuration.

Architecture boundary I want you to follow:
- Durable Objects (DO) = per-session working memory + coordination
- D1 = structured, queryable, long-term data

Specifically:
1. Store in Durable Objects:
- live conversation transcript / recent turns
- summarized memory if needed
- current question index
- interview session status
- live scoring state
- temporary voice transcript chunks
- prompt context needed to continue the session
- per-session ordered working state

2. Store in D1:
- users (if needed)
- interview_sessions
- interview_reports
- per-question feedback / evaluation records if included
- long-term session metadata
- final report data
- any data needed for history pages, analytics, or cross-session queries

You should treat this split as intentional and explain it clearly in the plan and implementation.

Primary implementation priorities:
1. Text-first experience must work well.
2. Voice mode should be implemented as a safe, turn-based mode unless there is a strong reason otherwise.
3. The app should feel like a guided interview product, not a generic chatbot.
4. The architecture choices must be explicit and well justified.
5. The codebase should follow best practices for folder structure, maintainability, and separation of concerns.
6. Frontend state management should follow a Redux-style pattern for simplicity and clarity.
7. The code should be implemented in executable increments, with each step runnable and verifiable before moving on.

Frontend preference:
- React + TypeScript
- Cloudflare Pages-compatible setup
- Redux Toolkit-style state management pattern unless there is a clearly better minimal equivalent
- Clean, professional UI, not flashy

Important implementation process requirement:
Do not try to build everything at once.

You must work in clearly separated steps.

For each step:
1. First explain the step in detail:
   - what you are about to build
   - why this step comes now
   - what files you expect to add/change
   - what the expected runnable outcome is
2. Then implement only that step.
3. After implementation, clearly tell me:
   - how to run it
   - what I should verify
   - what is complete vs still stubbed
   - what Cloudflare setup or external configuration I need to do for that step
4. Then STOP and wait for my approval before moving to the next step.

This is mandatory:
- After each step, the codebase should be executable.
- Even if some later integrations are stubbed or mocked temporarily, the app should still run.
- You must not move to the next step until I approve.

What I need from you:
I do not want you to jump straight into coding. First, I want you to think through the architecture and execution plan in detail.

Please do the following in order.

PHASE 1 — PLAN FIRST
Before writing or changing code, provide a detailed implementation plan with these sections:

1. Product overview
- Explain the product in plain English
- Clarify the MVP scope
- Identify which features are required for the assignment versus nice-to-have

2. Architecture overview
- Explain the overall system architecture
- List every Cloudflare product being used
- For each Cloudflare product, explain:
  - what it does
  - why it is being used
  - why it is more appropriate than alternatives
- Explicitly explain:
  - why Durable Objects are used for interview session state
  - why D1 is used for structured persistence
  - whether Workflows are necessary in the MVP or should be deferred
  - how Workers AI fits into the request flow
  - how model configurability via environment variables will work

3. User flow / UX flow
Lay out the UI flow in detail:
- Landing page
- Interview setup page
- Interview session page
- Text answer flow
- Voice answer flow
- End session flow
- Final report flow
- Past sessions/history page if included

4. Data model
Define the data model clearly:
- D1 tables
- Durable Object state shape
- frontend state shape
- API payloads
- report structure

5. Request / control flow
Explain in sequence what happens for:
- starting a new session
- sending a text answer
- sending a voice answer
- evaluating an answer
- loading prior session data
- ending a session
- generating a final report

6. Folder structure proposal
Propose a clean, scalable folder structure and explain why it is organized that way.
Follow best practices for:
- frontend components
- pages/routes
- API services
- shared types
- Workers code
- Durable Objects
- D1 access layer
- AI prompt logic
- Redux-style state management
- utilities
- tests
- configuration

7. State management design
Use a Redux-style frontend structure for simplicity.
Explain:
- slices/stores
- actions
- reducers
- async flow
- when state is local UI state versus global app state

8. Prompt design
Explain the prompt strategy before implementing it.
I want the project to include a COACHING_PROMPTS.md file.
Document:
- system prompts
- evaluation prompts
- report generation prompts
- how session memory is injected
- how prompt size is controlled
- how model selection/configuration is handled

9. Environment and setup requirements outside the codebase
This is very important:
As part of the plan, explicitly list everything I need to do outside the codebase to configure Cloudflare and any other required services.

Examples:
- create Cloudflare account if needed
- enable Workers AI
- create a D1 database
- create Durable Object bindings
- configure Pages project
- configure Wrangler
- configure environment variables / secrets
- define AI model env vars
- run migrations
- any dashboard configuration steps
- local development setup
- deployment steps

Make this section very concrete and actionable. I want a checklist of what I need to configure manually outside the repo.

10. Delivery phases
Break the build into phases, for example:
- Phase A: scaffold and architecture
- Phase B: Pages frontend and routing
- Phase C: interview setup flow
- Phase D: session UI shell and Redux state
- Phase E: Worker API skeleton
- Phase F: Durable Object memory
- Phase G: D1 persistence
- Phase H: Workers AI integration
- Phase I: voice mode
- Phase J: final reporting
- Phase K: polish and docs

For each phase:
- explain what you are building
- explain why it comes in that order
- explain dependencies and risks
- explain whether the phase should end in a runnable state

11. Incremental execution plan
This section is mandatory.
Convert the implementation phases into step-by-step executable milestones.

For each step:
- give the step a name
- define exact scope
- define what will be runnable at the end of the step
- define what can be stubbed temporarily
- define what I need to verify manually
- define what external Cloudflare setup I need to do at that point
- state explicitly that you will stop after that step and wait for approval

This should be designed so that each step leaves the codebase in a usable, executable state.

PHASE 2 — THEN IMPLEMENT
After presenting the plan, start implementation incrementally.

During implementation:
- explain what you are doing before making significant changes
- explain why you are doing it
- keep the architecture aligned with the original plan
- avoid unnecessary abstractions
- do not introduce libraries unless they clearly improve the solution
- prefer clarity over cleverness
- use best practices for code organization

Very important process rule:
At the end of every implementation step:
- ensure the project runs
- explain exactly how to run it
- tell me exactly what to click/test/verify
- list any known limitations or placeholders
- list any Cloudflare or environment setup I need to do outside the repo
- ask for my approval before proceeding

PHASE 3 — DOCUMENTATION
As part of the build, create or update:
- README.md
- COACHING_PROMPTS.md
- .env.example
- setup/configuration guide
- migrations / schema docs if needed

README.md should include:
- project overview
- architecture
- why each Cloudflare product is used
- local setup
- Cloudflare setup
- environment variables
- model configurability
- deployment instructions
- tradeoffs and future improvements

COACHING_PROMPTS.md should include:
- all prompt templates
- rationale for each prompt
- memory strategy
- token/control strategy
- model configuration notes
- evaluation/report prompt notes

MVP expectations:
The MVP should include:
- landing page
- interview setup flow
- text-based interview mode
- optional turn-based voice input mode
- AI-generated question flow
- AI evaluation of answers
- Durable Object-based per-session memory
- D1 persistence for structured metadata / reports
- final interview report
- clear Cloudflare integration

Preferred UX:
The app should feel like a structured interview coach.
It should not look like a generic chat app with a microphone button.
The interview page should ideally include:
- session metadata
- question progress
- conversation panel
- answer input area
- live evaluation or coaching area
- end session action

Technical guidance:
- Keep text mode as the stable primary path
- Voice mode should reuse the same core interview engine where possible
- Use a deterministic session ID strategy
- Use one Durable Object per interview session
- Store structured session/report metadata in D1
- Be careful about prompt growth as the conversation gets longer
- Prefer a summary + recent turns memory pattern if needed
- Think through concurrency and ordered updates
- Keep model selection configurable via environment variables / config
- Do not hardcode a single LLM choice into business logic

Code quality expectations:
- follow best practices for folder structure
- keep concerns separated
- create shared types/interfaces
- validate payloads where appropriate
- keep API boundaries clear
- use clean naming
- avoid fragile hidden coupling
- include comments only where they add real value
- keep implementation production-minded, even if lightweight

Frontend expectations:
- Use a Redux-style state management pattern for simplicity
- Keep UI components modular
- Separate container/stateful logic from presentational components where reasonable
- Keep the UI clear and professional, not overly flashy

Testing expectations:
At minimum, suggest and, where practical, include:
- basic unit tests for core logic
- tests for reducers/state transitions
- tests for prompt-building utilities
- notes on what should be tested manually

Constraints:
- Do not overbuild
- Do not add unnecessary agentic frameworks
- Do not force multi-agent design
- Do not overcomplicate voice
- Do not assume Workflows are mandatory if they are not justified
- If Workflows are not included in the MVP, explain why and treat them as an optional enhancement
- Keep the project coherent and explain every architecture decision

Important configuration requirement:
I expect you to specify the exact bindings and config entries that should appear in Wrangler / Cloudflare configuration, including placeholders for:
- AI binding
- Durable Object namespace
- D1 binding
- environment variables / secrets
- model configuration entries

When you respond:
1. Start with the detailed plan
2. Explain your reasoning clearly
3. Identify any assumptions
4. Then proceed step by step with implementation
5. At each stage, also tell me what I need to do outside the codebase to support that stage in Cloudflare
6. After each implementation step, stop and wait for my approval

One more requirement:
Whenever you introduce a major architectural decision, explicitly answer:
- what this component is
- why we need it
- how it works in this app
- what I need to configure outside the codebase for it

Do not be vague. I want a detailed, engineering-quality walkthrough, not just generated files.

-------------------------------------------
I would prefer for the code to be similarly structured this way:
cf-ai-interview-coach/
│
├── src/
│   ├── worker/                # Worker API
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── ai/
│   │   ├── db/
│   │   └── durable/
│   │     
│   │
│   ├── frontend/              # React app
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/              # Redux
│   │   ├── slices/
│   │   ├── services/
│   │   └── hooks/
│   │
│   ├── shared/                 # Shared types
│   │   └── types.ts
│
├── migrations/                 # D1 SQL
├── prompts/                    # Prompt templates
│   └── COACHING_PROMPTS.md
│
├── README.md
├── wrangler.json
├── .dev.vars
└── package.json