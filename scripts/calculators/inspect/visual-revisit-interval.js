module.exports = {
  "id": "visual-revisit-interval",
  "name": "Visual revisit interval",
  "description": "Suggest visual-only recheck interval from RL and risk class bounds",
  "category": "Measurements",
  "module": "inspect",
  "icon": "CalendarOutlined",
  "tags": [
    "visual",
    "revisit",
    "interval",
    "risk"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Remaining life and risk class", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "context", "type": "group", "title": "Context", "description": "Remaining life and bounds", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "remaining_life_years", "type": "number", "title": "Remaining Life (years)", "label": "Remaining Life (years)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": null },
    { "id": "risk_class", "type": "select", "title": "Risk Class", "label": "Risk Class", "required": true, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": "medium", "options": [ {"label":"Low","value":"low"}, {"label":"Medium","value":"medium"}, {"label":"High","value":"high"} ] },
    { "id": "min_interval_months", "type": "number", "title": "Min Interval (months)", "label": "Min Interval (months)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": 1 }
  ],
  "aiPrompt": "You are an RBI planner.\n\nContext: Visual revisit interval — suggest recheck interval based on remaining life and risk class bounds.\n\nTask: Provide a concise suggestion limited strictly to:\n1) Suggested interval (months)\n2) Rationale vs RL and risk class\n3) Notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Visual Revisit Interval\n## Inputs\n## Method and Assumptions\n## Recommendation\n- Suggested Interval\n- Rationale\n- Notes\n## References and Standards"
};