module.exports = {
  "id": "dft-statistics-coatings",
  "name": "DFT statistics for coatings",
  "description": "Analyze DFT readings for mean, std dev, and percent within spec",
  "category": "Measurements",
  "module": "inspect",
  "icon": "BarChartOutlined",
  "tags": [
    "dft",
    "statistics",
    "coatings",
    "spec"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Readings and spec window", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "spec", "type": "group", "title": "Spec", "description": "Lower/upper limits", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "spec_low_mil", "type": "number", "title": "Spec Low (mil)", "label": "Spec Low (mil)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "spec", "defaultValue": null },
    { "id": "spec_high_mil", "type": "number", "title": "Spec High (mil)", "label": "Spec High (mil)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "spec", "defaultValue": null },
    { "id": "readings", "type": "group", "title": "Readings", "description": "Upload CSV/JSON of DFT", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "dft_file", "type": "upload", "title": "DFT Readings (CSV/JSON)", "label": "DFT Readings (CSV/JSON)", "required": true, "size": 24, "sectionId": "input-card", "groupId": "readings", "props": { "accept": ".csv,.json" } }
  ],
  "aiPrompt": "You are a coatings statistician.\n\nContext: DFT statistics — compute mean, std dev, and percent within spec.\n\nTask: Provide a concise analysis limited strictly to:\n1) Mean and std dev\n2) Percent within spec window\n3) Outliers and recommendations\n\nOutput a professional Markdown report with ONLY these sections:\n\n# DFT Statistics for Coatings\n## Inputs\n## Method and Assumptions\n## Calculations\n- Mean\n- Std Dev\n- Percent Within Spec\n## References and Standards"
};