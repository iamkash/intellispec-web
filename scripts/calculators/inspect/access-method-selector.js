module.exports = {
  "id": "access-method-selector",
  "name": "Access method selector",
  "description": "Recommend access method by height, geometry, and exposure class",
  "category": "Ops helper",
  "module": "inspect",
  "icon": "LadderOutlined",
  "tags": [
    "access",
    "method",
    "selector",
    "height"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter access constraints", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "general-inputs", "type": "group", "title": "Asset & Access Context", "description": "Height and geometry", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "work_height_m", "type": "number", "title": "Work Height (m)", "label": "Work Height (m)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": null },
    { "id": "geometry", "type": "select", "title": "Geometry", "label": "Geometry", "required": true, "size": 8, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": "open_frame", "options": [ { "label": "Open frame", "value": "open_frame" }, { "label": "Vessel", "value": "vessel" }, { "label": "Tank", "value": "tank" }, { "label": "Stack", "value": "stack" } ] },
    { "id": "exposure_class", "type": "select", "title": "Exposure Class", "label": "Exposure Class", "required": false, "size": 8, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": "normal", "options": [ { "label": "Normal", "value": "normal" }, { "label": "Confined", "value": "confined" }, { "label": "Hazardous", "value": "hazardous" } ] },

    { "id": "constraints", "type": "group", "title": "Constraints", "description": "Weather, permits, and site rules", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "wind_speed_mps", "type": "number", "title": "Wind Speed (m/s)", "label": "Wind Speed (m/s)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "constraints", "defaultValue": null },
    { "id": "hot_work_required", "type": "switch", "title": "Hot Work Required", "label": "Hot Work Required", "required": false, "size": 8, "sectionId": "input-card", "groupId": "constraints", "defaultValue": false },
    { "id": "rope_access_permitted", "type": "switch", "title": "Rope Access Permitted", "label": "Rope Access Permitted", "required": false, "size": 8, "sectionId": "input-card", "groupId": "constraints", "defaultValue": true }
  ],
  "aiPrompt": "You are an expert access planner.\n\nContext: Access method selection — recommend primary access (e.g., rope access, scaffolding, MEWP, drones) based on height, geometry, exposure class, and constraints.\n\nTask: Provide a concise recommendation limited strictly to:\n1) Recommended access method and rationale\n2) Alternatives with pros/cons\n3) Key safety/permit notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Access Method Selection\n## Inputs\n## Method and Assumptions\n## Recommendation\n- Primary Method\n- Alternatives\n## Summary Table\n(Use columns: Option | Suitable For | Constraints | Notes)\n## References and Standards"
};