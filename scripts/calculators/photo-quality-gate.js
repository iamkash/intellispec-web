module.exports = {
  "id": "photo-quality-gate",
  "name": "Photo quality gate",
  "description": "Flag blurry, overexposed, or glare affected photos for retake",
  "category": "Evidence and confidence",
  "module": "inspect",
  "icon": "EyeInvisibleOutlined",
  "tags": [
    "photo",
    "quality",
    "gate",
    "retake",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload samples and set thresholds", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "samples", "type": "group", "title": "Photo Samples", "description": "Images to screen", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "sample_photos", "type": "image-upload-with-drawing", "title": "Sample Photos", "label": "Sample Photos", "required": false, "size": 24, "sectionId": "input-card", "groupId": "samples", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } },

    { "id": "thresholds", "type": "group", "title": "Quality Thresholds", "description": "Blur, exposure, glare", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "blur_sigma_max", "type": "number", "title": "Max Blur (σ)", "label": "Max Blur (σ)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "thresholds", "defaultValue": 1.5 },
    { "id": "overexposed_pct_max", "type": "number", "title": "Max Overexposed (%)", "label": "Max Overexposed (%)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "thresholds", "defaultValue": 10 },
    { "id": "glare_score_max", "type": "number", "title": "Max Glare Score", "label": "Max Glare Score", "required": false, "size": 8, "sectionId": "input-card", "groupId": "thresholds", "defaultValue": 0.4 },
    { "id": "backlight_present", "type": "switch", "title": "Backlight Present", "label": "Backlight Present", "required": false, "size": 8, "sectionId": "input-card", "groupId": "thresholds", "defaultValue": false }
  ],
  "aiPrompt": "You are a photo QA reviewer.\n\nContext: Photo quality gate — screen images for blur, exposure, and glare against thresholds.\n\nTask: Provide a concise gate decision limited strictly to:\n1) Pass/Fail per metric with notes\n2) Retake guidance\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Photo Quality Gate\n## Inputs\n## Method and Assumptions\n## Results\n- Blur\n- Exposure\n- Glare/Backlight\n## Summary Table\n(Use columns: Metric | Measured | Threshold | Status | Notes)\n## References and Standards"
};