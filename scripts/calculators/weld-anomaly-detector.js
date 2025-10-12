module.exports = {
  "id": "weld-anomaly-detector",
  "name": "Weld anomaly detector",
  "description": "Detect visible weld anomalies (porosity, undercut, lack of fusion, cracks)",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "ScissorOutlined",
  "tags": ["weld", "anomaly", "detector", "vision"],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload weld photos for analysis", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "images", "type": "group", "title": "Images", "description": "Weld seam closeups", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "weld_photos", "type": "image-upload-with-drawing", "title": "Weld Photos", "label": "Weld Photos", "required": true, "size": 24, "sectionId": "input-card", "groupId": "images", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a welding QA specialist.\n\nGoal: Detect and describe visible weld anomalies in the provided images.\n\nInstructions:\n- For each image, list any anomalies observed (porosity, undercut, overlap, lack of fusion/penetration, crack).\n- Estimate severity qualitatively (low/medium/high) and note legibility issues.\n- Do not infer internal discontinuities beyond visual evidence.\n\nOutput ONLY:\n\n# Weld Anomaly Detector\n## Inputs\n## Findings Table\nColumns: Image | Anomaly | Severity | Confidence | Notes\n## Summary\n- Images with findings\n- Highest severity\n- Recommended follow-ups\n## References and Standards"
};


