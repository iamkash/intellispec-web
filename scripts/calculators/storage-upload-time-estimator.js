module.exports = {
  "id": "storage-upload-time-estimator",
  "name": "Storage and upload time estimator",
  "description": "Estimate storage needed and upload time for planned evidence volume",
  "category": "Planning",
  "module": "inspect",
  "icon": "CloudUploadOutlined",
  "tags": [
    "storage",
    "upload",
    "time",
    "evidence"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Enter capture volumes and network", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "workload", "type": "group", "title": "Volumes", "description": "Photo/video counts and sizes", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "photos_count", "type": "number", "title": "Photos Count", "label": "Photos Count", "required": true, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 500 },
    { "id": "avg_photo_mb", "type": "number", "title": "Avg Photo Size (MB)", "label": "Avg Photo Size (MB)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 3 },
    { "id": "video_minutes", "type": "number", "title": "Video Minutes", "label": "Video Minutes", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 10 },
    { "id": "avg_video_mbps", "type": "number", "title": "Avg Video Bitrate (Mbps)", "label": "Avg Video Bitrate (Mbps)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "workload", "defaultValue": 20 },

    { "id": "network", "type": "group", "title": "Network", "description": "Upload bandwidth and availability", "sectionId": "input-card", "order": 2, "size": 24, "collapsible": true },
    { "id": "upload_mbps", "type": "number", "title": "Upload Bandwidth (Mbps)", "label": "Upload Bandwidth (Mbps)", "required": true, "size": 6, "sectionId": "input-card", "groupId": "network", "defaultValue": 10 },
    { "id": "bandwidth_utilization_pct", "type": "number", "title": "Usable Bandwidth (%)", "label": "Usable Bandwidth (%)", "required": false, "size": 6, "sectionId": "input-card", "groupId": "network", "defaultValue": 70 }
  ],
  "aiPrompt": "You are a data logistics planner.\n\nContext: Storage & upload estimation — compute storage required and upload time for planned capture.\n\nTask: Provide a concise estimate limited strictly to:\n1) Total storage (MB/GB)\n2) Upload duration (hh:mm) with utilization\n3) Recommendations for batching/compression\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Storage & Upload Time Estimate\n## Inputs\n## Method and Assumptions\n## Calculations\n- Storage Required\n- Upload Duration\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};