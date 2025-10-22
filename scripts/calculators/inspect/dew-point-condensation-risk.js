module.exports = {
  "id": "dew-point-condensation-risk",
  "name": "Dew point and condensation risk",
  "description": "Calculate dew point and flag condensation risk for inspection readiness",
  "category": "Environment",
  "module": "inspect",
  "icon": "CloudOutlined",
  "tags": [
    "dew",
    "point",
    "condensation",
    "risk",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter ambient conditions", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "ambient", "type": "group", "title": "Ambient Conditions", "description": "Temperature and humidity", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "air_temp_c", "type": "number", "title": "Air Temperature (°C)", "label": "Air Temperature (°C)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "ambient", "defaultValue": null },
    { "id": "rh_percent", "type": "number", "title": "Relative Humidity (%)", "label": "Relative Humidity (%)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "ambient", "defaultValue": null },
    { "id": "surface_temp_c", "type": "number", "title": "Surface Temperature (°C)", "label": "Surface Temperature (°C)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "ambient", "defaultValue": null },
    { "id": "evidence", "type": "group", "title": "Optional Photo", "description": "Thermal/IR photo or surface thermometer shot", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "dew_photos", "type": "image-upload-with-drawing", "title": "Ambient Evidence Photo", "label": "Ambient Evidence Photo", "required": false, "size": 24, "sectionId": "input-card", "groupId": "evidence", "props": { "accept": "image/*", "multiple": false, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a coatings/environment readiness checker.\n\nContext: Dew point and condensation — compute dew point and evaluate risk based on RH, temperatures, and optionally an uploaded thermal/surface photo.\n\nRules:\n- If a photo is provided, infer whether the surface thermometer reading or visible condensation suggests an alternate surface temperature; mention if inconsistent with inputs.\n- Treat missing/default inputs as unknown; do not assume.\n\nTask: Provide a concise assessment limited strictly to:\n1) Dew point\n2) Dew point spread (surface minus dew point)\n3) Condensation risk status\n4) Notes for inspection readiness\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Dew Point & Condensation Risk\n## Inputs\n## Method and Assumptions\n## Evidence Reconciliation\nTable: Factor | From Images | From Inputs | Final Used | Notes\n## Calculations\n- Dew Point\n- Dew Point Spread\n- Risk Status\n## Summary Table\n(Use columns: Metric | Value | Units | Threshold | Status)\n## References and Standards"
};