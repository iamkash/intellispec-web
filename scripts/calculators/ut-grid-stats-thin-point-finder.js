module.exports = {
  "id": "ut-grid-stats-thin-point-finder",
  "name": "UT grid stats and thin point finder",
  "description": "Compute min, mean, std dev, and flags below Tmin and Tmin plus CA",
  "category": "Measurements",
  "module": "inspect",
  "icon": "DotChartOutlined",
  "tags": [
    "ut",
    "grid",
    "stats",
    "thin",
    "point"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload grid data and set limits", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "grid", "type": "group", "title": "Grid Data", "description": "CSV/JSON readings", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "grid_file", "type": "upload", "title": "Grid Data (CSV/JSON)", "label": "Grid Data (CSV/JSON)", "required": true, "size": 24, "sectionId": "input-card", "groupId": "grid", "props": { "accept": ".csv,.json" } },
    { "id": "tmin_mm", "type": "number", "title": "Tmin (mm)", "label": "Tmin (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "grid", "defaultValue": null },
    { "id": "ca_mm", "type": "number", "title": "Corrosion Allowance (mm)", "label": "Corrosion Allowance (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "grid", "defaultValue": null }
  ],
  "aiPrompt": "You are a UT analyst.\n\nContext: UT grid stats — compute statistics and flag thin points vs Tmin and Tmin+CA.\n\nTask: Provide a concise analysis limited strictly to:\n1) Min/mean/std dev\n2) Points below Tmin and Tmin+CA\n3) Heatmap/cluster notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# UT Grid Statistics\n## Inputs\n## Method and Assumptions\n## Calculations\n- Statistics\n- Thin Points\n## Summary Table\n(Use columns: Metric | Value | Units | Notes)\n## References and Standards"
};