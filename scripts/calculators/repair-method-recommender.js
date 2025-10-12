module.exports = {
  "id": "repair-method-recommender",
  "name": "Repair method recommender",
  "description": "Suggest repair methods based on defect, size, temperature, and pressure with citations",
  "category": "Reporting and actions",
  "module": "inspect",
  "icon": "ToolOutlined",
  "tags": [
    "repair",
    "method",
    "recommender",
    "defect",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter defect and service context", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "defect", "type": "group", "title": "Defect Details", "description": "Type and dimensions", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "defect_type", "type": "select", "title": "Defect Type", "label": "Defect Type", "required": true, "size": 8, "sectionId": "input-card", "groupId": "defect", "defaultValue": "wall_loss", "options": [ {"label":"Wall loss","value":"wall_loss"}, {"label":"Through-wall leak","value":"leak"}, {"label":"Crack","value":"crack"}, {"label":"Pitting","value":"pitting"} ] },
    { "id": "defect_size_mm", "type": "number", "title": "Defect Size (mm)", "label": "Defect Size (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "defect", "defaultValue": null },
    { "id": "remaining_thickness_mm", "type": "number", "title": "Remaining Thickness (mm)", "label": "Remaining Thickness (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "defect", "defaultValue": null },

    { "id": "service", "type": "group", "title": "Service Conditions", "description": "Temperature and pressure", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "service_temp_c", "type": "number", "title": "Service Temperature (°C)", "label": "Service Temperature (°C)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "service", "defaultValue": null },
    { "id": "service_pressure_bar", "type": "number", "title": "Service Pressure (bar)", "label": "Service Pressure (bar)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "service", "defaultValue": null },
    { "id": "flammable_service", "type": "switch", "title": "Flammable Service", "label": "Flammable Service", "required": false, "size": 8, "sectionId": "input-card", "groupId": "service", "defaultValue": false },
    { "id": "photos", "type": "group", "title": "Defect Photo (Optional)", "description": "Closeup of the defect area", "sectionId": "input-card", "order": 3, "size": 24, "collapsible": true },
    { "id": "defect_photo", "type": "image-upload-with-drawing", "title": "Defect Photo", "label": "Defect Photo", "required": false, "size": 24, "sectionId": "input-card", "groupId": "photos", "props": { "accept": "image/*", "multiple": false, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a repair engineer.\n\nContext: Repair method recommendation — suggest viable methods for the declared defect considering dimensions and service conditions (temperature/pressure), and incorporate any uploaded defect photo.\n\nRules:\n- If a defect photo is provided, infer defect type cues (e.g., through-wall, edge effects, pitting cluster) and use these when they improve accuracy.\n- Treat missing/default inputs as unknown; do not assume.\n- If image evidence conflicts with input values, explain and select the most reliable evidence.\n\nTask: Provide a concise recommendation limited strictly to:\n1) Primary repair method with rationale\n2) Alternatives with constraints\n3) Precautions and references\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Repair Method Recommendation\n## Inputs\n## Method and Assumptions\n## Evidence Reconciliation\nTable: Factor | From Images | From Inputs | Final Used | Notes\n## Recommendation\n- Primary Method\n- Alternatives\n- Precautions\n## References and Standards"
};