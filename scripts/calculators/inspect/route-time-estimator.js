module.exports = {
  "id": "route-time-estimator",
  "name": "Route time estimator",
  "description": "Estimate field hours and crew size from distance, CMLs, and access complexity",
  "category": "Planning",
  "module": "inspect",
  "icon": "ClockCircleOutlined",
  "tags": [
    "route",
    "time",
    "crew",
    "estimation"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter route and workload details", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "general-inputs", "type": "group", "title": "Route Overview", "description": "Distance and workload context", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "route_length", "type": "number", "title": "Route Length", "label": "Route Length", "placeholder": "Enter length", "required": true, "size": 6, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": null },
    { "id": "route_unit", "type": "select", "title": "Route Unit", "label": "Route Unit", "required": true, "size": 6, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": "km", "options": [ { "label": "km", "value": "km" }, { "label": "m", "value": "m" }, { "label": "ft", "value": "ft" } ] },
    { "id": "planned_cmls", "type": "number", "title": "Planned CMLs", "label": "Planned CMLs", "placeholder": "Total CMLs on route", "required": false, "size": 6, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": 0 },
    { "id": "planned_photos", "type": "number", "title": "Planned Photos", "label": "Planned Photos", "placeholder": "Target photo count", "required": false, "size": 6, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": 0 },

    { "id": "route-params", "type": "group", "title": "Route Parameters", "description": "Terrain and access", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "elevation_gain_m", "type": "number", "title": "Elevation Gain (m)", "label": "Elevation Gain (m)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "route-params", "defaultValue": 0 },
    { "id": "terrain", "type": "select", "title": "Terrain", "label": "Terrain", "required": false, "size": 6, "sectionId": "input-card", "groupId": "route-params", "defaultValue": "flat", "options": [ { "label": "Flat", "value": "flat" }, { "label": "Mixed", "value": "mixed" }, { "label": "Rugged", "value": "rugged" } ] },
    { "id": "accessibility_complexity", "type": "select", "title": "Accessibility Complexity", "label": "Accessibility Complexity", "required": false, "size": 6, "sectionId": "input-card", "groupId": "route-params", "defaultValue": "medium", "options": [ { "label": "Low", "value": "low" }, { "label": "Medium", "value": "medium" }, { "label": "High", "value": "high" } ] },
    { "id": "obstacles_count", "type": "number", "title": "Obstacle Count", "label": "Obstacle Count", "required": false, "size": 6, "sectionId": "input-card", "groupId": "route-params", "defaultValue": 0 },

    { "id": "productivity-params", "type": "group", "title": "Productivity Settings", "description": "Walking speed and task rates", "sectionId": "input-card", "order": 3, "size": 24, "collapsible": true },
    { "id": "walking_speed_kmph", "type": "number", "title": "Walking Speed (km/h)", "label": "Walking Speed (km/h)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "productivity-params", "defaultValue": 4 },
    { "id": "stop_penalty_min_per_cml", "type": "number", "title": "Stop Penalty per CML (min)", "label": "Stop Penalty per CML (min)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "productivity-params", "defaultValue": 1.5 },
    { "id": "photo_time_sec", "type": "number", "title": "Photo Time (sec/photo)", "label": "Photo Time (sec/photo)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "productivity-params", "defaultValue": 8 },
    { "id": "fixed_overhead_hours", "type": "number", "title": "Fixed Overhead (hours)", "label": "Fixed Overhead (hours)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "productivity-params", "defaultValue": 0.5 },
    { "id": "crew_size_default", "type": "number", "title": "Default Crew Size", "label": "Default Crew Size", "required": false, "size": 6, "sectionId": "input-card", "groupId": "productivity-params", "defaultValue": 2 }
  ],
  "aiPrompt": "You are an expert inspection planner.\n\nContext: Route time estimation — estimate total field hours and suggested crew size based on route length, terrain/access, and planned CMLs/photos.\n\nTask: Using only the inputs above, produce a concise estimate limited strictly to:\n1) Walking time\n2) Task time (CML stops, photos)\n3) Fixed overhead\n4) Total field hours and suggested crew size\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Route Time Estimate\n## Inputs\n## Method and Assumptions\n## Calculations\n- Walking Time\n- Task Time (CMLs, Photos)\n- Fixed Overhead\n- Total Field Hours\n- Suggested Crew Size\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};