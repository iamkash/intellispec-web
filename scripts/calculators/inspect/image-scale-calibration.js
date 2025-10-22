module.exports = {
  "id": "image-scale-calibration",
  "name": "Image scale calibration",
  "description": "Calculate pixel to mm scale from reference marker for photo measurements",
  "category": "Measurements",
  "module": "inspect",
  "icon": "PictureOutlined",
  "tags": [
    "image",
    "scale",
    "calibration",
    "pixel",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload reference photo and marker size", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "photo", "type": "group", "title": "Reference Photo", "description": "Image with known marker", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "reference_image", "type": "image-upload-with-drawing", "title": "Reference Image", "label": "Reference Image", "required": true, "size": 24, "sectionId": "input-card", "groupId": "photo", "props": { "accept": "image/*", "multiple": false, "clientOnly": true, "showThumbnails": true, "layout": "grid", "thumbnailSize": 140 } },
    { "id": "marker_size_mm", "type": "number", "title": "Marker Size (mm)", "label": "Marker Size (mm)", "required": true, "size": 12, "sectionId": "input-card", "groupId": "photo", "defaultValue": null }
  ],
  "aiPrompt": "You are a measurement analyst.\n\nContext: Image scale calibration — compute pixel-to-mm scale using a known marker in the image.\n\nTask: Provide a concise calibration limited strictly to:\n1) Pixels per mm\n2) mm per pixel\n3) Notes for measurement accuracy\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Image Scale Calibration\n## Inputs\n## Method and Assumptions\n## Calculations\n- Pixels per mm\n- mm per pixel\n## Summary Table\n(Use columns: Metric | Value | Units | Notes)\n## References and Standards"
};