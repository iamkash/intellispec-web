module.exports = {
  "id": "holiday-test-voltage-selector",
  "name": "Holiday test voltage selector",
  "description": "Recommend holiday test voltage from coating type and thickness",
  "category": "Measurements",
  "module": "inspect",
  "icon": "ThunderboltOutlined",
  "tags": [
    "holiday",
    "test",
    "voltage",
    "coating"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter coating details", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "coating", "type": "group", "title": "Coating", "description": "Type and thickness", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "coating_type", "type": "select", "title": "Coating Type", "label": "Coating Type", "required": true, "size": 8, "sectionId": "input-card", "groupId": "coating", "defaultValue": "thin_film", "options": [ {"label":"Thin film","value":"thin_film"}, {"label":"High-build","value":"high_build"} ] },
    { "id": "coating_thickness_microns", "type": "number", "title": "Coating Thickness (µm)", "label": "Coating Thickness (µm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "coating", "defaultValue": null }
  ],
  "aiPrompt": "You are a coatings inspector.\n\nContext: Holiday test voltage selection — recommend test voltage based on coating type and thickness.\n\nTask: Provide a concise recommendation limited strictly to:\n1) Test method and voltage\n2) Rationale\n3) Safety notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Holiday Test Voltage Selector\n## Inputs\n## Method and Assumptions\n## Recommendation\n- Method\n- Voltage\n- Notes\n## References and Standards"
};