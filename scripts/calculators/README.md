### Calculators: Status and Implementation Guide

This folder contains calculator metadata modules used by the DynamicCalculatorGadget. Every calculator is defined entirely by metadata (no business logic in code) and follows the flat uiDefinition schema standard.

---

### Schema Standard (MANDATORY)

- uiDefinition is a single flat array of items:
  - Section: `{ id, type: 'section', title, description?, icon?, order?, size }`
  - Group: `{ id, type: 'group', title, description?, sectionId, order?, size, collapsible?, watchField?, showWhen?, showOnMatch? }`
  - Field: `{ id, type, label/title, sectionId, groupId, size, defaultValue?, placeholder?, required?, options?, watchField?, showWhen?, showOnMatch? }`
- Use `watchField` + `showWhen` (comma-separated values allowed) for conditional visibility.
- Prefer 24-grid sizing. Examples: 12+12, 8+8+8, 6+6+6+6.
- Scope inputs pattern (when applicable): `scope_basis` + `scope_unit_*` (filtered by basis) + `scope_size` + `scope_meaning`.
- The gadget auto-injects an `additional_context` textarea if not provided.
- Prompts are concise, domain-agnostic, and define outputs strictly (sections/tables only) — formatting rules are injected by the gadget.

---

### Progress Tracker

- Completed calculators: 50/50 (image-capable calculators tagged with `vision`)
- Remaining calculators: 0
- Percent complete: 100%

---

### Current Status

- Detailed (inputs + prompt migrated to flat schema):
  - `inspection-duration-estimator.js`
  - `scope-sizing.js`
  - `sampling-plan-cmls.js`
  - `route-time-estimator.js`
  - `crew-productivity-planner.js`
  - `device-battery-plan.js`
  - `permit-coordination-inspection.js`
  - `coverage-vs-plan-variance.js`
  - `access-method-selector.js`
  - `drone-flight-segment-coverage.js`
  - `tooling-checklist-generator.js`
  - `redline-delta-counter.js`
  - `photo-quality-gate.js`
  - `lighting-adequacy-check.js`
  - `dew-point-condensation-risk.js`
  - `storage-upload-time-estimator.js`
  - `geotag-timestamp-sanity-check.js`
  - `anomaly-clustering-helper.js`
  - `hold-witness-coverage-checker.js`
  - `report-completeness-score.js`
  - `repair-method-recommender.js`
  - `severity-priority-mapper.js`
  - `measurement-sampling-adequacy.js`
  - `duplicate-image-detector.js`
  - `evidence-coverage-score.js`
  - `nameplate-ocr-confidence.js`
  - `image-scale-calibration.js`
  - `torque-witness-quick-check.js`
  - `holiday-test-voltage-selector.js`
  - `corrosion-rate-remaining-life.js`
  - `ut-grid-stats-thin-point-finder.js`
  - `photo-pose-guide-recommender.js`
  - `flange-gasket-risk-quick-check.js`
  - `support-condition-index.js`
  - `insulation-condition-index.js`
  - `coating-condition-score.js`
  - `general-condition-index.js`
  - `corrosion-severity-class.js`
  - `leak-severity-rank.js`
  - `cui-quick-screen.js`
  - `ambient-window-coating-touchup.js`
  - `wind-window-drone-rope-access.js`
  - `salt-spray-risk.js`
  - `ut-grid-size-helper.js`
  - `surface-profile-acceptance.js`
  - `dft-statistics-coatings.js`
  - `gauge-uncertainty-budget.js`
  - `visual-revisit-interval.js`
  - `confidence-detection-estimator.js`
  - `surface-salt-contamination-estimate.js`

- Stub (metadata header only; needs detailed inputs + prompt):
  - None (all calculators completed)

---

### Implementation Checklist (per calculator)

