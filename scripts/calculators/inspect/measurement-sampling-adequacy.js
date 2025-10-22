module.exports = {
  "id": "measurement-sampling-adequacy",
  "name": "Measurement sampling adequacy",
  "description": "Check if measurement count meets AQL or plan thresholds",
  "category": "Evidence and confidence",
  "module": "inspect",
  "icon": "BarChartOutlined",
  "tags": [
    "measurement",
    "sampling",
    "adequacy",
    "aql"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter measurement counts and thresholds", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "counts", "type": "group", "title": "Counts", "description": "Planned vs actual", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "planned_count", "type": "number", "title": "Planned Count", "label": "Planned Count", "required": true, "size": 8, "sectionId": "input-card", "groupId": "counts", "defaultValue": null },
    { "id": "actual_count", "type": "number", "title": "Actual Count", "label": "Actual Count", "required": true, "size": 8, "sectionId": "input-card", "groupId": "counts", "defaultValue": null },

    { "id": "thresholds", "type": "group", "title": "Thresholds", "description": "AQL or policy limits", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "aql_target", "type": "number", "title": "AQL Target (%)", "label": "AQL Target (%)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "thresholds", "defaultValue": 95 },
    { "id": "min_required", "type": "number", "title": "Minimum Required", "label": "Minimum Required", "required": false, "size": 8, "sectionId": "input-card", "groupId": "thresholds", "defaultValue": null }
  ],
  "aiPrompt": "You are a QA statistician.\n\nContext: Measurement sampling adequacy — assess whether the number of measurements meets plan/AQL thresholds.\n\nTask: Provide a concise assessment limited strictly to:\n1) Adequacy status vs thresholds\n2) Shortfall amount if inadequate\n3) Recommended additional samples\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Measurement Sampling Adequacy\n## Inputs\n## Method and Assumptions\n## Results\n- Adequacy\n- Shortfall\n- Recommendation\n## Summary Table\n(Use columns: Metric | Value | Threshold | Status | Notes)\n## References and Standards"
};