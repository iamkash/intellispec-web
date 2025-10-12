module.exports = {
  id: 'scaff-foundation-pressure',
  name: 'Foundation Pressure Calculator',
  description: 'Computes bearing pressure under base plates',
  category: 'Structural Integrity',
  module: 'scaffolding',
  icon: 'VerticalAlignBottomOutlined',
  tags: ['foundation', 'soil', 'bearing', 'scaffolding'],
  uiDefinition: [
    { id: 'input-card', type: 'section', title: 'Input Parameters', description: 'Loads and areas', icon: 'FormOutlined', order: 1, size: 24 },
    { id: 'inputs', type: 'group', title: 'Inputs', description: 'Provide inputs', sectionId: 'input-card', order: 1, size: 24 },
    { id: 'total_load_kN', type: 'number', title: 'Total load (kN)', label: 'Total load (kN)', sectionId: 'input-card', groupId: 'inputs', size: 8 },
    { id: 'base_area_m2', type: 'number', title: 'Base area (m²)', label: 'Base area (m²)', sectionId: 'input-card', groupId: 'inputs', size: 8 },
    { id: 'soil_capacity_kpa', type: 'number', title: 'Soil bearing capacity (kPa)', label: 'Soil bearing capacity (kPa)', sectionId: 'input-card', groupId: 'inputs', size: 8 },
    { id: 'units', type: 'group', title: 'Units', description: 'Select output units', sectionId: 'input-card', order: 2, size: 24, collapsible: true },
    { id: 'pressure_unit', type: 'select', title: 'Pressure unit', label: 'Pressure unit', sectionId: 'input-card', groupId: 'units', size: 8, options: [
      { label: 'kN/m² (kPa)', value: 'kPa' },
      { label: 'psi', value: 'psi' }
    ], defaultValue: 'kPa' },
    { id: 'strategy', type: 'group', title: 'Strategy', description: 'Optimization goals', sectionId: 'input-card', order: 3, size: 24, collapsible: true },
    { id: 'optimization_goal', type: 'segmented', title: 'Optimize for', label: 'Optimize for', sectionId: 'input-card', groupId: 'strategy', size: 12, options: [
      { label: 'Risk', value: 'risk' },
      { label: 'Cost', value: 'cost' }
    ], defaultValue: 'risk' }
  ],
  aiPrompt: [
    'You are a scaffolding foundation analyst.',
    '',
    'Compute ground bearing pressure under base plates using total load and base area, and compare to soil bearing capacity.',
    '',
    'Use:',
    '- Pressure P_kPa = (Total load in kN) / (Base area in m²).',
    '- Convert to selected unit if pressure_unit ≠ kPa.',
    '',
    'Guidelines:',
    '- If any required input is missing, mark the affected outputs as Unknown and proceed.',
    '- Round reported values sensibly.',
    '',
    'Output ONLY:',
    '# Foundation Pressure Calculator',
    '## Report Summary',
    'One concise sentence summarizing P vs capacity and Pass/Fail.',
    '## Key outputs',
    '| Key outputs | Value |',
    '| --- | --- |',
    '- Pressure (selected unit) | <value or Unknown>',
    '- Soil capacity (kN/m²) | <value or Unknown>',
    '- Result | <Pass/Fail/Unknown>',
    '## Recommendations',
    'Propose smallest passing base area or sole board/pad options based on optimization_goal.',
    '## Alternatives & Trade-offs',
    '| Option | Area/Type | Cost/Risk Impact | Notes |',
    '| --- | --- | --- | --- |',
    '## Calculations',
    '- Pressure computation:',
    '- Unit conversion:',
    '## Assumptions and Uncertainty',
    'Confidence and soil sensitivity.',
    '## Escalation Criteria',
    'When to require soil engineer review.',
    '## Rationale',
    'Short paragraph explaining assumptions and decision basis.',
    '## References and Standards',
    '',
    'END OF REPORT'
  ].join('\n')
};


