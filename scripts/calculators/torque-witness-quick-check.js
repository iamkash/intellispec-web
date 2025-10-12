module.exports = {
  "id": "torque-witness-quick-check",
  "name": "Torque witness quick check",
  "description": "Suggest target torque and tension by size, class, and lubricant",
  "category": "Measurements",
  "module": "inspect",
  "icon": "SettingOutlined",
  "tags": [
    "torque",
    "witness",
    "tension",
    "lubricant"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter flange/bolt details", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "flange", "type": "group", "title": "Flange/Bolt Details", "description": "Size, class, lubricant", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "bolt_size", "type": "select", "title": "Bolt Size", "label": "Bolt Size", "required": true, "size": 8, "sectionId": "input-card", "groupId": "flange", "defaultValue": "M16", "options": [ {"label":"M12","value":"M12"}, {"label":"M16","value":"M16"}, {"label":"M20","value":"M20"}, {"label":"M24","value":"M24"} ] },
    { "id": "flange_class", "type": "select", "title": "Flange Class", "label": "Flange Class", "required": true, "size": 8, "sectionId": "input-card", "groupId": "flange", "defaultValue": "150", "options": [ {"label":"150","value":"150"}, {"label":"300","value":"300"}, {"label":"600","value":"600"} ] },
    { "id": "lubricant", "type": "select", "title": "Lubricant", "label": "Lubricant", "required": false, "size": 8, "sectionId": "input-card", "groupId": "flange", "defaultValue": "standard", "options": [ {"label":"Standard","value":"standard"}, {"label":"Moly","value":"moly"} ] }
  ],
  "aiPrompt": "You are a bolted joint specialist.\n\nContext: Torque witness quick check — provide target torque and tension for the selected bolt size/class and lubricant.\n\nTask: Provide a concise quick check limited strictly to:\n1) Target torque\n2) Approximate tension\n3) Notes and cautions\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Torque Witness Quick Check\n## Inputs\n## Method and Assumptions\n## Calculations\n- Target Torque\n- Approximate Tension\n## Summary Table\n(Use columns: Metric | Value | Units | Notes)\n## References and Standards"
};