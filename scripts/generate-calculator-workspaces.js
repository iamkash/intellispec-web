// Script to generate calculator workspace files from database
// Usage: node scripts/generate-calculator-workspaces.js

const path = require('path');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

async function generateCalculatorWorkspaces() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });
  const db = mongoose.connection.db;
  const calculatorsCol = db.collection('calculators');
// Get all calculators
  const calculators = await calculatorsCol.find({
    tenantId: 'default',
    module: 'inspect',
    deleted: { $ne: true }
  }).toArray();
const calculatorsDir = path.join(__dirname, '..', 'public', 'data', 'workspaces', 'calculators');

  // Ensure directory exists
  if (!fs.existsSync(calculatorsDir)) {
    fs.mkdirSync(calculatorsDir, { recursive: true });
  }

  for (const calculator of calculators) {
    const workspacePath = path.join(calculatorsDir, `${calculator.id}.json`);

    // Generate workspace based on calculator category
    const workspaceData = generateWorkspaceForCalculator(calculator);

    fs.writeFileSync(workspacePath, JSON.stringify(workspaceData, null, 2));
}
await mongoose.disconnect();
}

function generateWorkspaceForCalculator(calculator) {
  // Base workspace structure
  const workspace = {
    id: `calculator-${calculator.id}`,
    type: 'form',
    title: calculator.name,
    description: calculator.description,
    icon: calculator.icon,
    mode: 'form',
    layout: 'form',
    gadgets: [
      {
        id: 'calculator-form-gadget',
        type: 'document-form-gadget',
        title: calculator.name,
        config: {
          dataUrl: `/api/calculators/${calculator.id}/metadata`,
          mode: 'form',
          gadgetOptions: [
            {
              id: 'input-section',
              type: 'section',
              title: 'Input Parameters',
              description: 'Enter the required input values',
              icon: 'FormOutlined',
              order: 1,
              size: 24
            },
            {
              id: 'input-group',
              type: 'group',
              title: 'Parameters',
              description: 'Input parameters for calculation',
              sectionId: 'input-section',
              order: 1,
              size: 24,
              collapsible: false
            },
            {
              id: 'output-section',
              type: 'section',
              title: 'Calculation Results',
              description: 'Calculated values and results',
              icon: 'BarChartOutlined',
              order: 2,
              size: 24
            },
            {
              id: 'output-group',
              type: 'group',
              title: 'Results',
              description: 'Calculation results',
              sectionId: 'output-section',
              order: 1,
              size: 24,
              collapsible: false
            },
            {
              id: 'rationale-section',
              type: 'section',
              title: 'Rationale & Explanation',
              description: 'AI-generated explanation of calculations',
              icon: 'BulbOutlined',
              order: 3,
              size: 24
            },
            {
              id: 'rationale-group',
              type: 'group',
              title: 'Explanation',
              description: 'Calculation rationale',
              sectionId: 'rationale-section',
              order: 1,
              size: 24,
              collapsible: false
            },
            {
              id: 'rationale-text',
              type: 'textarea',
              title: 'Calculation Rationale',
              label: 'Calculation Rationale',
              size: 24,
              sectionId: 'rationale-section',
              groupId: 'rationale-group',
              readonly: true,
              rows: 6
            },
            {
              id: 'steps-section',
              type: 'section',
              title: 'Calculation Steps',
              description: 'Detailed step-by-step calculation process',
              icon: 'OrderedListOutlined',
              order: 4,
              size: 24
            },
            {
              id: 'steps-group',
              type: 'group',
              title: 'Steps',
              description: 'Step-by-step process',
              sectionId: 'steps-section',
              order: 1,
              size: 24,
              collapsible: false
            },
            {
              id: 'steps-text',
              type: 'textarea',
              title: 'Step-by-Step Process',
              label: 'Step-by-Step Process',
              size: 24,
              sectionId: 'steps-section',
              groupId: 'steps-group',
              readonly: true,
              rows: 8
            }
          ]
        }
      }
    ]
  };

  // Add category-specific input fields
  const inputFields = generateInputFieldsForCategory(calculator.category);
  workspace.gadgets[0].config.gadgetOptions.splice(2, 0, ...inputFields);

  // Add category-specific output fields
  const outputFields = generateOutputFieldsForCategory(calculator.category);
  workspace.gadgets[0].config.gadgetOptions.splice(4, 0, ...outputFields);

  return workspace;
}

