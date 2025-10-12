module.exports = {
  "id": "ambient-window-coating-touchup",
  "name": "Ambient window for coating touch up",
  "description": "Check if temperature, RH, and dew point spread allow touch up tasks",
  "category": "Environment",
  "module": "inspect",
  "icon": "ToolOutlined",
  "tags": [
    "ambient",
    "coating",
    "touchup",
    "temperature"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Ambient and surface conditions", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "ambient", "type": "group", "title": "Ambient", "description": "Air temperature and RH", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "air_temp_c", "type": "number", "title": "Air Temperature (°C)", "label": "Air Temperature (°C)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "ambient", "defaultValue": null },
    { "id": "rh_percent", "type": "number", "title": "Relative Humidity (%)", "label": "Relative Humidity (%)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "ambient", "defaultValue": null },
    { "id": "surface_temp_c", "type": "number", "title": "Surface Temperature (°C)", "label": "Surface Temperature (°C)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "ambient", "defaultValue": null }
  ],
  "aiPrompt": "You are a coatings inspector.\n\nContext: Ambient window — determine if conditions permit coating touch-up based on temperature, RH, and dew point spread.\n\nTask: Provide a concise decision limited strictly to:\n1) Dew point and spread\n2) Pass/Fail vs spec window\n3) Notes and mitigations\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Ambient Window for Coating Touch-up\n## Inputs\n## Method and Assumptions\n## Results\n- Dew Point & Spread\n- Pass/Fail\n- Mitigations\n## References and Standards"
};