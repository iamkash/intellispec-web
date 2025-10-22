module.exports = {
  "id": "salt-spray-risk",
  "name": "Salt spray risk",
  "description": "Estimate salt exposure risk from coastal proximity and wind",
  "category": "Environment",
  "module": "inspect",
  "icon": "EnvironmentOutlined",
  "tags": [
    "salt",
    "spray",
    "risk",
    "coastal"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Proximity and wind", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "proximity", "type": "group", "title": "Proximity", "description": "Distance to coast", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "distance_to_coast_km", "type": "number", "title": "Distance to Coast (km)", "label": "Distance to Coast (km)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "proximity", "defaultValue": null },
    { "id": "prevailing_wind_speed_mps", "type": "number", "title": "Prevailing Wind (m/s)", "label": "Prevailing Wind (m/s)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "proximity", "defaultValue": null },
    { "id": "onshore_wind_days_per_year", "type": "number", "title": "Onshore Wind Days/Year", "label": "Onshore Wind Days/Year", "required": false, "size": 8, "sectionId": "input-card", "groupId": "proximity", "defaultValue": null }
  ],
  "aiPrompt": "You are an environment risk screener.\n\nContext: Salt spray risk — estimate risk based on distance to coast and wind patterns.\n\nTask: Provide a concise screen limited strictly to:\n1) Risk level\n2) Drivers\n3) Mitigations\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Salt Spray Risk\n## Inputs\n## Method and Assumptions\n## Results\n- Risk Level\n- Drivers\n- Mitigations\n## References and Standards"
};