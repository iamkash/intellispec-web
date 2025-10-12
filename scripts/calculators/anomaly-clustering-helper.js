module.exports = {
  "id": "anomaly-clustering-helper",
  "name": "Anomaly clustering helper",
  "description": "Group nearby defects and compute representative severity",
  "category": "Reporting and actions",
  "module": "inspect",
  "icon": "ClusterOutlined",
  "tags": [
    "anomaly",
    "clustering",
    "helper",
    "defects"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload anomalies and set clustering radius", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "anomalies", "type": "group", "title": "Anomalies", "description": "CSV/JSON of coordinates & severity", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "anomaly_file", "type": "upload", "title": "Anomaly Data (CSV/JSON)", "label": "Anomaly Data (CSV/JSON)", "required": false, "size": 24, "sectionId": "input-card", "groupId": "anomalies", "props": { "accept": ".csv,.json" } },
    { "id": "radius_m", "type": "number", "title": "Clustering Radius (m)", "label": "Clustering Radius (m)", "required": true, "size": 8, "sectionId": "input-card", "groupId": "anomalies", "defaultValue": 5 },
    { "id": "method", "type": "select", "title": "Method", "label": "Method", "required": false, "size": 8, "sectionId": "input-card", "groupId": "anomalies", "defaultValue": "dbscan", "options": [ {"label":"DBSCAN","value":"dbscan"}, {"label":"Grid","value":"grid"} ] }
  ],
  "aiPrompt": "You are a data analyst.\n\nContext: Anomaly clustering — group nearby anomalies and compute representative severity for clusters.\n\nTask: Provide a concise clustering summary limited strictly to:\n1) Number of clusters and noise points\n2) Per-cluster representative severity (min/mean/max)\n3) Notable clusters (size, severity)\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Anomaly Clustering Summary\n## Inputs\n## Method and Assumptions\n## Results\n- Cluster Counts\n- Representative Severity\n- Notable Clusters\n## Summary Table\n(Use columns: Cluster | Count | Representative Severity | Notes)\n## References and Standards"
};