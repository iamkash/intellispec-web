module.exports = {
  "id": "corrosion-severity-class",
  "name": "Corrosion severity class",
  "description": "Classify corrosion by pit depth and area coverage with action thresholds",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "AlertOutlined",
  "tags": [
    "corrosion",
    "severity",
    "class",
    "thresholds"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter pit depth and area coverage", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "pitting", "type": "group", "title": "Pitting", "description": "Depth and coverage", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "max_pit_depth_mm", "type": "number", "title": "Max Pit Depth (mm)", "label": "Max Pit Depth (mm)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "pitting", "defaultValue": null },
    { "id": "area_coverage_pct", "type": "number", "title": "Area Coverage (%)", "label": "Area Coverage (%)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "pitting", "defaultValue": null },
    { "id": "wall", "type": "group", "title": "Wall Thickness Context (optional)", "description": "Provide nominal/min thickness for relative classification", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "t_nominal_mm", "type": "number", "title": "Nominal Thickness (mm)", "label": "Nominal Thickness (mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "wall", "defaultValue": null },
    { "id": "t_min_mm", "type": "number", "title": "Minimum Allowable (Tmin, mm)", "label": "Minimum Allowable (Tmin, mm)", "required": false, "size": 8, "sectionId": "input-card", "groupId": "wall", "defaultValue": null }
  ],
  "aiPrompt": "You are a corrosion assessor.\n\nContext: Corrosion severity class — classify severity using a two-parameter matrix (pit depth and affected area). If nominal or minimum allowable thickness is provided, compute relative depth ratios (depth/nominal and depth/(nominal - Tmin)) and prefer a relative classification. Otherwise, apply absolute depth thresholds.\n\nTask: Provide a concise classification limited strictly to:\n1) Severity class\n2) Drivers (depth, area, and relative ratios if thickness context present)\n3) Recommended actions\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Corrosion Severity Class\n## Inputs\n## Method and Assumptions\n## Result\n- Severity Class\n- Drivers\n- Actions\n## References and Standards"
};