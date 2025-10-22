module.exports = {
  "id": "hold-witness-coverage-checker",
  "name": "Hold or witness coverage checker",
  "description": "Verify ITP hold and witness points were executed and recorded",
  "category": "Reporting and actions",
  "module": "inspect",
  "icon": "CheckCircleOutlined",
  "tags": [
    "hold",
    "witness",
    "coverage",
    "itp"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload ITP and evidence log", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "docs", "type": "group", "title": "Documents", "description": "ITP and evidence", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "itp_plan", "type": "upload", "title": "ITP Plan (CSV/JSON)", "label": "ITP Plan (CSV/JSON)", "required": true, "size": 12, "sectionId": "input-card", "groupId": "docs", "props": { "accept": ".csv,.json" } },
    { "id": "evidence_log", "type": "upload", "title": "Evidence Log (CSV/JSON)", "label": "Evidence Log (CSV/JSON)", "required": true, "size": 12, "sectionId": "input-card", "groupId": "docs", "props": { "accept": ".csv,.json" } },
    { "id": "tolerance_hours", "type": "number", "title": "Timing Tolerance (hours)", "label": "Timing Tolerance (hours)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "docs", "defaultValue": 2 }
  ],
  "aiPrompt": "You are a QA inspector.\n\nContext: Hold/witness coverage — determine whether ITP hold and witness points were executed and recorded in evidence.\n\nTask: Provide a concise coverage assessment limited strictly to:\n1) Coverage percent by point type\n2) Missing or late points\n3) Notes for closeout\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Hold/Witness Coverage Check\n## Inputs\n## Method and Assumptions\n## Results\n- Coverage by Type\n- Missing/Late Points\n## Summary Table\n(Use columns: Point | Planned Time | Executed Time | Status | Notes)\n## References and Standards"
};