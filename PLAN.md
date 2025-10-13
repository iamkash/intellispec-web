# plans.md — Exec Plan for Metadata-Driven Inspection Wizards

## Goal / End state

- Make the inspection workload grid and downstream AI wizards fully metadata-driven so routing, parameter mapping, and asset hydration require zero hard-coded fallbacks.
- Expose configuration knobs in workspace metadata (JSON) for wizard selection, URL param names, and asset fetch behavior that the UI consumes dynamically.
- Preserve backward compatibility during rollout while documenting the new schema requirements for workspace authors.

## Context & background

- The `inspection-plan/dashboard` grid currently resolves wizard workspaces via code (string comparisons and pattern fallbacks) instead of metadata.
- `GenericWizardRenderer` assumes query parameter names (`asset_id`) and a fixed `/api/documents` lookup, ignoring config fields that could supply these values.
- To support richer AI prompts and future workflows, metadata must carry every dependency so that configuration changes do not require React edits.

## Milestones & sub-tasks

1. **Discovery & spec**
   - [x] Enumerate current hardcoded assumptions in `SGridSearchGadget` and `GenericWizardRenderer`.
   - [x] Draft metadata schema additions for wizard mapping, URL param definitions, asset fetch contracts, and AI prompt contexts.
2. **Metadata schema updates**
   - [x] Update workspace JSON definitions (dashboard + wizards) to include the new fields with sensible defaults.
   - [ ] Add schema validation or linting hooks to flag missing required metadata.
3. **Runtime refactor**
   - [x] Refactor `SGridSearchGadget` to consume metadata-only routing with graceful fallback for legacy configs.
   - [x] Refactor `GenericWizardRenderer` (and related components) to honor metadata-driven asset fetch settings and param names.
4. **Verification & docs**
   - [ ] Backfill unit/interaction coverage or targeted tests for the new metadata pathways.
   - [ ] Document the updated metadata contract for workspace authors and note migration steps in PLAN.md.

## Progress & status

- [x] Discovery & spec complete
- [x] Metadata schema updates applied
- [x] Runtime refactor implemented
- [ ] Tests/docs updated

## Surprises & discoveries

- `npx tsc --noEmit` currently fails because of upstream `@types/d3-dispatch` typedef issues (already present pre-change); capture for follow-up when tightening type checks.

## Decision log

| Decision | Reasoning | Alternatives considered | Chosen option |
| -------- | --------- | ----------------------- | ------------- |
| Model wizard routing via `recordWorkspaceRouting` metadata | Consolidates workspace selection and pattern fallback into JSON so UI logic stays generic | Keep heuristic fallbacks in React; add more hard-coded cases over time | New `recordWorkspaceRouting` object with explicit mappings + pattern rules |
| Describe record fetch contract in metadata `request` object | Allows the wizard to hydrate without assuming `/api/documents` or specific query params | Continue hard-coding fetch URL/query in component | `recordDataPopulation.request` with templated query + `responseSelector` |

## Risks & mitigation

- **Risk:** Existing workspaces that lack new metadata could break routing.  
  **Mitigation:** Maintain backward-compatible defaults and log warnings when metadata is missing.
- **Risk:** Schema changes may outpace validation.  
  **Mitigation:** Add configuration validation (runtime or build-time) so issues surface early.
- **Risk:** Record fetch responses might not align with prompt needs.  
  **Mitigation:** Define a minimal required payload in documentation and implement defensive parsing in the wizard.

## Done criteria & verification

- Dashboard grid routes to the correct wizard using metadata only, with no string pattern fallbacks in code.
- Wizard reads asset ID and other context from metadata-defined params and fetch configuration.
- Tests or manual validation confirm both legacy and updated metadata continue to work.
- Plan updated with decisions, risks, and completion status; documentation instructs authors on new fields.
