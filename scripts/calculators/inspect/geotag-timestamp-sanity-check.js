module.exports = {
  "id": "geotag-timestamp-sanity-check",
  "name": "Geotag and timestamp sanity check",
  "description": "Validate evidence geotags and times against planned route",
  "category": "Evidence and confidence",
  "module": "inspect",
  "icon": "EnvironmentOutlined",
  "tags": [
    "geotag",
    "timestamp",
    "sanity",
    "route"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter planned route and tolerances", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "route", "type": "group", "title": "Route Plan", "description": "Expected time window and distance", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "planned_start", "type": "text", "title": "Planned Start (ISO)", "label": "Planned Start (ISO)", "placeholder": "YYYY-MM-DDTHH:mm:ssZ", "required": false, "size": 8, "sectionId": "input-card", "groupId": "route", "defaultValue": "" },
    { "id": "planned_end", "type": "text", "title": "Planned End (ISO)", "label": "Planned End (ISO)", "placeholder": "YYYY-MM-DDTHH:mm:ssZ", "required": false, "size": 8, "sectionId": "input-card", "groupId": "route", "defaultValue": "" },
    { "id": "planned_distance_km", "type": "number", "title": "Planned Distance (km)", "label": "Planned Distance (km)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "route", "defaultValue": null },

    { "id": "tolerances", "type": "group", "title": "Tolerances", "description": "Allowed deltas", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "max_time_drift_min", "type": "number", "title": "Max Time Drift (min)", "label": "Max Time Drift (min)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "tolerances", "defaultValue": 10 },
    { "id": "max_position_error_m", "type": "number", "title": "Max Position Error (m)", "label": "Max Position Error (m)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "tolerances", "defaultValue": 30 }
  ],
  "aiPrompt": "You are an evidence QA reviewer.\n\nContext: Geotag and timestamp sanity — check that evidence geotags and times fall within planned windows and distance tolerances.\n\nTask: Provide a concise assessment limited strictly to:\n1) Time drift vs tolerance\n2) Position error vs tolerance\n3) Outliers count and examples\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Geotag & Timestamp Sanity Check\n## Inputs\n## Method and Assumptions\n## Results\n- Time Drift\n- Position Error\n- Outliers\n## Summary Table\n(Use columns: Metric | Value | Threshold | Status | Notes)\n## References and Standards"
};