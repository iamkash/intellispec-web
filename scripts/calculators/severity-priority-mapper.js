module.exports = {
  "id": "severity-priority-mapper",
  "name": "Severity to priority mapper",
  "description": "Map severity and risk class to P1 to P4 repair priority",
  "category": "Reporting and actions",
  "module": "inspect",
  "icon": "OrderedListOutlined",
  "tags": [
    "severity",
    "priority",
    "mapper",
    "repair"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter severity and risk context", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "context", "type": "group", "title": "Context", "description": "Risk class and severity", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "risk_class", "type": "select", "title": "Risk Class", "label": "Risk Class", "required": true, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": "medium", "options": [ {"label":"Low","value":"low"}, {"label":"Medium","value":"medium"}, {"label":"High","value":"high"} ] },
    { "id": "severity_score", "type": "number", "title": "Severity Score (0-100)", "label": "Severity Score (0-100)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": 50 },
    { "id": "leak_present", "type": "switch", "title": "Leak Present", "label": "Leak Present", "required": false, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": false }
  ],
  "aiPrompt": "You are a planner.\n\nContext: Severity to priority mapping — convert severity and risk context into P1..P4 priority with rationale.\n\nTask: Provide a concise mapping limited strictly to:\n1) Priority (P1..P4)\n2) Rationale\n3) Immediate actions if P1\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Severity to Priority Mapping\n## Inputs\n## Method and Assumptions\n## Result\n- Priority\n- Rationale\n- Immediate Actions (if any)\n## References and Standards"
};