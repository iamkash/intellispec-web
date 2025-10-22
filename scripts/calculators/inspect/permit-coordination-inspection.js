module.exports = {
  "id": "permit-coordination-inspection",
  "name": "Permit coordination for inspection tasks",
  "description": "Forecast permit counts needed by day and area for inspection-only work",
  "category": "Planning",
  "module": "inspect",
  "icon": "FileTextOutlined",
  "tags": [
    "permit",
    "coordination",
    "forecast",
    "inspection"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter tasks and areas", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "work-scope", "type": "group", "title": "Work Scope", "description": "Task counts by day and area", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "days", "type": "number", "title": "Days of Work", "label": "Days of Work", "required": true, "size": 6, "sectionId": "input-card", "groupId": "work-scope", "defaultValue": 5 },
    { "id": "areas", "type": "number", "title": "Areas", "label": "Areas", "required": false, "size": 6, "sectionId": "input-card", "groupId": "work-scope", "defaultValue": 3 },
    { "id": "hot_work_fraction", "type": "number", "title": "Hot Work Fraction", "label": "Hot Work Fraction", "required": false, "size": 6, "sectionId": "input-card", "groupId": "work-scope", "defaultValue": 0.2 },
    { "id": "confined_space_fraction", "type": "number", "title": "Confined Space Fraction", "label": "Confined Space Fraction", "required": false, "size": 6, "sectionId": "input-card", "groupId": "work-scope", "defaultValue": 0.1 },

    { "id": "policy", "type": "group", "title": "Permit Policy", "description": "Policy factors for permits/day", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "permits_per_hot_work", "type": "number", "title": "Permits per Hot Work Task", "label": "Permits per Hot Work Task", "required": false, "size": 6, "sectionId": "input-card", "groupId": "policy", "defaultValue": 1 },
    { "id": "permits_per_confined_space", "type": "number", "title": "Permits per Confined Space Task", "label": "Permits per Confined Space Task", "required": false, "size": 6, "sectionId": "input-card", "groupId": "policy", "defaultValue": 1 },
    { "id": "permits_per_routine", "type": "number", "title": "Permits per Routine Task", "label": "Permits per Routine Task", "required": false, "size": 6, "sectionId": "input-card", "groupId": "policy", "defaultValue": 0.2 }
  ],
  "aiPrompt": "You are an expert inspection planner.\n\nContext: Permit coordination — forecast daily permits required based on task mix by area and policy multipliers.\n\nTask: Provide a concise forecast limited strictly to:\n1) Permit counts by type and per day\n2) Peak day demand\n3) Coordination notes (conflicts, overlaps)\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Permit Coordination Plan\n## Inputs\n## Method and Assumptions\n## Calculations\n- Daily Permit Counts\n- Peak Day Demand\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};