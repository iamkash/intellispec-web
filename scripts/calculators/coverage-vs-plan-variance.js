module.exports = {
  "id": "coverage-vs-plan-variance",
  "name": "Coverage vs plan variance",
  "description": "Compare planned vs actual areas, CMLs, and photos to spot shortfalls",
  "category": "Planning",
  "module": "inspect",
  "icon": "BarChartOutlined",
  "tags": [
    "coverage",
    "variance",
    "planning",
    "comparison"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter planned vs actuals", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "planned", "type": "group", "title": "Planned", "description": "Planned targets", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "plan_area", "type": "number", "title": "Planned Area", "label": "Planned Area", "required": false, "size": 8, "sectionId": "input-card", "groupId": "planned", "defaultValue": null },
    { "id": "plan_area_unit", "type": "select", "title": "Area Unit", "label": "Area Unit", "required": false, "size": 4, "sectionId": "input-card", "groupId": "planned", "defaultValue": "m2", "options": [ { "label": "m²", "value": "m2" }, { "label": "ft²", "value": "ft2" } ] },
    { "id": "plan_cmls", "type": "number", "title": "Planned CMLs", "label": "Planned CMLs", "required": false, "size": 6, "sectionId": "input-card", "groupId": "planned", "defaultValue": null },
    { "id": "plan_photos", "type": "number", "title": "Planned Photos", "label": "Planned Photos", "required": false, "size": 6, "sectionId": "input-card", "groupId": "planned", "defaultValue": null },

    { "id": "actuals", "type": "group", "title": "Actuals", "description": "Measured outcomes", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "act_area", "type": "number", "title": "Actual Area", "label": "Actual Area", "required": false, "size": 8, "sectionId": "input-card", "groupId": "actuals", "defaultValue": null },
    { "id": "act_area_unit", "type": "select", "title": "Area Unit", "label": "Area Unit", "required": false, "size": 4, "sectionId": "input-card", "groupId": "actuals", "defaultValue": "m2", "options": [ { "label": "m²", "value": "m2" }, { "label": "ft²", "value": "ft2" } ] },
    { "id": "act_cmls", "type": "number", "title": "Actual CMLs", "label": "Actual CMLs", "required": false, "size": 6, "sectionId": "input-card", "groupId": "actuals", "defaultValue": null },
    { "id": "act_photos", "type": "number", "title": "Actual Photos", "label": "Actual Photos", "required": false, "size": 6, "sectionId": "input-card", "groupId": "actuals", "defaultValue": null },

    { "id": "policy", "type": "group", "title": "Thresholds", "description": "Variance thresholds", "sectionId": "input-card", "order": 3, "size": 24, "collapsible": true },
    { "id": "area_variance_pct", "type": "number", "title": "Area Variance Threshold (%)", "label": "Area Variance Threshold (%)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "policy", "defaultValue": 10 },
    { "id": "cml_variance_pct", "type": "number", "title": "CML Variance Threshold (%)", "label": "CML Variance Threshold (%)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "policy", "defaultValue": 10 },
    { "id": "photo_variance_pct", "type": "number", "title": "Photo Variance Threshold (%)", "label": "Photo Variance Threshold (%)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "policy", "defaultValue": 10 }
  ],
  "aiPrompt": "You are an expert inspection planner.\n\nContext: Coverage vs plan — compare planned vs actual values and highlight shortfalls.\n\nTask: Provide a concise variance analysis limited strictly to:\n1) Variance for areas, CMLs, photos\n2) Which thresholds were exceeded\n3) Brief recommendations\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Coverage vs Plan Variance\n## Inputs\n## Method and Assumptions\n## Calculations\n- Variance by Metric\n- Threshold Exceedances\n## Summary Table\n(Use columns: Metric | Planned | Actual | Variance | Threshold | Status)\n## References and Standards"
};