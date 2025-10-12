module.exports = {
  "id": "redline-delta-counter",
  "name": "Redline delta counter",
  "description": "Count changes between draft and final report for QA notes",
  "category": "Reporting and actions",
  "module": "inspect",
  "icon": "DiffOutlined",
  "tags": [
    "redline",
    "delta",
    "counter",
    "qa"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload draft and final PDFs", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "documents", "type": "group", "title": "Documents", "description": "Draft and final versions", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "draft_report", "type": "upload", "title": "Draft Report (PDF)", "label": "Draft Report (PDF)", "required": true, "size": 12, "sectionId": "input-card", "groupId": "documents", "props": { "accept": ".pdf" } },
    { "id": "final_report", "type": "upload", "title": "Final Report (PDF)", "label": "Final Report (PDF)", "required": true, "size": 12, "sectionId": "input-card", "groupId": "documents", "props": { "accept": ".pdf" } },
    { "id": "include_images", "type": "switch", "title": "Include Image Changes", "label": "Include Image Changes", "required": false, "size": 12, "sectionId": "input-card", "groupId": "documents", "defaultValue": true }
  ],
  "aiPrompt": "You are a QA reviewer.\n\nContext: Redline delta counting — summarize key changes between draft and final versions.\n\nTask: Provide a concise delta summary limited strictly to:\n1) Sections added/removed\n2) Tables or values changed\n3) Figures/images added or updated\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Redline Delta Summary\n## Inputs\n## Method and Assumptions\n## Changes\n- Sections\n- Tables/Values\n- Figures\n## Summary Table\n(Use columns: Category | Count | Notes)\n## References and Standards"
};