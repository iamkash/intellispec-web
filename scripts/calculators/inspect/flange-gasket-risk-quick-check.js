module.exports = {
  "id": "flange-gasket-risk-quick-check",
  "name": "Flange gasket risk quick check",
  "description": "Quick risk check for gasket failure from bolt loss and weeping signs",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "WarningOutlined",
  "tags": [
    "flange",
    "gasket",
    "risk",
    "bolt",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Visual cues and conditions", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "cues", "type": "group", "title": "Visual Cues", "description": "Weeping, staining, bolt condition", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "weeping_present", "type": "switch", "title": "Weeping Present", "label": "Weeping Present", "required": false, "size": 6, "sectionId": "input-card", "groupId": "cues", "defaultValue": false },
    { "id": "stain_size_cm", "type": "number", "title": "Stain Size (cm)", "label": "Stain Size (cm)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "cues", "defaultValue": null },
    { "id": "bolts_missing_or_loose", "type": "switch", "title": "Bolts Missing/Loose", "label": "Bolts Missing/Loose", "required": false, "size": 6, "sectionId": "input-card", "groupId": "cues", "defaultValue": false },
    { "id": "photos", "type": "group", "title": "Visual Evidence (Optional)", "description": "Flange faces, gasket edges, bolt heads", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "flange_photos", "type": "image-upload-with-drawing", "title": "Flange Photos", "label": "Flange Photos", "required": false, "size": 24, "sectionId": "input-card", "groupId": "photos", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a piping inspector.\n\nContext: Flange gasket risk quick check — rate risk based on BOTH user cues and uploaded photos.\n\nRules:\n- From images, detect weeping/staining, gasket extrusion, bolt loss, misalignment.\n- Treat missing/default inputs as unknown.\n- If image evidence conflicts with inputs, explain and prioritize clear photo evidence.\n\nTask: Provide a concise quick check limited strictly to:\n1) Risk level (Low/Medium/High)\n2) Key cues driving risk\n3) Immediate actions if High\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Flange Gasket Risk Quick Check\n## Inputs\n## Method and Assumptions\n## Evidence Reconciliation\nTable: Cue | From Images | From Inputs | Final Used | Notes\n## Result\n- Risk Level\n- Key Cues\n- Actions\n## References and Standards"
};