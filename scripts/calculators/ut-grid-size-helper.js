module.exports = {
  "id": "ut-grid-size-helper",
  "name": "UT grid size helper",
  "description": "Suggest rows, columns, and pitch for UT grids in suspect areas",
  "category": "Planning",
  "module": "inspect",
  "icon": "TableOutlined",
  "tags": [
    "ut",
    "grid",
    "thickness",
    "measurement"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Area dimensions and desired resolution", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "area", "type": "group", "title": "Area", "description": "Width/height and min pitch", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "width_mm", "type": "number", "title": "Width (mm)", "label": "Width (mm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "area", "defaultValue": null },
    { "id": "height_mm", "type": "number", "title": "Height (mm)", "label": "Height (mm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "area", "defaultValue": null },
    { "id": "min_pitch_mm", "type": "number", "title": "Minimum Pitch (mm)", "label": "Minimum Pitch (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "area", "defaultValue": 25 }
  ],
  "aiPrompt": "You are a UT planner.\n\nContext: UT grid size — propose rows, columns, and pitch for a rectangular area given width/height and minimum pitch.\n\nTask: Provide a concise plan limited strictly to:\n1) Rows and columns\n2) Pitch recommendation\n3) Notes for coverage vs effort\n\nOutput a professional Markdown report with ONLY these sections:\n\n# UT Grid Size Helper\n## Inputs\n## Method and Assumptions\n## Recommendation\n- Rows/Columns\n- Pitch\n- Notes\n## References and Standards"
};