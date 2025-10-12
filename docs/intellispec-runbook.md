# IntelliSpec Platform Runbook

## At a Glance
- Multi-tenant inspection and AI workflow platform using a React/TypeScript frontend with a Fastify + MongoDB backend and LangGraph agent orchestration.
- Metadata-driven UI (workspaces, gadgets, forms) with centralized repositories, audit logging, and tenant isolation.
- AI capabilities: form assistant with voice/image/doc support, LangGraph workflows, AI-powered import column mapping, and vector embedding service.
- Framework components include centralized auth (`api/core/AuthMiddleware.js`), database management (`api/core/DatabaseManager.js`), structured logging, health checks, metrics, rate limiting, caching, and feature flags.

## Prerequisites
- Node.js ≥ 18 (16+ supported), npm; optional `pm2` and Docker.
- MongoDB Atlas cluster and database user.
- OpenAI account with API keys (chatbot, LangGraph, embeddings).
- Local ports: 3000 (CRA dev server) and 4000 (Fastify API).
- Tooling: Chrome DevTools, React DevTools Profiler recommended for performance debugging.

## Directory Landmarks
- `api/server.js` – Fastify bootstrapping, framework middleware registration, LangGraph initialization.
- `api/core/DatabaseManager.js` – Centralized Mongo connection manager with monitoring and graceful shutdown.
- `api/core/AuthMiddleware.js` – Canonical authentication/authorization middleware helpers.
- `api/middleware/tenant-scope.js`, `api/routes/platform-admin.js` – Tenant scoping and platform admin APIs.
- `api/workflows/factory/WorkflowFactory.js`, `api/workflows/agents` – Metadata-to-LangGraph compilation and agent implementations.
- `api/routes` – REST endpoints (documents, inspections, tenants, admin, uploads, workflows).
- `src/components/library/gadgets/forms/AIAgenticWizardGadget.tsx` – Dynamic wizard renderer.
- `src/utils/errorHandler.ts` – Front-end safe API call utilities and toast handling.
- `public/data/workspaces/**` – Metadata-driven workspace and gadget definitions.
- `scripts/seed-multi-tenant-data.js` – Multi-tenant seed script (UPSERT/clear modes).

## Configuration Checklist
1. Copy `env.sample` to `.env`.
2. Provide required values:
   - Core: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `PORT=4000`.
   - Frontend: `REACT_APP_API_BASE`, `REACT_APP_OPENAI_API_KEY`, optional `REACT_APP_OPENAI_BASE_URL`, `REACT_APP_OPENAI_TIMEOUT`, `REACT_APP_OPENAI_RETRIES`.
   - Backend AI: `OPENAI_API_KEY`, `ENABLE_AI_RAG`, `ENABLE_VECTOR_SERVICE` (`false` to disable), `EMBEDDING_MODEL`.
   - Database tuning: `DB_MAX_POOL_SIZE`, `DB_MIN_POOL_SIZE`, `DB_CONNECT_TIMEOUT`, `DB_SOCKET_TIMEOUT`, `DB_MAX_IDLE_TIME`, `DB_WAIT_QUEUE_TIMEOUT`, `DB_MAX_RETRY_ATTEMPTS`, `DB_MONITOR_INTERVAL`.
   - Rate limiting: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `LOGIN_RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_WINDOW_MS`.
   - Optional security: `BCRYPT_SALT_ROUNDS`, `MAX_LOGIN_ATTEMPTS`, `ACCOUNT_LOCKOUT_MINUTES`.
3. Restart both servers whenever `.env` values change.

### API Configuration Framework
- Ensure `REACT_APP_API_BASE` matches the Fastify port (usually `http://localhost:4000`).
- Wrap the top-level app in `ApiConfigDiagnostics` (`src/components/diagnostics/ApiConfigDiagnostics.tsx`) to surface startup warnings.
- After changing API base, clear caches: `rm -rf node_modules/.cache` and in browser console run `localStorage.clear(); sessionStorage.clear(); location.reload();`.
- Verify with `window.__API_CONFIG__.getDebugInfo()` and confirm diagnostics report port 4000.

## Running the Platform
- Install dependencies: `npm install`.
- Start API: `npm run api` (Fastify, LangGraph, metrics, vector service).
- Start frontend: `npm start` (CRA dev server on `http://localhost:3000`).
- Production server: `NODE_ENV=production node api/server.js` or `pm2 start api/server.js --name intellispec-api`.
- Docker: `docker build -t intellispec-api .` then `docker run -p 4000:4000 --env-file .env intellispec-api`.

### Health & Observability
- Health probes: `GET /health`, `/ready`, `/alive`.
- Metrics: `GET /metrics` (Prometheus format).
- Vector service (when enabled): `GET /api/vector-service/health`, `/api/vector-service/metrics`.
- Audit trail: `db.audit_events.find().sort({ timestamp: -1 }).limit(10)` in Mongo shell.
- Logs: Winston structured logging with request context; DatabaseManager prints connection metrics; vector service logs startup status.

