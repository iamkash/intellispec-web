const fs = require('fs');
const path = require('path');

/**
 * Test script to create and execute a workflow using the LangGraph factory
 */

async function testWorkflowCreation() {
try {
    // Load the sample workflow metadata
    const metadataPath = path.join(__dirname, 'api', 'workflows', 'metadata', 'sample-piping-inspection.json');
    const workflowMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
console.log('🤖 Agents defined:', workflowMetadata.agents?.length || 0);
console.log('👥 Human gates defined:', workflowMetadata.humanGates?.length || 0);

    // Test workflow creation payload
    const createPayload = {
      id: `test_${Date.now()}`,
      name: workflowMetadata.name,
      description: workflowMetadata.description,
      version: workflowMetadata.version,
      metadata: workflowMetadata,
      status: 'active',
      tags: ['piping', 'inspection', 'ai', 'langgraph']
    };
console.log('🔍 Workflow ID:', createPayload.id);
// Save test payload for manual testing
    const testPayloadPath = path.join(__dirname, 'test-workflow-payload.json');
    fs.writeFileSync(testPayloadPath, JSON.stringify(createPayload, null, 2));
// Test execution payload
    const executePayload = {
      initialState: {
        inspection_type: 'piping',
        equipment_tag: 'P-001',
        location: 'Unit 1, Row 5',
        audio_file: 'inspection_audio.wav',
        images: ['nameplate.jpg', 'damage.jpg', 'corrosion.jpg']
      },
      context: {
        inspector_id: 'INSPECTOR_001',
        inspection_date: new Date().toISOString(),
        facility_id: 'FACILITY_001',
        standards: ['API_570', 'API_574', 'ASME_B31_3']
      }
    };
console.log('📊 Initial state keys:', Object.keys(executePayload.initialState));
// Save execution payload for manual testing
    const executePayloadPath = path.join(__dirname, 'test-execution-payload.json');
    fs.writeFileSync(executePayloadPath, JSON.stringify(executePayload, null, 2));
console.log('\n✅ Test preparation complete!');
console.log('1. Start the API server: npm run api');
console.log('3. Execute workflow: curl -X POST http://localhost:4000/api/workflows/{workflow-id}/execute -H "Content-Type: application/json" -d @test-execution-payload.json');
} catch (error) {
    console.error('❌ Test preparation failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWorkflowCreation().catch(console.error);
