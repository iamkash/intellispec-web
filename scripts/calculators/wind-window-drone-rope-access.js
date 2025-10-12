module.exports = {
  "id": "wind-window-drone-rope-access",
  "name": "Wind window for drone or rope access",
  "description": "Check wind and gust limits for planned evidence capture",
  "category": "Environment",
  "module": "inspect",
  "icon": "SendOutlined",
  "tags": [
    "wind",
    "drone",
    "rope",
    "access"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Wind and method limits", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "wind", "type": "group", "title": "Wind", "description": "Measured wind and gusts", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "wind_speed_mps", "type": "number", "title": "Wind Speed (m/s)", "label": "Wind Speed (m/s)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "wind", "defaultValue": null },
    { "id": "gust_speed_mps", "type": "number", "title": "Gust Speed (m/s)", "label": "Gust Speed (m/s)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "wind", "defaultValue": null },

    { "id": "method", "type": "group", "title": "Method Limits", "description": "Planned method and its limits", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "method_type", "type": "select", "title": "Method", "label": "Method", "required": true, "size": 8, "sectionId": "input-card", "groupId": "method", "defaultValue": "drone", "options": [ {"label":"Drone","value":"drone"}, {"label":"Rope access","value":"rope"} ] },
    { "id": "wind_limit_mps", "type": "number", "title": "Wind Limit (m/s)", "label": "Wind Limit (m/s)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "method", "defaultValue": 10 },
    { "id": "gust_limit_mps", "type": "number", "title": "Gust Limit (m/s)", "label": "Gust Limit (m/s)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "method", "defaultValue": 12 }
  ],
  "aiPrompt": "You are an access planner.\n\nContext: Wind window — determine if measured wind/gusts are within limits for the chosen method.\n\nTask: Provide a concise decision limited strictly to:\n1) Pass/Fail vs limits\n2) Buffer to limit\n3) Safety notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Wind Window\n## Inputs\n## Method and Assumptions\n## Results\n- Pass/Fail\n- Buffer\n- Notes\n## References and Standards"
};