### Database Manager Expectations (`api/core/DatabaseManager.js`)
- Singleton managing Mongoose and native Mongo clients with retry (default 5 attempts, exponential backoff).
- Pool monitoring (active/available connections), leak detection, utilization alerts, configurable intervals.
- `DatabaseManager.getMetrics()` exposes totals, uptime, error counts.
- Graceful shutdown closes pools and stops monitoring timers.

## Data Bootstrapping & Scripts
- Seed tenants/users/modules via safe UPSERT: `node scripts/seed-multi-tenant-data.js`.
- Destructive reset: `node scripts/seed-multi-tenant-data.js --clear` (wipes and recreates).
- Seed standalone super admin: `npm run seed:superadmin`.
- Validation commands (`package.json`):
  - `npm run validate-auth` – Confirms all routes import framework auth middleware.
  - `npm run migrate-auth` – Rewrites legacy auth usage to centralized helpers.
  - `npm run validate-endpoints` – Ensures endpoint registration coverage.
  - `npm run validate-workspaces` – Checks workspace metadata integrity.
  - `npm run check-field-mappings` – Prints supported document field mappings.
  - `npm run validate-all` – Runs auth and endpoint validations together.

## Authentication & Authorization
- Centralize all auth checks through `api/core/AuthMiddleware.js`; available helpers: `requireAuth`, `requirePlatformAdmin`, `requireTenantAdmin`, `optionalAuth`, `requirePermission(...)`, `combineMiddleware(...)`.
- JWT contains `platformRole`, tenant identifiers, and permissions; no route should manually verify JWTs or query for platform role.
- Use `npm run migrate-auth` and `npm run validate-auth` to keep routes compliant.
- Frontend error handling via `src/utils/errorHandler.ts` (`safeApiCall`, `useErrorHandler`) yields user-friendly notifications and auth redirects.

### Platform Admin Experience
- Users with `platformRole: 'platform_admin'` (for example `superadmin@pksti.com`, `super_admin@intellispec.com`) bypass tenant memberships and access `/api/platform/*`.
- `api/middleware/platform-admin.js` enforces platform-only routes; `api/routes/platform-admin.js` manages tenants, organizations, and global statistics.
- Login responses include `isPlatformAdmin` for middleware; tenant discovery endpoint returns all active tenants to platform admins.

### Tenant Admin Creation
- `POST /api/tenants/create-with-admin` (`api/routes/tenant-creation.js`) runs a Mongo transaction that creates tenant, admin user (with password confirmation), membership, subscription, entitlements, and audit events.
- Tenant form metadata `public/data/workspaces/system-admin/tenant-document.json` captures admin credentials; passwords must be ≥ 8 characters.
- Tenant admin inherits `tenant_admin` role and gains scoped access immediately.

### Tenant Scope Enforcement
- `api/middleware/tenant-scope.js` automatically filters queries by allowed tenants; platform admins set `request.tenantScoped = false`.
- Repositories append `tenantId`, timestamps, and user attribution; audit trail records every mutation.

## Multi-Tenant Operations
- Architecture: organizations → tenants → entitlements → memberships; modules gate feature access (`inspect`, `paint`, etc.).
- Tenant & platform endpoints (`api/routes/tenants.js`, `api/routes/platform-admin.js`):
  - `GET/POST /api/admin/tenants`, `GET /api/admin/tenants/:id`, `POST /api/admin/tenants/:id/suspend|resume`.
  - Entitlements: `GET /api/admin/tenants/:id/entitlements`, `POST /api/admin/tenants/:id/entitlements`, history endpoints.
  - Subscriptions: `GET/POST /api/admin/tenants/:id/subscription`, `/extend`.
  - Memberships: `GET/POST /api/admin/memberships`, `GET /api/me/memberships`, `POST /api/auth/switch-tenant`.
- Subscription lifecycle automation transitions tenants through trial → active → grace → expired; background tasks enforce grace periods and notifications.
- Admin dashboard gadgets expect:
  - `GET /api/admin/system/stats` (`api/routes/admin-stats.js`) to populate KPI cards.
  - `GET /api/audit-logs` for recent activity.
  - Quick actions configured via `actionPanelWidget.config.actions` with `hideWrapper: true` to remove card chrome.

## Workflows & AI Systems
- Metadata-driven workflows compile via `api/workflows/factory/WorkflowFactory.js`, `api/workflows/agents`, and `api/workflows/factory/ConnectionBuilder.js`; executions tracked in `api/workflows/ExecutionRepository`.
- Core endpoints (`/api` base):
  - `GET /api/` list workflows, `POST /api/` create, `GET /api/:id`, `PUT /api/:id`, `DELETE /api/:id`, `POST /api/:id/execute`, `GET /api/:id/executions`.
- Agents (e.g., `api/workflows/agents/DataAggregatorAgent.js`) safe-evaluate expressions (no `new Function`) and collect metrics.
- Frontend wizard (`src/components/library/gadgets/forms/AIAgenticWizardGadget.tsx`) renders metadata-defined steps, supports 20+ widgets, observation checklists, and dynamic validation.
- LangGraph integrates GPT-5/OpenAI Realtime sessions for multimodal interactions, semantic VAD, voice variety, and safety escalations.

