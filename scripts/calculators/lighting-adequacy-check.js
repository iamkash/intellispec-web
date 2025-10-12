module.exports = {
  "id": "lighting-adequacy-check",
  "name": "Lighting adequacy check",
  "description": "Check lux level vs task type for reliable visual inspection",
  "category": "Environment",
  "module": "inspect",
  "icon": "BulbOutlined",
  "tags": [
    "lighting",
    "lux",
    "visual",
    "inspection"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter lighting and task type", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "lux", "type": "group", "title": "Measured Lux", "description": "Ambient light levels", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "measured_lux", "type": "number", "title": "Measured Lux", "label": "Measured Lux", "required": true, "size": 8, "sectionId": "input-card", "groupId": "lux", "defaultValue": null },
    { "id": "glare_present", "type": "switch", "title": "Glare Present", "label": "Glare Present", "required": false, "size": 8, "sectionId": "input-card", "groupId": "lux", "defaultValue": false },

    { "id": "task", "type": "group", "title": "Task Type", "description": "Visual acuity requirement", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "task_type", "type": "select", "title": "Task Type", "label": "Task Type", "required": true, "size": 8, "sectionId": "input-card", "groupId": "task", "defaultValue": "general_visual", "options": [ {"label":"General visual","value":"general_visual"}, {"label":"Detailed visual","value":"detailed_visual"}, {"label":"Critical inspection","value":"critical"} ] }
  ],
  "aiPrompt": "You are a lighting assessor.\n\nContext: Lighting adequacy — compare measured lux against task requirements and glare.\n\nTask: Provide a concise pass/fail assessment limited strictly to:\n1) Adequacy vs task standard\n2) Impact of glare\n3) Recommended mitigation\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Lighting Adequacy Check\n## Inputs\n## Method and Assumptions\n## Results\n- Adequacy vs Task\n- Glare Impact\n- Mitigation\n## Summary Table\n(Use columns: Metric | Value | Threshold | Status | Notes)\n## References and Standards"
};