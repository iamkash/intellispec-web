const fs = require('fs');

// Read the dashboard
const dashboard = JSON.parse(fs.readFileSync('./public/data/workspaces/inspection/piping-inspection-dashboard.json', 'utf8'));
// Check each KPI for workflowId
const kpis = dashboard.gadgets[1].config.kpis;
let errors = [];

kpis.forEach((kpi, index) => {
  const baseFilter = kpi.aggregationConfig.baseFilter;

  // Check if it has either type or workflowId
  const hasType = baseFilter.type && typeof baseFilter.type === 'string';
  const hasWorkflowId = baseFilter.workflowId && typeof baseFilter.workflowId === 'string';

  if (!hasType && !hasWorkflowId) {
    errors.push(`KPI ${index} (${kpi.title}): Missing both type and workflowId in baseFilter`);
  } else if (hasWorkflowId) {
} else if (hasType) {
}
});
if (errors.length > 0) {
errors.forEach(error => console.log(`  - ${error}`));
} else {
}
