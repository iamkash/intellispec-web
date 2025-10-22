module.exports = {
  "id": "insulation-condition-index",
  "name": "Insulation condition index",
  "description": "Score insulation damage and CUI likelihood",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "HeatMapOutlined",
  "tags": [
    "insulation",
    "condition",
    "index",
    "cui"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Visual indicators for insulation", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "indicators", "type": "group", "title": "Indicators", "description": "Damage, moisture, temperature", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "damage_level", "type": "select", "title": "Damage Level", "label": "Damage Level", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "none", "options": [ {"label":"None","value":"none"}, {"label":"Moderate","value":"moderate"}, {"label":"Severe","value":"severe"} ] },
    { "id": "wet_spots_present", "type": "switch", "title": "Wet Spots Present", "label": "Wet Spots Present", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": false },
    { "id": "temp_band", "type": "select", "title": "Temperature Band", "label": "Temperature Band", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "-20_to_60C", "options": [ {"label":"< -20°C","value":"lt_-20C"}, {"label":"-20°C to 60°C","value":"-20_to_60C"}, {"label":"60°C to 120°C","value":"60_to_120C"} ] }
  ],
  "aiPrompt": "You are a CUI risk screener.\n\nContext: Insulation condition index — compute a risk/condition index from damage, moisture, and temperature band.\n\nTask: Provide a concise score limited strictly to:\n1) Index (0-100)\n2) Drivers\n3) Recommended actions\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Insulation Condition Index\n## Inputs\n## Method and Assumptions\n## Results\n- Index\n- Drivers\n- Actions\n## References and Standards"
};