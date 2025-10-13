# AGENTS.md

## Project overview

- intelliSPEC Web couples a React/TypeScript SPA (`src/`) with a Fastify + MongoDB API (`api/`) that powers multi-tenant inspections, document management, and LangGraph-based workflows.
- The API is layered: `core/` hosts framework services (auth, request context, metrics, logging), `routes/` defines Fastify plugins per feature, `repositories/` wrap Mongoose models, `services/` provide business orchestration, and `workflows/` contains LangGraph agents.
- Cross-cutting concerns (audit trail, metrics, feature flags, tenant context) are centralized in `api/core` and expected to be consumed rather than reimplemented in feature code.
- Legacy scripts live under `api/scripts/` and `scripts/`; prefer extending the framework modules before adding new ad-hoc utilities.

## How to build / run / test

- Prereqs: Node 18+, npm, MongoDB Atlas (or compatible URI). Copy `env.sample` to `.env` and supply at least `MONGODB_URI` and `JWT_SECRET`; set `OPENAI_API_KEY` to enable AI/vector features.
- Install dependencies once with `npm install`.
- Start the API locally via `npm run api` (reads `API_PORT` / `API_HOST`, defaults to `4000`/`0.0.0.0`). The vector update service auto-starts unless `ENABLE_VECTOR_SERVICE=false`.
- Launch the React app with `npm start`; it proxies API calls to `http://localhost:4000`.
- Available health checks: `GET /health`, `GET /metrics`, `GET /api/vector-service/health` once the API is running.
- Validation scripts (current quality gates): `npm run validate-auth` to ensure every route uses the centralized auth middleware, `npm run validate-endpoints` for route wiring sanity checks, and `npm run validate-all` to run both.
- Front-end tests use React Testing Library via `npm test`. There is no automated API test suite yet—add Jest/Supertest coverage under `api/__tests__/` when introducing new backend behaviors.

## Code conventions & style

- Follow the repository pattern: interact with data through subclasses of `core/BaseRepository` (`repositories/`), never directly from routes.
- All new routes must be Fastify plugins exported from `api/routes/*.js`, registered automatically by `core/RouteLoader`. Use `{ preHandler: requireAuth }` (or stricter variants) from `core/AuthMiddleware`.
- Keep filenames kebab-case for routes/middleware, PascalCase for classes, and avoid mixing export styles.
- Use `TenantContextFactory.fromRequest` and `RequestContextManager` to obtain tenant/user context; do not read tenant headers manually.
- Prefer structured logging with `core/Logger` (via `request.context.logger` or `logger.child`) instead of `console.log`.
- Soft deletes and audit fields are handled inside repositories—avoid duplicating timestamp/user tracking in route handlers.
- UI styling must source colors and gradients from the shared theme tokens (`hsl(var(--...))`, `useThemeColors`, design tokens) rather than hard-coded palettes so future branding updates remain centralized.

## Testing / quality gates

- Before merging backend changes, run `npm run validate-auth` and ensure it reports zero errors. Investigate warnings for public endpoints and document rationale if they must stay unauthenticated.
- Manually exercise critical flows (auth, tenant scoping, uploads) in addition to the automated smoke tests to cover edge cases that aren’t mocked.
- After modifying any backend files, lint them with `npx eslint <relative paths>` (or the equivalent npm script) and fix violations before submission.
- Run `npm run test:api` to execute the Jest/Supertest smoke suite whenever backend routes or middleware change.
- Keep an eye on edge cases: multi-tenant isolation (platform admin vs tenant admin), soft-deleted records, large payloads (file uploads up to 100 MB), and long-running vector updates.
- Front-end changes should continue to pass `npm test`; add component tests whenever adjusting forms that depend on API contracts.

## Pull request / commit guidelines

- PR titles: `[Area] concise summary` (e.g., `[API] Standardize auth middleware`). Commit messages should include a short subject plus “Why”/“How” details when touching core infrastructure.
- Each PR description should capture: problem statement, solution outline, validation steps (`npm run validate-auth`, manual checks, added tests), and any follow-up tasks.
- When modifying >200 backend lines or introducing new routes, attach a brief design sketch or sequence diagram explaining request flow, tenant scope, and repository usage.
- Keep diffs scoped—submit separate PRs for refactors versus feature work when possible.

## Exec plan / special conventions

- `PLAN.md` is the living exec plan. At task kick-off, fill in Goal, Context, Milestones, and initial Risks. Update Progress checkboxes and Decision Log as work advances.
- Log significant discoveries or blockers in the “Surprises & discoveries” section; reviewers rely on it for context.
- A task is “done” when `PLAN.md` shows all relevant milestones complete, required validations/tests have passed, documentation is updated, and outstanding risks are either mitigated or ticketed separately.

## Agent rules / constraints

- Prefer editing files within `api/`, `src/`, or docs. Do not delete or rewrite files outside the workspace without explicit instruction.
- Never commit secrets; use `.env` locally and keep example values generic.
- After touching any route or middleware, rerun `npm run validate-auth` and address failures before handing work off.
- Avoid direct mutations in `node_modules/` or generated assets; use scripts or configuration files instead.
- Coordinate with maintainers before altering legacy scripts under `api/scripts/` or introducing new background services.

## Known pitfalls & gotchas

- `TenantContextFactory` still falls back to an “anonymous default tenant” for unauthenticated traffic; in production `ENFORCE_AUTH` defaults to `true`, but be mindful of test environments.
- The realtime proxy (`routes/realtime.js`) is protected by `requireAuth`, yet it still forwards traffic directly to OpenAI; keep API keys locked down and disable the route when not needed.
- Vector update service can be resource-heavy—set `ENABLE_VECTOR_SERVICE=false` locally, and use the new `VECTOR_*` environment knobs to cap discovery/throughput before enabling it in production.
- Jest smoke tests stub repositories; when adding new routes, either extend the mocks or stand up dedicated fixtures so the suite remains reliable.

## Environment & secrets

- Copy `env.sample` → `.env` and provide real values for `MONGODB_URI`, `DATABASE_NAME` (optional override), `JWT_SECRET`, `OPENAI_API_KEY`, and any rate limit overrides. Never commit `.env`.
- Local dev uses `npm run api` (Fastify with nodemon-like reload not provided); production runs `NODE_ENV=production node api/server.js` or a process manager with the same env vars.
- File uploads and GridFS-backed storage require MongoDB; ensure the target database user has read/write and bucket permissions.
- Toggle AI/RAG features with `ENABLE_AI_RAG`. The vector service is off by default in dev; enable it selectively with `ENABLE_VECTOR_SERVICE=true` plus `VECTOR_ALLOWED_COLLECTIONS`, `VECTOR_MAX_COLLECTIONS`, and related knobs to keep load predictable.
- Set `ENFORCE_AUTH=true` for any shared or production environment so anonymous requests fail fast; it is auto-enabled when `NODE_ENV=production`.
