// Update existing calculators with UI definitions
// Usage: node scripts/update-calculator-metadata.js

const path = require('path');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

// Calculator UI definitions
const calculatorDefinitions = {
  'scope-sizing': {
    uiDefinition: {
      sections: [
        {
          id: 'input-section',
          type: 'section',
          title: 'Input Parameters',
          description: 'Enter the required input values',
          icon: 'FormOutlined',
          order: 1,
          size: 24,
          groups: [
            {
              id: 'input-group',
              type: 'group',
              title: 'Parameters',
              description: 'Input parameters for calculation',
              sectionId: 'input-section',
              order: 1,
              size: 24,
              collapsible: false,
              fields: [
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
              ]
            }
          ]
        },
        {
          id: 'output-section',
          type: 'section',
          title: 'Calculation Results',
          description: 'Calculated values and results',
          icon: 'BarChartOutlined',
          order: 2,
          size: 24,
          groups: [
            {
              id: 'output-group',
              type: 'group',
              title: 'Results',
              description: 'Calculation results',
              sectionId: 'output-section',
              order: 1,
              size: 24,
              collapsible: false,
              fields: [
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
                  formula: 'calculate_planning_result(asset_type, scope_size)'
                }
              ]
            }
          ]
        }
      ]
    },
    calculations: [
      {
        fieldId: 'estimated_result',
        formula: 'calculate_planning_result(asset_type, scope_size)',
        dependencies: ['asset_type', 'scope_size']
      }
    ],
    aiPrompts: {
      rationale: 'Explain the scope sizing calculation for {asset_type} with scope size {scope_size}. Provide industry-standard reasoning.',
      steps: 'Provide detailed step-by-step calculation process for scope sizing based on asset type and size parameters.'
    },

    // Enhanced AI Configuration for professional analysis
    aiConfig: {
      model: 'gpt-5-turbo',
      temperature: 0.1,
      maxTokens: 4000,

      // Professional prompts for comprehensive analysis
      analysisPrompt: `You are an expert NDT (Non-Destructive Testing) inspector with 20+ years of experience in industrial asset integrity management. Analyze the following scope sizing requirements and provide a comprehensive professional assessment.

Asset Type: {asset_type}
Scope Size: {scope_size}
Additional Context: {additional_context}

Provide a detailed analysis including:
1. **Scope Assessment**: Evaluate the inspection scope requirements based on industry standards (API, ASME, etc.)
2. **Resource Requirements**: Calculate manpower, equipment, and time requirements
3. **Risk Analysis**: Identify potential challenges and mitigation strategies
4. **Cost Estimation**: Provide detailed cost breakdown with industry benchmarks
5. **Quality Assurance**: Outline QA/QC measures and acceptance criteria

Format your response as a professional inspection report with:
- Executive Summary
- Detailed Analysis Tables
- Risk Assessment Matrix
- Recommendations
- Step-by-step Implementation Plan

Use industry terminology and provide specific, actionable insights.`,

      rationalePrompt: `As a senior NDT Level III inspector, explain the reasoning behind the scope sizing assessment for {asset_type} with scope size {scope_size}. Include:
- Industry standard references (API 510, API 570, ASME codes)
- Technical justification for the selected approach
- Potential impact on asset integrity and safety
- Alternative methodologies considered and why they were not selected`,

      stepsPrompt: `Provide a detailed, step-by-step implementation plan for the scope sizing assessment. Include:
1. Pre-inspection preparation requirements
2. Field execution procedures
3. Data collection and analysis methods
4. Reporting and documentation requirements
5. Quality control checkpoints
6. Safety considerations

Format as a numbered checklist with specific actions, responsible parties, and completion criteria.`
    },

    // Multimodal Input Configuration
    inputConfig: {
      voiceEnabled: true,
      imageEnabled: true,
      textAreas: [
        {
          id: 'additional_context',
          title: 'Additional Context',
          placeholder: 'Describe any specific concerns, previous inspection history, or special requirements...',
          required: false,
          maxLength: 2000
        },
        {
          id: 'special_requirements',
          title: 'Special Requirements',
          placeholder: 'Any special access requirements, confined spaces, or environmental considerations...',
          required: false,
          maxLength: 1000
        }
      ],
      imageUploads: [
        {
          id: 'asset_diagram',
          title: 'Asset Diagram/Sketch',
          description: 'Upload asset layout, P&ID sections, or inspection drawings',
          multiple: false,
          maxSize: 10, // MB
          acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
        },
        {
          id: 'reference_photos',
          title: 'Reference Photos',
          description: 'Upload reference photos of similar assets or previous inspections',
          multiple: true,
          maxSize: 5,
          acceptedTypes: ['image/jpeg', 'image/png']
        }
      ]
    },

    // Professional UI Configuration
    uiConfig: {
      theme: 'professional',
      layout: 'analysis',
      accentColor: '#1890ff',
      showProgressIndicator: true,
      enableVoiceCommands: true,
      autoSave: true,
      exportFormats: ['pdf', 'word', 'excel'],
      realTimeCollaboration: false
    }
  },

  'sampling-plan-cmls': {
    uiDefinition: {
      sections: [
        {
          id: 'input-section',
          type: 'section',
          title: 'Input Parameters',
          description: 'Enter the CML sampling parameters',
          icon: 'FormOutlined',
          order: 1,
          size: 24,
          groups: [
            {
              id: 'input-group',
              type: 'group',
              title: 'CML Parameters',
              description: 'Parameters for CML sampling calculation',
              sectionId: 'input-section',
              order: 1,
              size: 24,
              collapsible: false,
              fields: [
                {
                  id: 'pipe_length',
                  type: 'number',
                  title: 'Pipe Length',
                  label: 'Pipe Length (feet)',
                  placeholder: 'Enter pipe length',
                  required: true,
                  size: 12,
                  sectionId: 'input-section',
                  groupId: 'input-group',
                  defaultValue: null
                },
                {
                  id: 'num_fittings',
                  type: 'number',
                  title: 'Number of Fittings',
                  label: 'Number of Fittings',
                  placeholder: 'Enter number of fittings',
                  required: true,
                  size: 12,
                  sectionId: 'input-section',
                  groupId: 'input-group',
                  defaultValue: 0
                }
              ]
            }
          ]
        },
        {
          id: 'output-section',
          type: 'section',
          title: 'Sampling Results',
          description: 'Calculated sampling plan results',
          icon: 'BarChartOutlined',
          order: 2,
          size: 24,
          groups: [
            {
              id: 'output-group',
              type: 'group',
              title: 'Results',
              description: 'Sampling calculation results',
              sectionId: 'output-section',
              order: 1,
              size: 24,
              collapsible: false,
              fields: [
                {
                  id: 'min_cmls',
                  type: 'number',
                  title: 'Minimum CMLs',
                  label: 'Minimum CMLs Required',
                  size: 12,
                  sectionId: 'output-section',
                  groupId: 'output-group',
                  readonly: true,
                  calculated: true,
                  formula: 'calculate_min_cmls(pipe_length, num_fittings)'
                },
                {
                  id: 'grid_density',
                  type: 'number',
                  title: 'Grid Density',
                  label: 'Suggested Grid Density (points/ft)',
                  size: 12,
                  sectionId: 'output-section',
                  groupId: 'output-group',
                  readonly: true,
                  calculated: true,
                  formula: 'calculate_grid_density(pipe_length, num_fittings)'
                }
              ]
            }
          ]
        }
      ]
    },
    calculations: [
      {
        fieldId: 'min_cmls',
        formula: 'calculate_min_cmls(pipe_length, num_fittings)',
        dependencies: ['pipe_length', 'num_fittings']
      },
      {
        fieldId: 'grid_density',
        formula: 'calculate_grid_density(pipe_length, num_fittings)',
        dependencies: ['pipe_length', 'num_fittings']
      }
    ],
    aiPrompts: {
      rationale: 'Explain the CML sampling plan calculation for {pipe_length} ft pipe with {num_fittings} fittings. Provide industry-standard reasoning for the minimum CML requirements.',
      steps: 'Provide detailed step-by-step process for determining CML sampling plan based on pipe length and fittings count.'
    }
  }
};

async function updateCalculators() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });

  const db = mongoose.connection.db;
  const calculatorsCol = db.collection('calculators');
for (const [calculatorId, updates] of Object.entries(calculatorDefinitions)) {
    try {
      const result = await calculatorsCol.updateOne(
        { id: calculatorId },
        { $set: updates }
      );

      if (result.matchedCount > 0) {
} else {
}
    } catch (error) {
      console.error(`❌ Error updating ${calculatorId}:`, error.message);
    }
  }
await mongoose.connection.close();
}

updateCalculators().catch(console.error);