### AI Assistant (Form Chatbot)
- Configured per workspace metadata (`aiAssistant` block) and rendered via `AIChatbotWidget`.
- Capabilities: schema-aware guidance, voice transcription (Whisper), image/document analysis, auto-fill, progress tracking.
- Environment: `REACT_APP_OPENAI_API_KEY` required; optional base URL/timeouts in `.env`.
- Troubleshooting: ensure `aiAssistant.enabled` is true, OpenAI key present, microphone permissions granted; check browser console for errors.

### Vector Embedding Service
- Controlled with `ENABLE_VECTOR_SERVICE`; defaults to enabled.
- Startup logs:
  - Success: `Vector Update Service started successfully` with embedding model, health/metrics endpoints.
  - Disabled: `Vector Update Service disabled` with reason.
  - Failure: `Failed to start Vector Update Service` (missing API key, database health, OpenAI error).
- Production (`NODE_ENV=production`) emits 60-second metric summaries (uptime, documents processed, errors, pending updates); enable monitoring in development by passing `monitoring: true` when instantiating the service.

### AI Column Mapping & Imports
- Asset import gadget auto-maps 80–90% of columns using semantic matching, fuzzy logic, and historical learning.
- Import modes: Create, Update, Upsert; supports large Excel files with validation (required fields, relationships, duplicates, hierarchy).
- Export templates first, prepare spreadsheets with required IDs (`code`, `asset_group_id`, `site_id`, `company_id`, etc.), upload, review AI mappings, adjust unmapped columns.
- Relationship fields require lookups (e.g., site/unit codes); classification fields copy directly (see `Lookup vs Reference Data` guidance built into tooling).
- All import/export operations produce audit events with user attribution.

## Data Management & Repositories
- `DocumentRepository` and `InspectionRepository` provide tenant-scoped CRUD, automatic `type` population, audit logging, soft deletes, timestamp management.
- `api/routes/documents.js`, `api/routes/inspections.js`, and wizard routes rely on repository helpers and consistent error handling.
- GridFS integration (`api/middleware/gridfs.js`, `api/routes/uploads.js`, `src/components/library/widgets/input/ImageUploadWithDrawingWidget.tsx`) manages inspection assets with streaming upload/download.
- Frontend error handling uses `safeApiCall`/`useErrorHandler` to produce consistent toasts, redirect on auth issues, and log diagnostics in development.

## Validation, QA & Performance
- Workspace validation rules enforce `filterContext`, correct `fieldMappings`, select/multiselect `labelField` + `valueField`, and required metadata; run `npm run validate-workspaces` before shipping metadata changes.
- Performance profiling for calculator gadgets:
  - Inspect `[PERF]` console logs (render counts, handler durations).
  - Use React DevTools Profiler and Chrome Performance tab to isolate expensive renders.
  - Cache heavy computations (e.g., gadget options), batch state updates, and memoize child components when renders exceed ~300–500 ms.
- API configuration troubleshooting: restart both servers, clear caches, verify diagnostics output, ensure `.env` contains correct base URL.

## Troubleshooting Playbook
- **APIs hitting wrong port**: confirm `REACT_APP_API_BASE`, re-run diagnostics, clear caches.
- **Vector service start failure**: verify `OPENAI_API_KEY`, database health (DatabaseManager `healthCheck()`), and inspect stack trace logged with `Failed to start Vector Update Service`.
- **Admin dashboard shows N/A**: ensure `api/routes/admin-stats.js` and `api/routes/audit-logs.js` deployed, gadget quick actions use flat `config.actions`, and API responses include expected shapes.
- **Auth regressions**: run `npm run validate-auth`, ensure routes import from `api/core/AuthMiddleware.js`, avoid custom JWT verification.
- **Import lookups failing**: check that related documents (company/site/asset group) exist; run seed script in UPSERT mode to refresh reference data.

## Default Accounts & Access
- Platform super admin: `superadmin@pksti.com` / `Admin@12345` (access to all tenants).
- HF Sinclair tenant admin: `admin@hfsinclair.com` / `password123`.
- Seed data adds organizations, tenants, subscriptions, entitlements, and sample users; rotate passwords via tenant management UI or API as needed.

## Key API Surface (non-exhaustive)
- Auth: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `POST /api/auth/switch-tenant`.
- Tenant/platform: `/api/platform/tenants`, `/api/platform/stats`, `/api/admin/tenants`, `/api/admin/organizations`, `/api/admin/memberships`.
- Workflows: `/api/`, `/api/:id`, `/api/:id/execute`, `/api/:id/executions`.
- Documents & inspections: `/api/documents`, `/api/inspections`, `/api/tenant-data/*`.
- Utilities: `/api/uploads/*` (GridFS), `/api/admin/system/stats`, `/api/audit-logs`, `/metrics`, `/health`.

## Change Control
- Run validation scripts (`validate-auth`, `validate-endpoints`, `validate-workspaces`) before deployment.
- Monitor `/metrics` and Mongo `tenant_usage` to spot anomalies.
- Use `audit_events` as the compliance source of record for all CRUD activity.

---

Use this runbook as the canonical reference; the previous root-level markdown reports have been consolidated here.
