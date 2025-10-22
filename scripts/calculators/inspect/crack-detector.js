module.exports = {
  "id": "crack-detector",
  "name": "Crack detector",
  "description": "Detect visible cracks and estimate severity from images",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "DeploymentUnitOutlined",
  "tags": ["crack", "detector", "vision"],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload images for analysis", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "images", "type": "group", "title": "Images", "description": "Closeups and orthogonal shots", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "crack_photos", "type": "image-upload-with-drawing", "title": "Crack Photos", "label": "Crack Photos", "required": true, "size": 24, "sectionId": "input-card", "groupId": "images", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a defect triage specialist.\n\nGoal: Identify visible cracks and estimate qualitative severity.\n\nInstructions:\n- Flag potential cracks with IDs.\n- For each: describe length/branching qualitatively, orientation, likely initiation features, and severity (low/medium/high).\n- Note any legibility limits.\n\nOutput ONLY:\n\n# Crack Detector\n## Inputs\n## Findings Table\nColumns: ID | Description | Orientation | Severity | Confidence | Notes\n## Summary\n- Count\n- Highest severity\n- Next actions\n## References and Standards"
};


