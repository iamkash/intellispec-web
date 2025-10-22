module.exports = {
  "id": "support-condition-index",
  "name": "Support condition index",
  "description": "Score support shoes, members, and sag for repair needs",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "BuildOutlined",
  "tags": [
    "support",
    "condition",
    "index",
    "repair"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Visual indicators for supports", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "indicators", "type": "group", "title": "Indicators", "description": "Shoes, members, sag", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "shoe_corrosion", "type": "select", "title": "Shoe Corrosion", "label": "Shoe Corrosion", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "none", "options": [ {"label":"None","value":"none"}, {"label":"Moderate","value":"moderate"}, {"label":"Severe","value":"severe"} ] },
    { "id": "member_corrosion", "type": "select", "title": "Member Corrosion", "label": "Member Corrosion", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "none", "options": [ {"label":"None","value":"none"}, {"label":"Moderate","value":"moderate"}, {"label":"Severe","value":"severe"} ] },
    { "id": "sag_mm", "type": "number", "title": "Sag (mm)", "label": "Sag (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": null }
  ],
  "aiPrompt": "You are a visual inspector.\n\nContext: Support condition index — compute a condition score based on corrosion and sag.\n\nTask: Provide a concise score limited strictly to:\n1) Index (0-100)\n2) Drivers\n3) Repair urgency\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Support Condition Index\n## Inputs\n## Method and Assumptions\n## Results\n- Index\n- Drivers\n- Urgency\n## References and Standards"
};