# plans.md — Exec Plan for API Hardening & QA

## Goal / End state

- Lock down every Fastify route behind the centralized `core/AuthMiddleware` (or an intentional exception) so no endpoint is anonymously reachable by accident.
- Resolve code-level defects uncovered during the audit (missing imports, inconsistent middleware, brittle fallbacks).
- Establish repeatable quality checks (scripts + automated tests) that catch regressions before deploy.
- Document operational guardrails so future contributors can extend the API without reintroducing the observed gaps.

## Context & background

- `npm run validate-auth` flags 7 route files with missing or custom auth implementations (`documents`, `wizards`, `bulk-operations`, `tenant-data`, `admin-stats`, `realtime`, `auth-fastify`), plus multiple warnings for unguarded endpoints.
- Some routes still import `requireAuth` from `middleware/fastify-auth`, but that module exports `authenticateToken/verifySuperAdmin` only, leaving `preHandler` undefined at runtime.
- `wizards.js` throws `ReferenceError: APIError is not defined` on several branches because `APIError`/`ErrorTypes` are not imported.
- Default tenant context silently falls back to `anonymous/default-tenant`, which can hide missing authentication and produce confusing audit trails.
- There is no automated API regression suite; validation relies on scripts and manual testing, so security regressions can slip through.

## Milestones & sub-tasks

1. **Authentication baseline**
   - Replace legacy middleware imports with `core/AuthMiddleware` across `documents`, `wizards`, `bulk-operations`, `tenant-data`, and any remaining files.
   - Audit warning-only routes (admin stats, workflows, realtime, uploads, etc.) and either add guards or document intentional public access.
   - Remove bespoke auth helpers (`middleware/fastify-auth`, inline `requireAuth`) once replacements are in place.
2. **Error handling & code hygiene**
   - Fix missing imports/usages (e.g., `APIError` in `wizards.js`) and ensure every route uses the shared `ErrorHandler` utilities.
   - Review `TenantContextFactory` fallback behavior and decide whether to throw on missing auth or at least surface a clear warning.
3. **Quality gates & testing**
   - Introduce Jest/Supertest-based smoke tests covering login, a tenant-scoped GET, and a protected mutation.
   - Wire `npm run validate-auth`, `npm run validate-endpoints`, and the new tests into a CI workflow or pre-merge checklist.
4. **Observability & operations**
   - Confirm vector update service limits (collections monitored, retry policy) and add configuration toggles if needed.
   - Document operational runbooks for auth failures, rate limits, and background service restarts.

## Progress & status

- [x] Standardize `requireAuth` imports and remove `middleware/fastify-auth`.
- [x] Guard high-risk endpoints (`admin-stats`, `tenant-data`, `realtime`, uploads) or record accepted exposure.
- [x] Introduce API regression tests (auth + tenant scoping) and add them to the default test script.
- [x] Clarify/adjust `TenantContextFactory` fallback strategy and document expected behavior.
- [x] Review vector update service load characteristics and expose safe defaults in configuration.

## Surprises & discoveries

- Auth validation script is already available (`api/scripts/validate-auth-middleware.js`) but not part of routine workflows—ensure contributors run it.
- `tenant-scope` middleware assumes `request.user` is set; without preceding auth it 401s every call, so route order matters.
- The realtime proxy forwards binary frames directly to OpenAI; without auth, it effectively exposes a managed tunnel for any client.
- `hierarchy-search` relied on a non-existent `DocumentRepository.findAll`; patched to use `find` to avoid runtime failures.
- Only `/api/auth/*` and `/api/tenants/discover` remain intentionally unauthenticated; all other routes now pass `requireAuth` or stricter middleware.
- Jest smoke suite now mocks repositories/AuthService—extend the stubs when adding new protected endpoints so coverage stays meaningful.
- `ENFORCE_AUTH` is auto-enabled in production; remember to override in local scripts/tests when you intentionally exercise unauthenticated flows.

## Decision log

| Decision | Reasoning | Alternatives considered | Chosen option |
| -------- | --------- | ----------------------- | ------------- |
| Enforce `core/AuthMiddleware` usage project-wide | Single, audited implementation simplifies security review and metrics | Allow per-route auth helpers | Centralize on `core/AuthMiddleware` |
| Add API smoke tests before deeper refactors | Provides quick regression signal with minimal harness work | Rely solely on lint/validate scripts | Build Jest/Supertest smoke suite |

## Risks & mitigation

- **Risk:** Backwards-incompatible auth tightening could break existing clients.  
  **Mitigation:** Stage updates behind toggles, document new headers/scopes, and regression-test primary flows.
- **Risk:** Vector update service may overload MongoDB in production.  
  **Mitigation:** Limit watched collections, add opt-in flags, and monitor connection metrics.
- **Risk:** Lack of automated tests prolongs manual QA load.  
  **Mitigation:** Prioritize incremental smoke tests with each critical fix.

## Done criteria & verification

- `npm run validate-auth`, `npm run validate-endpoints`, and the new API smoke tests succeed locally and in CI.
- Code changes remove legacy auth helpers, add missing imports, and include doc updates describing the new guardrails.
- Authenticated endpoints return expected responses for tenant users and platform admins; unauthenticated calls receive 401/403.
- Operational docs outline toggles (`ENABLE_VECTOR_SERVICE`, `ENABLE_AI_RAG`) and recovery steps for background services.

## Future enhancements (out of scope now)

- Implement fine-grained RBAC with scoped permissions instead of boolean admin checks.
- Schedule automated penetration tests or integrate dependency scanning for the API.
- Introduce rate-limit tiers per tenant and hook metrics to alerting.
