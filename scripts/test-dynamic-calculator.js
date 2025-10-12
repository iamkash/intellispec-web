// Test the dynamic calculator framework
// Usage: node scripts/test-dynamic-calculator.js

const path = require('path');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

async function testDynamicCalculator() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });

  const db = mongoose.connection.db;
  const calculatorsCol = db.collection('calculators');
// Test calculator with proper uiDefinition format
  const testCalculator = {
    id: 'test-dynamic-calculator',
    name: 'Test Dynamic Calculator',
    description: 'A test calculator for the dynamic framework',
    category: 'Testing',
    module: 'inspect',
    icon: 'CalculatorOutlined',
    tags: ['test', 'dynamic', 'framework'],

    // Proper uiDefinition format
    uiDefinition: {
      sections: [
        {
          id: 'input-section',
          type: 'section',
          title: 'Test Inputs',
          description: 'Enter test values',
          icon: 'FormOutlined',
          order: 1,
          size: 24,
          groups: [
            {
              id: 'input-group',
              type: 'group',
              title: 'Test Parameters',
              description: 'Test input parameters',
              sectionId: 'input-section',
              order: 1,
              size: 24,
              collapsible: false,
              fields: [
                {
                  id: 'test_value',
                  type: 'number',
                  title: 'Test Value',
                  label: 'Test Value',
                  placeholder: 'Enter a test value',
                  required: true,
                  size: 12,
                  sectionId: 'input-section',
                  groupId: 'input-group',
                  defaultValue: null
                }
              ]
            }
          ]
        },
        {
          id: 'output-section',
          type: 'section',
          title: 'Test Results',
          description: 'Calculated test results',
          icon: 'BarChartOutlined',
          order: 2,
          size: 24,
          groups: [
            {
              id: 'output-group',
              type: 'group',
              title: 'Results',
              description: 'Test calculation results',
              sectionId: 'output-section',
              order: 1,
              size: 24,
              collapsible: false,
              fields: [
                {
                  id: 'test_result',
                  type: 'number',
                  title: 'Test Result',
                  label: 'Test Result (doubled)',
                  size: 12,
                  sectionId: 'output-section',
                  groupId: 'output-group',
                  readonly: true,
                  calculated: true,
                  formula: 'test_double(test_value)'
                }
              ]
            }
          ]
        }
      ]
    },

    // Calculation definitions
    calculations: [
      {
        fieldId: 'test_result',
        formula: 'test_double(test_value)',
        dependencies: ['test_value']
      }
    ],

    // AI Prompts for rationale and steps
    aiPrompts: {
      rationale: 'Explain the test calculation that doubles the input value.',
      steps: 'Provide step-by-step explanation of how the test value is doubled.'
    }
  };

  try {
    // Insert test calculator
    await calculatorsCol.insertOne(testCalculator);
// Verify it can be retrieved
    const retrieved = await calculatorsCol.findOne({ id: 'test-dynamic-calculator' });
if (retrieved) {
console.log('📋 Sections count:', retrieved.uiDefinition?.sections?.length || 0);
}

  } catch (error) {
    console.error('❌ Error testing dynamic calculator:', error.message);
  }

  await mongoose.connection.close();
}

testDynamicCalculator().catch(console.error);
