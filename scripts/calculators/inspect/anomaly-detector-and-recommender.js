module.exports = {
  "id": "anomaly-detector-and-recommender",
  "name": "Anomaly detector and recommender",
  "description": "Detect visual anomalies and recommend next actions with rationale",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "RobotOutlined",
  "tags": ["anomaly", "detector", "recommender", "vision"],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload images for analysis", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "images", "type": "group", "title": "Images", "description": "Context and closeups", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "anomaly_photos", "type": "image-upload-with-drawing", "title": "Anomaly Photos", "label": "Anomaly Photos", "required": true, "size": 24, "sectionId": "input-card", "groupId": "images", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a visual anomaly analyst.\n\nGoal: Detect visual anomalies (corrosion, leaks, coating damage, cracks, support issues) and recommend next actions with justifications and references.\n\nInstructions:\n- For each image, list anomalies with severity and confidence.\n- Provide a consolidated recommendation list (P1–P4) with rationale and brief reference tags (e.g., API 510/570/653, SSPC).\n- Do not speculate beyond visual evidence.\n\nStrict formatting rules:\n- Use valid Markdown tables for both Findings and Recommendations (no bullet lists).\n- Do not wrap tables in code fences.\n- Use the exact column headers as specified.\n\nOutput ONLY:\n\n# Anomaly Detector and Recommender\n## Inputs\n## Findings Table\nColumns: Image | Anomaly | Severity | Confidence | Notes\n## Recommendations Table\nColumns: Priority | Action | Rationale | Reference\n## References and Standards"
};