1) Define one section and one or more groups (collapsed if advanced). Example:
```json
{ "id": "input-card", "type": "section", "title": "Input Parameters", "icon": "FormOutlined", "order": 1, "size": 24 }
{ "id": "general-inputs", "type": "group", "title": "General Inputs", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false }
```
2) Add fields under groups. Use `watchField`/`showWhen` for conditional variants (e.g., asset-specific details). Example:
```json
{ "id": "asset_type", "type": "select", "label": "Asset Type", "sectionId": "input-card", "groupId": "general-inputs", "size": 12, "options": [{"label":"Piping","value":"piping"}] }
{ "id": "piping-params", "type": "group", "title": "Piping Parameters", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true, "watchField": "asset_type", "showWhen": "piping,pipeline" }
```
3) When scope is involved, add the basis/unit pattern:
```json
{ "id": "scope_basis", "type": "select", "label": "Scope Basis", "sectionId": "input-card", "groupId": "general-inputs", "size": 8, "defaultValue": "surface_area", "options": [ {"label":"Surface area","value":"surface_area"}, {"label":"Linear length","value":"linear_length"} ] }
{ "id": "scope_unit_linear", "type": "select", "label": "Scope Unit", "sectionId": "input-card", "groupId": "general-inputs", "size": 4, "options": [{"label":"m","value":"m"},{"label":"ft","value":"ft"}], "watchField": "scope_basis", "showWhen": "linear_length" }
{ "id": "scope_size", "type": "number", "label": "Scope Size (units)", "sectionId": "input-card", "groupId": "general-inputs", "size": 4 }
{ "id": "scope_meaning", "type": "text", "label": "Scope Meaning (hint)", "sectionId": "input-card", "groupId": "general-inputs", "size": 12 }
```
4) Write a concise AI prompt that names the calculator and constrains outputs strictly to required sections. Avoid hardcoded business logic; use generic language.

---

### Image Support Guidance

- Prefer `image-upload-with-drawing` for photo inputs (multi-image support, thumbnails, clientOnly data URLs).
- All image-based calculators must include the `vision` tag for discovery and filtering.
- The framework compresses data URLs client-side (≤1536px, JPEG ~0.8) and passes them via the Responses API as `input_image` parts.
- The gadget injects images automatically when present in form data (no prompt embedding of base64).

Vision prompt conventions (apply to all vision calculators):
- Always state that BOTH images and inputs are used; do not assume defaults.
- Treat missing/default inputs as unknown; do not invent values.
- If images conflict with user inputs, include an Evidence Reconciliation table with columns:
  - Indicator | From Images | From Inputs | Final Used | Notes
- Require valid Markdown tables for findings/recommendations (no code fences, exact headers).

Current calculators with image inputs and `vision` tag:
- duplicate-image-detector (photos)
- photo-quality-gate (sample_photos)
- image-scale-calibration (reference_image)
- nameplate-ocr-confidence (nameplate_images)
- cui-quick-screen (cui_photos)
- flange-gasket-risk-quick-check (flange_photos)
- coating-condition-score (coating_photos)
- evidence-coverage-score (evidence_photos)
- repair-method-recommender (defect_photo)
- dew-point-condensation-risk (dew_photos)
- corrosion-detector (corrosion_photos)
- weld-anomaly-detector (weld_photos)
- crack-detector (crack_photos)
- anomaly-detector-and-recommender (anomaly_photos)

Planned additions (vision):
- corrosion-detector
- weld-anomaly-detector
- crack-detector
- anomaly-detector-and-recommender

---

### Detailed Inputs for Accurate Responses

When designing inputs, include the minimal set that allows unambiguous calculations and clear assumptions. Typical categories to consider:

- Scope definition: `scope_basis`, filtered `scope_unit_*`, `scope_size`, `scope_meaning`.
- Asset specificity: conditional groups by `asset_type` (e.g., tank geometry, piping NPS/fittings, vessel diameter/height/nozzles).
- Environment & material: `temperature_band`, `insulation_present`, `service_corrosivity`, `phase`, `coating_condition`, `external_exposure`.
- Risk & policy: `risk_class`, `corrosion_circuit`, `code_basis`, `accessibility_complexity`, baselines.
- Productivity/rates: task times, walking speed, fixed overheads, crew size.
- Evidence/media: photo/video counts and bitrates; for image-based calculators use `upload` and `image/*` accept filters.
- Network/device: upload bandwidth, utilization, battery capacity/consumption.

Use the appropriate widgets from `src/components/library/widgets/input` (e.g., `UploadWidget`, `ImageUploadWithDrawingWidget`, `CameraWidget`, `AudioRecorderWidget`) to capture images, drawings, voice notes, and documents where relevant.

---

### Prompt Template (copy, then tailor)

```text
You are an expert inspection planner.

Context: <short calculator context>.

Task: Using only the inputs above, produce a concise output limited strictly to:
1) <expected output 1>
2) <expected output 2>
...

Output a professional Markdown report with ONLY these sections:

# <Calculator Title>
## Inputs
## Method and Assumptions
## Calculations
- <bullet 1>
- <bullet 2>
## Summary Table
(Use columns: Metric | Value | Units | Rationale)
## References and Standards
```

---

### Notes

- Keep options and units minimal but clear. Prefer conditional groups over branching prompts.
- Do not introduce costs, resources, or schedules unless explicitly part of the calculator’s scope.
- The gadget prepends a normalized input summary (human + JSON) to the prompt to ensure all values are considered.

---

 
