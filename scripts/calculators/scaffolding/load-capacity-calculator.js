module.exports = {
  id: 'scaff-load-capacity',
  name: 'Load Capacity Calculator',
  description: 'Calculates max load allowed per bay/platform',
  category: 'Structural Integrity',
  module: 'scaffolding',
  icon: 'CalculatorOutlined',
  tags: ['load', 'capacity', 'SWL', 'scaffolding'],
  uiDefinition: [
    { id: 'input-card', type: 'section', title: 'Input Parameters', description: 'Geometry and rating inputs', icon: 'FormOutlined', order: 1, size: 24 },
    { id: 'inputs', type: 'group', title: 'Inputs', description: 'Provide inputs', sectionId: 'input-card', order: 1, size: 24 },
    { id: 'tube_size', type: 'select', title: 'Tube size', label: 'Tube size', sectionId: 'input-card', groupId: 'inputs', size: 8, options: [
      { label: '48.3 mm x 4.0 mm', value: '48_3x4_0' },
      { label: '48.3 mm x 3.2 mm', value: '48_3x3_2' },
      { label: 'Other', value: 'other' }
    ] },
    { id: 'span_m', type: 'number', title: 'Span (m)', label: 'Span (m)', sectionId: 'input-card', groupId: 'inputs', size: 8 },
    { id: 'duty_rating', type: 'select', title: 'Duty rating', label: 'Duty rating', sectionId: 'input-card', groupId: 'inputs', size: 8, options: [
      { label: 'Light', value: 'light' },
      { label: 'Medium', value: 'medium' },
      { label: 'Heavy', value: 'heavy' }
    ] },
    { id: 'board_type', type: 'select', title: 'Board type', label: 'Board type', sectionId: 'input-card', groupId: 'inputs', size: 8, options: [
      { label: 'Timber boards', value: 'timber' },
      { label: 'Steel/Aluminium decks', value: 'metal' }
    ] },
    { id: 'units', type: 'group', title: 'Units', description: 'Select output units', sectionId: 'input-card', order: 2, size: 24, collapsible: true },
    { id: 'load_unit', type: 'select', title: 'Load unit', label: 'Load unit', sectionId: 'input-card', groupId: 'units', size: 8, options: [
      { label: 'kg', value: 'kg' },
      { label: 'kN', value: 'kN' }
    ], defaultValue: 'kg' },
    { id: 'strategy', type: 'group', title: 'Strategy', description: 'Optimization goals and conservatism', sectionId: 'input-card', order: 3, size: 24, collapsible: true },
    { id: 'optimization_goal', type: 'segmented', title: 'Optimize for', label: 'Optimize for', sectionId: 'input-card', groupId: 'strategy', size: 12, options: [
      { label: 'Risk', value: 'risk' },
      { label: 'Cost', value: 'cost' },
      { label: 'Speed', value: 'speed' }
    ], defaultValue: 'risk' },
    { id: 'conservatism', type: 'segmented', title: 'Conservatism', label: 'Conservatism', sectionId: 'input-card', groupId: 'strategy', size: 12, options: [
      { label: 'Conservative', value: 'conservative' },
      { label: 'Balanced', value: 'balanced' },
      { label: 'Aggressive', value: 'aggressive' }
    ], defaultValue: 'balanced' }
  ],
  aiPrompt: [
    'You are a scaffolding structural analyst.',
    '',
    'Compute Safe Working Load (SWL) per bay/platform given tube size, span, duty rating, and board type. Use conservative assumptions when inputs are missing and report Unknown where applicable.',
    '',
    'Use:',
    '- Apply duty rating caps; reduce SWL with increasing span. If load_unit is kN, convert (1 kN ≈ 101.97 kg).',
    '- Respect optimization_goal (risk/cost/speed) and conservatism when proposing changes.',
    '',
    'Guidelines:',
    '- Round outputs to sensible precision.',
    '',
    'Output ONLY:',
    '# Load Capacity Calculator',
    '## Report Summary',
    'One concise sentence summarizing assumed section, span, duty, and SWL.',
    '## Key outputs',
    '| Key outputs | Value |',
    '| --- | --- |',
    '- Safe Working Load (selected unit) | <value or Unknown>',
    '- Governing factor | <section/duty/board/Unknown>',
    '- Assumed tube spec | <value>',
    '- Span (m) | <value>',
    '## Recommendations',
    'Provide 3–5 prioritized, actionable recommendations to increase safety/capacity that align with optimization_goal and conservatism.',
    '## Alternatives & Trade-offs',
    '| Option | SWL Change | Cost/Risk Impact | Notes |',
    '| --- | --- | --- | --- |',
    '## Calculations',
    '- Assumptions and adjustments:',
    '- Unit conversion:',
    '## Assumptions and Uncertainty',
    '- List defaults used, confidence (0–100), and sensitivity to span/duty.',
    '## Escalation Criteria',
    '- When to seek engineering review or reconfiguration.',
    '## Rationale',
    'Short paragraph explaining decision basis.',
    '## References and Standards',
    '',
    'END OF REPORT'
  ].join('\n')
};


