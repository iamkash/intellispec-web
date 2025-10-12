module.exports = {
  "id": "crew-productivity-planner",
  "name": "Crew productivity planner",
  "description": "Forecast inspections per shift by crew mix, walking distance, and evidence targets",
  "category": "Planning",
  "module": "inspect",
  "icon": "TeamOutlined",
  "tags": [
    "crew",
    "productivity",
    "shift",
    "planning"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter crew and workload details", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "crew-setup", "type": "group", "title": "Crew Setup", "description": "Crew composition and shift", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "crew_size", "type": "number", "title": "Crew Size", "label": "Crew Size", "required": true, "size": 6, "sectionId": "input-card", "groupId": "crew-setup", "defaultValue": 2 },
    { "id": "shift_hours", "type": "number", "title": "Shift Hours", "label": "Shift Hours", "required": true, "size": 6, "sectionId": "input-card", "groupId": "crew-setup", "defaultValue": 10 },
    { "id": "breaks_hours", "type": "number", "title": "Breaks (hours)", "label": "Breaks (hours)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "crew-setup", "defaultValue": 1 },

    { "id": "workload", "type": "group", "title": "Workload Targets", "description": "CMLs, photos, and travel", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "target_cmls", "type": "number", "title": "Target CMLs", "label": "Target CMLs", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 120 },
    { "id": "target_photos", "type": "number", "title": "Target Photos", "label": "Target Photos", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 600 },
    { "id": "walking_distance_km", "type": "number", "title": "Walking Distance (km)", "label": "Walking Distance (km)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 6 },

    { "id": "rates", "type": "group", "title": "Rates and Overheads", "description": "Per-task productivity and fixed time", "sectionId": "input-card", "order": 3, "size": 24, "collapsible": true },
    { "id": "cml_time_min", "type": "number", "title": "Time per CML (min)", "label": "Time per CML (min)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "rates", "defaultValue": 1.5 },
    { "id": "photo_time_sec", "type": "number", "title": "Photo Time (sec/photo)", "label": "Photo Time (sec/photo)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "rates", "defaultValue": 8 },
    { "id": "walking_speed_kmph", "type": "number", "title": "Walking Speed (km/h)", "label": "Walking Speed (km/h)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "rates", "defaultValue": 4 },
    { "id": "fixed_overhead_hours", "type": "number", "title": "Fixed Overhead (hours)", "label": "Fixed Overhead (hours)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "rates", "defaultValue": 0.5 }
  ],
  "aiPrompt": "You are an expert inspection planner.\n\nContext: Crew productivity planning — forecast inspections per shift using crew size, shift time, workload targets, and per-task rates.\n\nTask: Provide a concise forecast limited strictly to:\n1) Available task hours (shift minus breaks and overhead)\n2) Capacity for CMLs and photos\n3) Walking time allowance\n4) Expected throughput per shift and per person\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Crew Productivity Plan\n## Inputs\n## Method and Assumptions\n## Calculations\n- Available Task Hours\n- Capacity (CMLs, Photos)\n- Walking Time Allowance\n- Throughput per Shift\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};