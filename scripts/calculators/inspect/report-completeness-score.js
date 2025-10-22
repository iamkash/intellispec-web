module.exports = {
  "id": "report-completeness-score",
  "name": "Report completeness score",
  "description": "Check presence of sections, signatures, photos, and calculations",
  "category": "Reporting and actions",
  "module": "inspect",
  "icon": "FileTextOutlined",
  "tags": [
    "report",
    "completeness",
    "score",
    "sections"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload report and set requirements", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "report", "type": "group", "title": "Report", "description": "Document to assess", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "report_pdf", "type": "upload", "title": "Report (PDF)", "label": "Report (PDF)", "required": true, "size": 12, "sectionId": "input-card", "groupId": "report", "props": { "accept": ".pdf" } },
    { "id": "require_photos", "type": "switch", "title": "Require Photos", "label": "Require Photos", "required": false, "size": 6, "sectionId": "input-card", "groupId": "report", "defaultValue": true },
    { "id": "require_calculations", "type": "switch", "title": "Require Calculations", "label": "Require Calculations", "required": false, "size": 6, "sectionId": "input-card", "groupId": "report", "defaultValue": true }
  ],
  "aiPrompt": "You are a report QA checker.\n\nContext: Report completeness — verify presence of required sections, signatures, photos, and calculations.\n\nTask: Provide a concise score limited strictly to:\n1) Missing sections/elements\n2) Completeness score (0-100)\n3) Remediation notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Report Completeness Score\n## Inputs\n## Method and Assumptions\n## Results\n- Missing Elements\n- Completeness Score\n## Summary Table\n(Use columns: Element | Status | Notes)\n## References and Standards"
};