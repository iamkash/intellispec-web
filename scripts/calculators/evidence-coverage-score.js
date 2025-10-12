module.exports = {
  "id": "evidence-coverage-score",
  "name": "Evidence coverage score",
  "description": "Score coverage of required photo tags and areas inspected",
  "category": "Evidence and confidence",
  "module": "inspect",
  "icon": "CheckSquareOutlined",
  "tags": [
    "evidence",
    "coverage",
    "score",
    "photo",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter planned requirements and actuals", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "planned", "type": "group", "title": "Planned Requirements", "description": "Targets by tags/areas", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "required_tags_count", "type": "number", "title": "Required Tag Types", "label": "Required Tag Types", "required": false, "size": 8, "sectionId": "input-card", "groupId": "planned", "defaultValue": null },
    { "id": "required_areas_count", "type": "number", "title": "Required Areas", "label": "Required Areas", "required": false, "size": 8, "sectionId": "input-card", "groupId": "planned", "defaultValue": null },
    { "id": "min_coverage_pct", "type": "number", "title": "Min Coverage (%)", "label": "Min Coverage (%)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "planned", "defaultValue": 90 },

    { "id": "actuals", "type": "group", "title": "Actuals", "description": "Detected tags/areas", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "detected_tags_count", "type": "number", "title": "Detected Tag Types", "label": "Detected Tag Types", "required": false, "size": 8, "sectionId": "input-card", "groupId": "actuals", "defaultValue": null },
    { "id": "covered_areas_count", "type": "number", "title": "Covered Areas", "label": "Covered Areas", "required": false, "size": 8, "sectionId": "input-card", "groupId": "actuals", "defaultValue": null },
    { "id": "photos", "type": "group", "title": "Evidence Photos (Optional)", "description": "All photos taken for coverage check", "sectionId": "input-card", "order": 3, "size": 24, "collapsible": true },
    { "id": "evidence_photos", "type": "image-upload-with-drawing", "title": "Evidence Photos", "label": "Evidence Photos", "required": false, "size": 24, "sectionId": "input-card", "groupId": "photos", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are an evidence QA analyst.\n\nContext: Evidence coverage — compute coverage vs planned tag/area targets using BOTH plan inputs and any uploaded evidence photos.\n\nRules:\n- From images, infer tag types/areas covered where possible (without guessing beyond visible metadata).\n- Treat missing/default inputs as unknown; do not assume.\n- Reconcile image-derived coverage vs entered counts; highlight gaps and retakes.\n\nTask: Provide a concise assessment limited strictly to:\n1) Coverage percent vs minimum\n2) Shortfalls by category\n3) Recommended gap closes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Evidence Coverage Score\n## Inputs\n## Method and Assumptions\n## Evidence Reconciliation\nTable: Category | From Images | From Inputs | Final Used | Notes\n## Results\n- Coverage Percent\n- Shortfalls\n- Recommendations\n## Summary Table\n(Use columns: Metric | Planned | Actual | Coverage | Threshold | Status)\n## References and Standards"
};