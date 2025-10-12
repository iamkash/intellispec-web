module.exports = {
  "id": "drone-flight-segment-coverage",
  "name": "Drone flight segment coverage",
  "description": "Estimate passes and overlap needed to cover an area at chosen GSD",
  "category": "Ops helper",
  "module": "inspect",
  "icon": "SendOutlined",
  "tags": [
    "drone",
    "flight",
    "segment",
    "coverage"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter area and camera setup", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "area", "type": "group", "title": "Area", "description": "Target area and altitude", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "area_width_m", "type": "number", "title": "Area Width (m)", "label": "Area Width (m)", "required": true, "size": 6, "sectionId": "input-card", "groupId": "area", "defaultValue": null },
    { "id": "area_height_m", "type": "number", "title": "Area Height (m)", "label": "Area Height (m)", "required": true, "size": 6, "sectionId": "input-card", "groupId": "area", "defaultValue": null },
    { "id": "altitude_m", "type": "number", "title": "Altitude (m)", "label": "Altitude (m)", "required": true, "size": 6, "sectionId": "input-card", "groupId": "area", "defaultValue": 30 },

    { "id": "camera", "type": "group", "title": "Camera & Overlap", "description": "Sensor and overlap settings", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "sensor_width_mm", "type": "number", "title": "Sensor Width (mm)", "label": "Sensor Width (mm)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "camera", "defaultValue": 13.2 },
    { "id": "focal_length_mm", "type": "number", "title": "Focal Length (mm)", "label": "Focal Length (mm)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "camera", "defaultValue": 24 },
    { "id": "front_overlap_pct", "type": "number", "title": "Front Overlap (%)", "label": "Front Overlap (%)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "camera", "defaultValue": 70 },
    { "id": "side_overlap_pct", "type": "number", "title": "Side Overlap (%)", "label": "Side Overlap (%)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "camera", "defaultValue": 60 }
  ],
  "aiPrompt": "You are an expert drone mission planner.\n\nContext: Flight segment coverage — estimate required passes, spacing, and overlap to cover a rectangular area at the specified altitude and camera parameters.\n\nTask: Provide a concise plan limited strictly to:\n1) Ground sampling distance estimate\n2) Pass count and spacing\n3) Overlap verification\n4) Notes on wind and safety\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Drone Flight Segment Coverage\n## Inputs\n## Method and Assumptions\n## Calculations\n- GSD Estimate\n- Pass Count & Spacing\n- Overlap Check\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};