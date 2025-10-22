module.exports = {
  "id": "coating-condition-score",
  "name": "Coating condition score",
  "description": "Score coating health from rust grade, blistering, and undercutting",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "FormatPainterOutlined",
  "tags": [
    "coating",
    "condition",
    "score",
    "rust",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Visual indicators for coatings", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "indicators", "type": "group", "title": "Indicators", "description": "Rust, blistering, undercutting", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "rust_grade", "type": "select", "title": "Rust Grade", "label": "Rust Grade", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "options": [ {"label":"A","value":"A"}, {"label":"B","value":"B"}, {"label":"C","value":"C"}, {"label":"D","value":"D"} ] },
    { "id": "blistering_level", "type": "select", "title": "Blistering Level", "label": "Blistering Level", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "options": [ {"label":"None","value":"none"}, {"label":"Moderate","value":"moderate"}, {"label":"Severe","value":"severe"} ] },
    { "id": "undercutting_mm", "type": "number", "title": "Undercutting (mm)", "label": "Undercutting (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "indicators", "defaultValue": null },
    { "id": "photos", "type": "group", "title": "Visual Evidence (Optional)", "description": "Coating areas with defects", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "coating_photos", "type": "image-upload-with-drawing", "title": "Coating Photos", "label": "Coating Photos", "required": false, "size": 24, "sectionId": "input-card", "groupId": "photos", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid" } }
  ],
  "aiPrompt": "You are a coatings assessor.\n\nContext: Coating condition score — assess using BOTH the uploaded images and any provided indicators (rust grade, blistering, undercutting).\n\nRules:\n- If images are provided, visually determine indicators from the photos.\n- Treat missing or placeholder/default values as unknown; do not assume.\n- If user inputs conflict with visual assessment, state the conflict and use the most reliable evidence (usually images) with justification.\n- Do not ignore images; prioritize image-derived evidence when present.\n\nTask: Provide a concise score limited strictly to:\n1) Index (0-100)\n2) Drivers\n3) Repair priority\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Coating Condition Score\n## Inputs\n## Method and Assumptions\n## Results\n- Index\n- Drivers\n- Priority\n## Evidence Reconciliation\nProvide a small table: Indicator | From Images | From Inputs | Final Used | Notes\n## References and Standards"
};