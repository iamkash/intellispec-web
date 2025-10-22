module.exports = {
  "id": "gauge-uncertainty-budget",
  "name": "Gauge uncertainty budget",
  "description": "Evaluate UT uncertainty from device and operator factors",
  "category": "Measurements",
  "module": "inspect",
  "icon": "ExperimentOutlined",
  "tags": [
    "gauge",
    "uncertainty",
    "budget",
    "ut"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Device, operator, environment factors", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "device", "type": "group", "title": "Device", "description": "Resolution and calibration", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "resolution_mm", "type": "number", "title": "Resolution (mm)", "label": "Resolution (mm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "device", "defaultValue": 0.01 },
    { "id": "calibration_uncert_mm", "type": "number", "title": "Calibration Uncertainty (mm)", "label": "Calibration Uncertainty (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "device", "defaultValue": 0.02 },
    { "id": "operator", "type": "group", "title": "Operator", "description": "Repeatability and coupling", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "repeatability_mm", "type": "number", "title": "Repeatability (mm)", "label": "Repeatability (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "operator", "defaultValue": 0.03 },
    { "id": "couplant_variation_mm", "type": "number", "title": "Couplant Variation (mm)", "label": "Couplant Variation (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "operator", "defaultValue": 0.02 }
  ],
  "aiPrompt": "You are a metrology specialist.\n\nContext: Gauge uncertainty budget — combine device and operator factors to estimate total UT thickness measurement uncertainty.\n\nTask: Provide a concise budget limited strictly to:\n1) Components and combined uncertainty\n2) 95% confidence interval\n3) Notes/assumptions\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Gauge Uncertainty Budget\n## Inputs\n## Method and Assumptions\n## Calculations\n- Components\n- Combined Uncertainty\n- Confidence Interval\n## References and Standards"
};