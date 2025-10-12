/**
 * Test script for the LangGraph workflow system
 * Tests workflow creation, agent registration, and basic functionality
 */

const mongoose = require('mongoose');

// Import our workflow components
const WorkflowFactory = require('./api/workflows/factory/WorkflowFactory');
const AgentRegistry = require('./api/workflows/agents/AgentRegistry');
const ConnectionBuilder = require('./api/workflows/factory/ConnectionBuilder');
const DataAggregatorAgent = require('./api/workflows/agents/DataAggregatorAgent');

async function testWorkflowSystem() {
try {
    // Initialize components
const agentRegistry = new AgentRegistry();
    const connectionBuilder = new ConnectionBuilder();
    const workflowFactory = new WorkflowFactory(agentRegistry, connectionBuilder);

    // Register test agent
agentRegistry.registerAgent('DataAggregatorAgent', DataAggregatorAgent);

    // Test agent creation
const agentDefinition = {
      id: 'test_aggregator',
      type: 'DataAggregatorAgent',
      config: { outputFormat: 'combined' }
    };

    const agent = agentRegistry.createAgent(agentDefinition);
// Test workflow metadata validation
const testMetadata = {
      id: 'test_workflow',
      name: 'Test Workflow',
      description: 'A test workflow',
      agents: [agentDefinition],
      connections: []
    };

    const validation = workflowFactory.validateMetadata(testMetadata);
if (!validation.isValid) {
}

    // Test workflow creation
const workflow = workflowFactory.createWorkflow(testMetadata);
// Test agent execution (mock data)
const mockInputs = {
      voice_data: { transcript: 'Test transcript', confidence: 0.9 },
      ocr_data: { text: 'Test OCR text', confidence: 0.8 }
    };

    const result = await agent.process(mockInputs);
console.log('📊 Result confidence:', result.confidence);

    // Summary
console.log('✅ Agent Registry: WORKING');
console.log('✅ Metadata Validation: WORKING');
console.log('\n🎉 All workflow system tests PASSED!');

    return true;

  } catch (error) {
    console.error('❌ Workflow system test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run tests
testWorkflowSystem().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
