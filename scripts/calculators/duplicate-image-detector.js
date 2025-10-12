module.exports = {
  "id": "duplicate-image-detector",
  "name": "Duplicate image detector",
  "description": "Detect duplicate or near duplicate photos to clean evidence",
  "category": "Evidence and confidence",
  "module": "inspect",
  "icon": "CopyOutlined",
  "tags": [
    "duplicate",
    "image",
    "detector",
    "evidence",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload photos and set similarity threshold", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "photos", "type": "group", "title": "Photos", "description": "Images to compare", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "photo_batch", "type": "image-upload-with-drawing", "title": "Photo Batch", "label": "Photo Batch", "required": false, "size": 24, "sectionId": "input-card", "groupId": "photos", "props": { "accept": "image/*", "multiple": true, "maxCount": 200, "showThumbnails": true, "layout": "grid" } },
    { "id": "similarity_threshold", "type": "number", "title": "Similarity Threshold (0-1)", "label": "Similarity Threshold (0-1)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "photos", "defaultValue": 0.9 }
  ],
  "aiPrompt": "You are a photo curator.\n\nContext: Duplicate detection — identify duplicate or near-duplicate images using the provided threshold.\n\nTask: Provide a concise result limited strictly to:\n1) Duplicate sets/groups\n2) Representative keepers\n3) Deletion suggestions\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Duplicate Image Detection\n## Inputs\n## Method and Assumptions\n## Results\n- Duplicate Sets\n- Keepers\n- Suggestions\n## References and Standards"
};