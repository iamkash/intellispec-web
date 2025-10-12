module.exports = {
  "id": "cui-quick-screen",
  "name": "CUI quick screen",
  "description": "Screen CUI risk using temperature band, wet service, and insulation damage",
  "category": "Environment",
  "module": "inspect",
  "icon": "SafetyOutlined",
  "tags": [
    "cui",
    "screen",
    "temperature",
    "insulation",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Key CUI indicators", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "indicators", "type": "group", "title": "Indicators", "description": "Temp band, wet service, damage", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "temp_band", "type": "select", "title": "Temperature Band", "label": "Temperature Band", "required": true, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "-20_to_60C", "options": [ {"label":"< -20°C","value":"lt_-20C"}, {"label":"-20°C to 60°C","value":"-20_to_60C"}, {"label":"60°C to 120°C","value":"60_to_120C"} ] },
    { "id": "wet_service", "type": "switch", "title": "Wet Service", "label": "Wet Service", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": false },
    { "id": "insulation_damage", "type": "select", "title": "Insulation Damage", "label": "Insulation Damage", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": "none", "options": [ {"label":"None","value":"none"}, {"label":"Moderate","value":"moderate"}, {"label":"Severe","value":"severe"} ] },
    { "id": "photos", "type": "group", "title": "Visual Evidence (Optional)", "description": "Closeups of insulation terminations/low points", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "cui_photos", "type": "image-upload-with-drawing", "title": "CUI Photos", "label": "CUI Photos", "required": false, "size": 24, "sectionId": "input-card", "groupId": "photos", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a CUI screener.\n\nContext: CUI quick screen — provide a qualitative risk screen using BOTH user inputs (temperature band, wet service, insulation damage) and any uploaded photos.\n\nRules:\n- If photos are provided, extract visual cues (e.g., wetting, staining, insulation breaches, terminations/low points) and incorporate them.\n- Treat missing/default inputs as unknown; do not assume.\n- If visual cues conflict with user inputs, note the conflict and prioritize clear image evidence with justification.\n\nTask: Provide a concise screen limited strictly to:\n1) Risk level\n2) Drivers\n3) Recommended next steps\n\nOutput a professional Markdown report with ONLY these sections:\n\n# CUI Quick Screen\n## Inputs\n## Method and Assumptions\n## Evidence Reconciliation\nTable: Indicator | From Images | From Inputs | Final Used | Notes\n## Results\n- Risk Level\n- Drivers\n- Next Steps\n## References and Standards"
};