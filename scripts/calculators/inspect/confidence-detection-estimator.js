module.exports = {
  "id": "confidence-detection-estimator",
  "name": "Confidence of detection estimator",
  "description": "Combine evidence coverage, measurement density, and AI confidence",
  "category": "Evidence and confidence",
  "module": "inspect",
  "icon": "AimOutlined",
  "tags": [
    "confidence",
    "detection",
    "evidence",
    "ai"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Coverage, density, and AI confidence", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "coverage", "type": "group", "title": "Coverage & Density", "description": "Photo coverage and measurement density", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "photo_coverage_pct", "type": "number", "title": "Photo Coverage (%)", "label": "Photo Coverage (%)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "coverage", "defaultValue": 85 },
    { "id": "measurement_density", "type": "number", "title": "Measurement Density (per m²)", "label": "Measurement Density (per m²)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "coverage", "defaultValue": 2 },
    { "id": "ai_confidence_pct", "type": "number", "title": "AI Confidence (%)", "label": "AI Confidence (%)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "coverage", "defaultValue": 80 }
  ],
  "aiPrompt": "You are a QA statistician.\n\nContext: Confidence of detection — estimate overall confidence by combining photo coverage, measurement density, and AI confidence.\n\nTask: Provide a concise estimator limited strictly to:\n1) Composite confidence (%)\n2) Drivers\n3) Recommendations to improve confidence\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Confidence of Detection Estimate\n## Inputs\n## Method and Assumptions\n## Results\n- Composite Confidence\n- Drivers\n- Recommendations\n## References and Standards"
};