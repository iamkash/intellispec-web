module.exports = {
  "id": "corrosion-detector",
  "name": "Corrosion detector",
  "description": "Detect surface corrosion indications from uploaded images and summarize severity",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "AlertOutlined",
  "tags": ["corrosion", "detector", "vision"],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload images for analysis", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "images", "type": "group", "title": "Images", "description": "Closeups and context shots", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "corrosion_photos", "type": "image-upload-with-drawing", "title": "Corrosion Photos", "label": "Corrosion Photos", "required": true, "size": 24, "sectionId": "input-card", "groupId": "images", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a corrosion analyst.\n\nGoal: Detect and summarize corrosion indications from the provided images.\n\nInstructions:\n- Identify and list distinct indications (ID each).\n- For each: classify type (uniform/pitting/crevice/underfilm/rust stain), estimate affected area/extent (qualitative), and severity (low/medium/high).\n- Note confidence and any legibility issues (blur/glare/shadow).\n- Do not infer beyond what is visible.\n\nOutput ONLY:\n\n# Corrosion Detector\n## Inputs\n## Findings Table\nColumns: ID | Type | Severity | Extent | Confidence | Notes\n## Summary\n- Indication count\n- Highest severity\n- Suggested follow-ups\n## References and Standards"
};


