module.exports = {
  "id": "surface-profile-acceptance",
  "name": "Surface profile acceptance",
  "description": "Check anchor profile readings against spec window",
  "category": "Measurements",
  "module": "inspect",
  "icon": "ProfileOutlined",
  "tags": [
    "surface",
    "profile",
    "acceptance",
    "anchor"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Readings and spec window", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "spec", "type": "group", "title": "Spec", "description": "Lower/upper limits", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "spec_low_mil", "type": "number", "title": "Spec Low (mil)", "label": "Spec Low (mil)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "spec", "defaultValue": null },
    { "id": "spec_high_mil", "type": "number", "title": "Spec High (mil)", "label": "Spec High (mil)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "spec", "defaultValue": null },
    { "id": "readings", "type": "group", "title": "Readings", "description": "Upload CSV/JSON", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "profile_file", "type": "upload", "title": "Profile Readings (CSV/JSON)", "label": "Profile Readings (CSV/JSON)", "required": true, "size": 24, "sectionId": "input-card", "groupId": "readings", "props": { "accept": ".csv,.json" } }
  ],
  "aiPrompt": "You are a coatings QA.\n\nContext: Surface profile acceptance — evaluate readings vs spec window.\n\nTask: Provide a concise result limited strictly to:\n1) Percent within spec\n2) Outliers\n3) Acceptance decision\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Surface Profile Acceptance\n## Inputs\n## Method and Assumptions\n## Results\n- Within Spec\n- Outliers\n- Decision\n## References and Standards"
};