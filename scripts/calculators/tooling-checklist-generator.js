module.exports = {
  "id": "tooling-checklist-generator",
  "name": "Tooling checklist generator",
  "description": "Build a tools and gauges list from the chosen scope and calculators",
  "category": "Ops helper",
  "module": "inspect",
  "icon": "ToolOutlined",
  "tags": [
    "tooling",
    "checklist",
    "generator",
    "scope"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter scope and method mix", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "general-inputs", "type": "group", "title": "Scope Overview", "description": "Basis and NDT methods", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "scope_basis", "type": "select", "title": "Scope Basis", "label": "Scope Basis", "required": true, "size": 8, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": "linear_length", "options": [ {"label":"Linear length","value":"linear_length"}, {"label":"Surface area","value":"surface_area"}, {"label":"Count","value":"count"} ] },
    { "id": "scope_size", "type": "number", "title": "Scope Size", "label": "Scope Size (units)", "required": true, "size": 6, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": null },
    { "id": "ndt_methods", "type": "tags", "title": "NDT Methods", "label": "NDT Methods", "required": false, "size": 10, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": [], "options": [
      {"label":"VT","value":"vt"}, {"label":"UT","value":"ut"}, {"label":"RT","value":"rt"}, {"label":"MT/PT","value":"mt_pt"}, {"label":"PAUT","value":"paut"}, {"label":"TOFD","value":"tofd"}
    ] },
    { "id": "access_method", "type": "select", "title": "Access Method", "label": "Access Method", "required": false, "size": 8, "sectionId": "input-card", "groupId": "general-inputs", "defaultValue": "ground", "options": [ {"label":"Ground","value":"ground"}, {"label":"MEWP","value":"mewp"}, {"label":"Rope access","value":"rope"}, {"label":"Scaffolding","value":"scaffold"} ] }
  ],
  "aiPrompt": "You are an expert inspection supervisor.\n\nContext: Tooling checklist — propose a concise list of tools, gauges, PPE, and consumables for the declared scope and method mix.\n\nTask: Provide a checklist limited strictly to:\n1) Tools & Gauges\n2) PPE\n3) Consumables & Accessories\n4) Special access gear (if applicable)\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Tooling Checklist\n## Inputs\n## Checklist\n- Tools & Gauges\n- PPE\n- Consumables & Accessories\n- Access Gear\n## References and Standards"
};