const fs = require('fs');

// Simple test payload for workflow creation
const simpleWorkflow = {
  id: `simple_test_${Date.now()}`,
  name: "Simple Test Workflow",
  description: "A simple test workflow",
  version: 1,
  metadata: {
    id: "simple_test_workflow",
    agents: [
      {
        id: "test_agent",
        type: "DataAggregatorAgent",
        config: {
          confidence_threshold: 0.8
        }
      }
    ],
    connections: [],
    humanGates: []
  },
  status: 'active',
  tags: ['test']
};

// Save to file
fs.writeFileSync('test-simple-workflow.json', JSON.stringify(simpleWorkflow, null, 2));
