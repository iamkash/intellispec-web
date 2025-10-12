module.exports = {
  "id": "device-battery-plan",
  "name": "Device battery plan",
  "description": "Estimate device battery and spare packs needed based on photo and video load",
  "category": "Planning",
  "module": "inspect",
  "icon": "ThunderboltOutlined",
  "tags": [
    "battery",
    "device",
    "planning",
    "spare"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter capture workload and device specs", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "workload", "type": "group", "title": "Capture Workload", "description": "Photos and videos planned", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "photos_planned", "type": "number", "title": "Photos Planned", "label": "Photos Planned", "required": true, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 500 },
    { "id": "video_minutes", "type": "number", "title": "Video Minutes", "label": "Video Minutes", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 10 },
    { "id": "flash_usage", "type": "select", "title": "Flash Usage", "label": "Flash Usage", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": "medium", "options": [ { "label": "Low", "value": "low" }, { "label": "Medium", "value": "medium" }, { "label": "High", "value": "high" } ] },

    { "id": "device-specs", "type": "group", "title": "Device Specs", "description": "Battery capacity and consumption", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "battery_capacity_mah", "type": "number", "title": "Battery Capacity (mAh)", "label": "Battery Capacity (mAh)", "required": true, "size": 6, "sectionId": "input-card", "groupId": "device-specs", "defaultValue": 4000 },
    { "id": "avg_photo_mah", "type": "number", "title": "Consumption per Photo (mAh)", "label": "Consumption per Photo (mAh)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "device-specs", "defaultValue": 3 },
    { "id": "avg_video_mah_min", "type": "number", "title": "Consumption per Video Minute (mAh/min)", "label": "Consumption per Video Minute (mAh/min)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "device-specs", "defaultValue": 60 },
    { "id": "cold_weather", "type": "switch", "title": "Cold Weather", "label": "Cold Weather", "required": false, "size": 6, "sectionId": "input-card", "groupId": "device-specs", "defaultValue": false },

    { "id": "spares", "type": "group", "title": "Spares & Charging", "description": "Packs and charge opportunities", "sectionId": "input-card", "order": 3, "size": 24, "collapsible": true },
    { "id": "packs_available", "type": "number", "title": "Packs Available", "label": "Packs Available", "required": false, "size": 6, "sectionId": "input-card", "groupId": "spares", "defaultValue": 2 },
    { "id": "fast_charge_available", "type": "switch", "title": "Fast Charge Available", "label": "Fast Charge Available", "required": false, "size": 6, "sectionId": "input-card", "groupId": "spares", "defaultValue": false }
  ],
  "aiPrompt": "You are an expert field operations planner.\n\nContext: Device battery planning — estimate required battery packs and charge stops to complete planned capture workload given device consumption and conditions.\n\nTask: Provide a concise plan limited strictly to:\n1) Estimated consumption (photos, video, modifiers)\n2) Packs needed and charge opportunities\n3) Safety margin recommendation\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Device Battery Plan\n## Inputs\n## Method and Assumptions\n## Calculations\n- Estimated Consumption\n- Packs Required\n- Charge Opportunities\n- Safety Margin\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};