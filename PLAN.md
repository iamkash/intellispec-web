# PLAN.md — Safety & Navigation Modernization Programme

## Executive Overview

The platform navigation refactor and safety portfolio uplift are now converged under a single modernisation programme. Our objectives are to (1) standardise routing and workspace metadata across every module, (2) deliver an enterprise-grade intelliSAFTEY experience that meets OSHA/NFPA expectations, and (3) provide repeatable guardrails so future teams can extend the system without bespoke wiring.

### Current Task — Wizard Framework Generalisation
- **Goal:** Establish a metadata-driven wizard framework so any domain (inspection, safety, compliance, etc.) can render and persist records without bespoke logic.
- **Context:** Existing AI Analysis wizard renderer and persistence hook embed defaults for safety workloads; upcoming pressure vessel and rescue pre-plan flows require a single generic pathway aligned to backup restore metadata contracts.
- **Milestones:**
  - [ ] Document required metadata contract for renderer, persistence, restore tooling, and workspace metadata.
- [x] Refactor `GenericWizardRenderer` to resolve all behaviour from metadata (domain, domainType, domainSubType, steps, hydration, persistence).
- [x] Refactor `useWizardRecordSave` and related utilities to rely entirely on metadata-provided endpoints and identifiers.
- [ ] Align wizard workspace JSON with new `identity` + `persistence` contracts and validate via eslint.
- [ ] Ship API support for wizard progress persistence via `PATCH` (CORS + route).
- **Progress:**
  - [x] Captured objectives/risks for wizard framework refactor in PLAN.md.
  - [x] Introduced runtime metadata guardrails inside `GenericWizardRenderer`.
  - [x] Hardened `useWizardRecordSave` to enforce endpoint + record id resolution contracts.
  - [x] Replaced backup restore script with manifest-driven loader to eliminate hardcoded collection logic.
  - [x] Audit all AI wizard workspaces for new metadata requirements.
- [x] Run eslint across touched surfaces (`GenericWizardRenderer`, `useWizardRecordSave`, restore tooling) and remediate.
- [x] Add audit entry once `PATCH /api/documents/:id` is live for progress saves.
- **Risks:** Metadata gaps may surface late, blocking runtime; existing safety wizards could regress if new contracts are misaligned.

## Programme Objectives

1. **Unified Navigation Platform**  
   Deploy a shared navigation provider, typed contracts, and validation tooling so menus, quick actions, and wizards behave consistently across modules.
2. **Workspace Hygiene & Governance**  
   Enforce `module/workspace` conventions, automate validation, and keep module menus, quick actions, and metadata in lockstep.
3. **Safety Command Excellence**  
   Replace the legacy Safety Command Center with the intelliSAFTEY module, delivering compliant wizards, a professional home, and auditable records.

## Status Dashboard

| Stream | Lead | State | Commentary |
| --- | --- | --- | --- |
| Navigation provider rollout | Platform Engineering | ✅ Complete | Provider + helpers live; adoption across core consumers complete. |
| Workspace normalization tooling | Platform Engineering | ✅ Complete | Scripts + validators shipped; CI integration pending. |
| intelliSAFTEY module launch | Safety Solutions | ✅ Complete | Home dashboard, menu, and metadata published. |
| Safety wizard compliance uplift | Safety Solutions | 🟡 In Progress | Metadata standardised; hazard-control gaps identified for remediation. |
| Documentation & enablement | Developer Experience | 🟡 In Progress | Draft navigation + safety authoring guides in review. |
| Regression & acceptance testing | QA Guild | 🔴 Not Started | Smoke passes required for intelliSAFTEY, Asset, Compliance, and System Admin modules. |

## Delivery Milestones

1. **Foundational Guardrails** *(Complete)*  
   - Inventory of all workspaces and enforcement of prefix convention.  
   - TypeScript definitions and validation scripts for navigation payloads.

2. **Navigation Platform Implementation** *(Complete)*  
   - `NavigationProvider` with routing, history, and helper utilities.  
   - Migration of menus, quick actions, forms, and CRUD handlers to the new provider.

3. **intelliSAFTEY Modernisation** *(Complete / Expanding)*  
   - Creation of the intelliSAFTEY module, menu, and inspection-style home workspace.  
   - Migration of every safety wizard with standardised `type`, `documentType`, and `label` metadata for filtering.

4. **Compliance Hardening & Enablement** *(Active)*  
   - Close OSHA 1910.146 / NFPA 350 data gaps (atmospheric testing, isolation/LOTO, ventilation, EMS coordination).  
   - Update checkbox schemas to use `{ label, value }` objects; broaden enumerations for rescue readiness.  
   - Publish navigation + safety authoring documentation and embed validators into CI.  
   - Execute regression plan and document results.

## Upcoming Actions

- [ ] Generalize AI Analysis wizard components to use neutral `domain` and `domainType` semantics (widget + gadget refactor in progress).  
- [ ] Extend the Rescue Pre-Plan wizard to capture atmospheric readings, isolation state, ventilation controls, retrieval systems, response time, and EMS/medical coordination.  
- [ ] Convert all remaining checkbox options to `{ label, value }` and curate safety-specific enumerations (rescue status, requirement types, communications).  
- [ ] Integrate `scripts/validate-workspaces.js` into CI and block merges on failure.  
- [ ] Run cross-module smoke tests (intelliSAFTEY, Asset Manager, Compliance Manager, System Admin) and log outcomes.  
- [ ] Publish navigation framework adoption guide and safety content authoring runbook.

## Decision Log

| Date | Decision | Rationale | Outcome |
| --- | --- | --- | --- |
| 2025-03-09 | Replace Safety Command Center with intelliSAFTEY module | Align safety workflows with the new navigation/metadata standards and branding | Module live with dedicated menu, home, and standardised wizards |
| 2025-03-09 | Enforce `type` / `documentType` metadata for safety wizards | Enable consistent filtering and downstream analytics for safety records | Metadata normalised across all intelliSAFTEY assets |

## Surprises & Discoveries

- OSHA/NFPA-required hazard controls were missing in the inherited Rescue Pre-Plan workflow; remediation is now prioritised.  
- Legacy checkbox fields still relied on string arrays, failing the shared workspace schema.  
- Rescue readiness terminology differed across tenants; a standard enumeration set is required for cross-tenant analytics.
- Wizard progress saves surfaced missing `PATCH /api/documents/:id` support; CORS now allows PATCH and route is implemented.

## Risks & Mitigation

- **Compliance Gaps** — Without complete hazard-control data, rescue plans may fail audits.  
  _Mitigation:_ Close identified gaps next sprint and obtain SME sign-off prior to GA.
- **Regression Exposure** — Teams outside the initial rollout may still call deprecated navigation helpers.  
  _Mitigation:_ Add lint rules, communicate timelines, and run focused smoke suites.
- **Schema Drift** — Manual JSON edits risk bypassing conventions.  
  _Mitigation:_ Enforce validation scripts via CI and pre-commit hooks.

## Completion Criteria

- Safety wizards capture all OSHA 1910.146 / NFPA 350 required data points, reviewed by safety SMEs.  
- Navigation provider adoption documented and legacy APIs retired.  
- CI enforces workspace validation, preventing schema regressions.  
- Regression suite passes for intelliSAFTEY, Asset Manager, Compliance Manager, and System Admin.  
- Enablement collateral published for engineering, product, and safety stakeholders.
