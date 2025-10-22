module.exports = {
  "id": "corrosion-rate-remaining-life",
  "name": "Corrosion rate and remaining life",
  "description": "Calculate corrosion rate, remaining life, and next due interval",
  "category": "Measurements",
  "module": "inspect",
  "icon": "LineChartOutlined",
  "tags": [
    "corrosion",
    "rate",
    "remaining",
    "life"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter thickness data and limits", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "thk", "type": "group", "title": "Thickness Data", "description": "Initial and current thickness", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "t_initial_mm", "type": "number", "title": "Initial Thickness (mm)", "label": "Initial Thickness (mm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "thk", "defaultValue": null },
    { "id": "t_current_mm", "type": "number", "title": "Current Thickness (mm)", "label": "Current Thickness (mm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "thk", "defaultValue": null },
    { "id": "years_between", "type": "number", "title": "Years Between Readings", "label": "Years Between Readings", "required": true, "size": 8, "sectionId": "input-card", "groupId": "thk", "defaultValue": null },

    { "id": "limits", "type": "group", "title": "Limits", "description": "Minimum allowable and CA", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "t_min_mm", "type": "number", "title": "Tmin (mm)", "label": "Tmin (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "limits", "defaultValue": null },
    { "id": "corrosion_allowance_mm", "type": "number", "title": "Corrosion Allowance (mm)", "label": "Corrosion Allowance (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "limits", "defaultValue": null }
  ],
  "aiPrompt": "You are an RBI engineer.\n\nContext: Corrosion rate and remaining life — compute corrosion rate from thickness loss over time, then remaining life to Tmin (or Tmin+CA) and suggest next due.\n\nTask: Provide a concise result limited strictly to:\n1) Corrosion rate (mm/yr)\n2) Remaining life (years) to limit\n3) Suggested next due interval\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Corrosion Rate & Remaining Life\n## Inputs\n## Method and Assumptions\n## Calculations\n- Corrosion Rate\n- Remaining Life\n- Next Due\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};