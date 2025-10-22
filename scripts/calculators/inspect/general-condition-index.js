module.exports = {
  "id": "general-condition-index",
  "name": "General condition index",
  "description": "Roll up corrosion, leaks, coating, supports, alignment into a 0 to 100 score",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "DashboardOutlined",
  "tags": [
    "general",
    "condition",
    "index",
    "score"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Visual indicators to compute index", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "indicators", "type": "group", "title": "Indicators", "description": "Corrosion, leaks, coating, supports, alignment", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "external_corrosion", "type": "select", "title": "External Corrosion", "label": "External Corrosion", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "none", "options": [ {"label":"None","value":"none"}, {"label":"Moderate","value":"moderate"}, {"label":"Severe","value":"severe"} ] },
    { "id": "leak_signs", "type": "select", "title": "Leak Signs", "label": "Leak Signs", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "none", "options": [ {"label":"None","value":"none"}, {"label":"Stain","value":"stain"}, {"label":"Active leak","value":"active"} ] },
    { "id": "coating_condition", "type": "select", "title": "Coating Condition", "label": "Coating Condition", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "good", "options": [ {"label":"Good","value":"good"}, {"label":"Fair","value":"fair"}, {"label":"Poor","value":"poor"} ] },
    { "id": "support_issues", "type": "select", "title": "Support Issues", "label": "Support Issues", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "none", "options": [ {"label":"None","value":"none"}, {"label":"Minor","value":"minor"}, {"label":"Major","value":"major"} ] },
    { "id": "alignment_issue", "type": "switch", "title": "Alignment Issue", "label": "Alignment Issue", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": false }
  ],
  "aiPrompt": "You are a visual condition assessor.\n\nContext: General condition index — compute a 0-100 index from indicator levels.\n\nTask: Provide a concise score limited strictly to:\n1) Index (0-100)\n2) Drivers\n3) Recommended actions\n\nOutput a professional Markdown report with ONLY these sections:\n\n# General Condition Index\n## Inputs\n## Method and Assumptions\n## Results\n- Index\n- Drivers\n- Actions\n## References and Standards"
};