module.exports = {
  "id": "photo-pose-guide-recommender",
  "name": "Photo pose guide recommender",
  "description": "Recommend shot list and angles by asset and anomaly type",
  "category": "Visual scoring",
  "module": "inspect",
  "icon": "CameraOutlined",
  "tags": [
    "photo",
    "pose",
    "guide",
    "anomaly"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Select asset and anomaly to create pose guide", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "context", "type": "group", "title": "Context", "description": "Asset and anomaly", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "asset_type", "type": "select", "title": "Asset Type", "label": "Asset Type", "required": true, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": "piping", "options": [ {"label":"Piping","value":"piping"}, {"label":"Vessel","value":"vessel"}, {"label":"Tank","value":"tank"} ] },
    { "id": "anomaly_type", "type": "select", "title": "Anomaly Type", "label": "Anomaly Type", "required": true, "size": 8, "sectionId": "input-card", "groupId": "context", "defaultValue": "corrosion", "options": [ {"label":"Corrosion","value":"corrosion"}, {"label":"Leak","value":"leak"}, {"label":"Coating damage","value":"coating_damage"} ] }
  ],
  "aiPrompt": "You are a visual documentation specialist.\n\nContext: Photo pose guide — recommend shot list and angles for the selected asset and anomaly type.\n\nTask: Provide a concise pose guide limited strictly to:\n1) Required shots (angles/positions)\n2) Lens/zoom and lighting tips\n3) Safety and access notes\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Photo Pose Guide\n## Inputs\n## Method and Assumptions\n## Recommendations\n- Shots and Angles\n- Camera/Lighting Tips\n- Safety/Access Notes\n## References and Standards"
};