function generateInputFieldsForCategory(category) {
  // Generate input fields based on calculator category
  const fields = [];

  switch (category) {
    case 'Planning':
      fields.push(
        {
          id: 'asset_type',
          type: 'select',
          title: 'Asset Type',
          label: 'Asset Type',
          placeholder: 'Select asset type',
          required: true,
          size: 12,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: '',
          options: [
            { label: 'Pipeline', value: 'pipeline' },
            { label: 'Vessel', value: 'vessel' },
            { label: 'Tank', value: 'tank' },
            { label: 'Heat Exchanger', value: 'heat_exchanger' }
          ]
        },
        {
          id: 'scope_size',
          type: 'number',
          title: 'Scope Size',
          label: 'Scope Size (units)',
          placeholder: 'Enter scope size',
          required: true,
          size: 12,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: null
        }
      );
      break;

    case 'Environment':
      fields.push(
        {
          id: 'temperature',
          type: 'number',
          title: 'Temperature',
          label: 'Temperature (°F)',
          placeholder: 'Enter temperature',
          required: true,
          size: 8,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: null
        },
        {
          id: 'humidity',
          type: 'number',
          title: 'Humidity',
          label: 'Relative Humidity (%)',
          placeholder: 'Enter humidity',
          required: true,
          size: 8,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: null
        },
        {
          id: 'wind_speed',
          type: 'number',
          title: 'Wind Speed',
          label: 'Wind Speed (mph)',
          placeholder: 'Enter wind speed',
          size: 8,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: null
        }
      );
      break;

    case 'Measurements':
      fields.push(
        {
          id: 'measurement_value',
          type: 'number',
          title: 'Measurement Value',
          label: 'Measurement Value',
          placeholder: 'Enter measurement',
          required: true,
          size: 12,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: null
        },
        {
          id: 'specification',
          type: 'number',
          title: 'Specification',
          label: 'Specification Value',
          placeholder: 'Enter specification',
          required: true,
          size: 12,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: null
        }
      );
      break;

    default:
      fields.push(
        {
          id: 'input_value',
          type: 'number',
          title: 'Input Value',
          label: 'Input Value',
          placeholder: 'Enter value',
          required: true,
          size: 24,
          sectionId: 'input-section',
          groupId: 'input-group',
          defaultValue: null
        }
      );
  }

  return fields;
}

function generateOutputFieldsForCategory(category) {
  // Generate output fields based on calculator category
  const fields = [];

  switch (category) {
    case 'Planning':
      fields.push(
        {
          id: 'estimated_result',
          type: 'number',
          title: 'Estimated Result',
          label: 'Estimated Result',
          size: 12,
          sectionId: 'output-section',
          groupId: 'output-group',
          readonly: true,
          calculated: true,
          formula: `calculate_${category.toLowerCase().replace(' ', '_')}_result(asset_type, scope_size)`
        }
      );
      break;

    case 'Environment':
      fields.push(
        {
          id: 'dew_point',
          type: 'number',
          title: 'Dew Point',
          label: 'Dew Point (°F)',
          size: 12,
          sectionId: 'output-section',
          groupId: 'output-group',
          readonly: true,
          calculated: true,
          formula: 'calculate_dew_point(temperature, humidity)'
        },
        {
          id: 'condensation_risk',
          type: 'select',
          title: 'Condensation Risk',
          label: 'Condensation Risk Level',
          size: 12,
          sectionId: 'output-section',
          groupId: 'output-group',
          readonly: true,
          calculated: true,
          formula: 'assess_condensation_risk(dew_point, temperature)',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' }
          ]
        }
      );
      break;

    case 'Measurements':
      fields.push(
        {
          id: 'analysis_result',
          type: 'number',
          title: 'Analysis Result',
          label: 'Analysis Result',
          size: 12,
          sectionId: 'output-section',
          groupId: 'output-group',
          readonly: true,
          calculated: true,
          formula: 'analyze_measurement(measurement_value, specification)'
        },
        {
          id: 'compliance_status',
          type: 'select',
          title: 'Compliance Status',
          label: 'Compliance Status',
          size: 12,
          sectionId: 'output-section',
          groupId: 'output-group',
          readonly: true,
          calculated: true,
          formula: 'check_measurement_compliance(measurement_value, specification)',
          options: [
            { label: 'Within Spec', value: 'within_spec' },
            { label: 'Out of Spec', value: 'out_of_spec' },
            { label: 'Critical', value: 'critical' }
          ]
        }
      );
      break;

    default:
      fields.push(
        {
          id: 'calculated_result',
          type: 'number',
          title: 'Calculated Result',
          label: 'Calculated Result',
          size: 24,
          sectionId: 'output-section',
          groupId: 'output-group',
          readonly: true,
          calculated: true,
          formula: 'calculate_result(input_value)'
        }
      );
  }

  return fields;
}

generateCalculatorWorkspaces().catch(console.error);
