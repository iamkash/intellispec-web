module.exports = {
  "id": "surface-salt-contamination-estimate",
  "name": "Surface salt contamination estimate",
  "description": "Convert Bresle test results to mg/m² and compare to spec",
  "category": "Environment",
  "module": "inspect",
  "icon": "ExperimentOutlined",
  "tags": [
    "surface",
    "salt",
    "contamination",
    "bresle"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Bresle readings and volume", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "readings", "type": "group", "title": "Bresle Readings", "description": "Conductivity and volumes", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "conductivity_us_cm", "type": "number", "title": "Conductivity (µS/cm)", "label": "Conductivity (µS/cm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "readings", "defaultValue": null },
    { "id": "patch_volume_ml", "type": "number", "title": "Patch Volume (mL)", "label": "Patch Volume (mL)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "readings", "defaultValue": 15 },
    { "id": "area_cm2", "type": "number", "title": "Test Area (cm²)", "label": "Test Area (cm²)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "readings", "defaultValue": 12.5 },
    { "id": "spec_mg_m2", "type": "number", "title": "Spec (mg/m²)", "label": "Spec (mg/m²)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "readings", "defaultValue": 5 }
  ],
  "aiPrompt": "You are a surface prep QA.\n\nContext: Surface salt contamination — convert Bresle results to mg/m² and compare to spec.\n\nTask: Provide a concise result limited strictly to:\n1) Calculated mg/m²\n2) Pass/Fail vs spec\n3) Notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Surface Salt Contamination Estimate\n## Inputs\n## Method and Assumptions\n## Calculations\n- mg/m²\n- Pass/Fail\n## References and Standards"
};