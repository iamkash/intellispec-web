module.exports = {
  "id": "leak-severity-rank",
  "name": "Leak severity rank",
  "description": "Rank leak severity using stain size, wetness, and gas readings",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "ExclamationCircleOutlined",
  "tags": [
    "leak",
    "severity",
    "rank",
    "stain"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Visual and instrument indicators", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "indicators", "type": "group", "title": "Indicators", "description": "Stain, wetness, gas", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "stain_diameter_cm", "type": "number", "title": "Stain Diameter (cm)", "label": "Stain Diameter (cm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": null },
    { "id": "wetness_level", "type": "select", "title": "Wetness Level", "label": "Wetness Level", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "dry", "options": [ {"label":"Dry","value":"dry"}, {"label":"Damp","value":"damp"}, {"label":"Wet","value":"wet"} ] },
    { "id": "gas_reading_ppm", "type": "number", "title": "Gas Reading (ppm)", "label": "Gas Reading (ppm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": null }
  ],
  "aiPrompt": "You are a leak assessor.\n\nContext: Leak severity rank — rank severity based on stain size, wetness, and gas meter readings.\n\nTask: Provide a concise rank limited strictly to:\n1) Severity rank (Low/Medium/High)\n2) Drivers\n3) Immediate actions\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Leak Severity Rank\n## Inputs\n## Method and Assumptions\n## Result\n- Rank\n- Drivers\n- Actions\n## References and Standards"
};