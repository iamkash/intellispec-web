const workflowData = {
  id: 'piping-inspection-workflow',
  name: 'Piping Inspection Workflow',
  description: 'Complete piping inspection workflow with formula-driven calculations',
  metadata: {
    id: 'piping-inspection-workflow',
    agents: [
      {
        id: 'visual-inspection',
        type: 'DataAggregatorAgent',
        config: {
          collection: 'documents',
          filter: { type: 'piping_inspection' },
          sectionType: 'voice',
          order: 1,
          includeInPdf: true,
          formulas: {
            voiceAnalysisScore: 'VOICE_TRANSCRIPT_LENGTH > 100 ? 1 : 0.5',
            equipmentCount: 'COUNT_EQUIPMENT_MENTIONS',
            inspectionCompleteness: 'VOICE_TRANSCRIPT_LENGTH / 500'
          }
        }
      },
      {
        id: 'thickness-measurements',
        type: 'DataAggregatorAgent',
        config: {
          collection: 'documents',
          filter: { type: 'piping_inspection' },
          formulas: {
            remainingLife: '(NOMINAL_THICKNESS - MEASURED_THICKNESS) / CORROSION_RATE',
            corrosionRate: '(NOMINAL_THICKNESS - MEASURED_THICKNESS) / YEARS_IN_SERVICE',
            inspectionInterval: 'REMAINING_LIFE * 0.8',
            riskLevel: 'THICKNESS_RATIO < 0.7 ? "CRITICAL" : THICKNESS_RATIO < 0.85 ? "HIGH" : "MEDIUM"'
          }
        }
      },
      {
        id: 'corrosion-assessment',
        type: 'DataAggregatorAgent',
        config: {
          collection: 'documents',
          filter: { type: 'piping_inspection' },
          formulas: {
            fitnessForService: 'CORROSION_RATE > 0.1 ? "REJECT" : CORROSION_RATE > 0.05 ? "MONITOR" : "ACCEPT"',
            remainingLifeYears: 'CURRENT_THICKNESS / CORROSION_RATE',
            nextInspectionDate: 'CURRENT_DATE + (REMAINING_LIFE_YEARS * 0.75 * 365)',
            mitigationPriority: 'CORROSION_RATE > 0.2 ? "CRITICAL" : CORROSION_RATE > 0.1 ? "HIGH" : "MEDIUM"'
          }
        }
      }
    ],
    connections: [
      { from: 'visual-inspection', to: 'thickness-measurements' },
      { from: 'thickness-measurements', to: 'corrosion-assessment' }
    ]
  }
};

module.exports = workflowData;
