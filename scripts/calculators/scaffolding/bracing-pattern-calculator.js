module.exports = {
  id: 'scaff-bracing-pattern',
  name: 'Bracing Pattern Calculator',
  description: 'Calculates optimal diagonal bracing patterns for lateral stability',
  category: 'Structural Integrity',
  module: 'scaffolding',
  icon: 'BranchesOutlined',
  tags: ['bracing', 'diagonal', 'lateral', 'stability', 'scaffolding'],
  uiDefinition: [
    { id: 'input-card', type: 'section', title: 'Input Parameters', description: 'Scaffold geometry and exposure', icon: 'FormOutlined', order: 1, size: 24 },
    { id: 'geometry', type: 'group', title: 'Scaffold Geometry', description: 'Dimensions and configuration', sectionId: 'input-card', order: 1, size: 24 },
    { id: 'height_m', type: 'number', title: 'Height (m)', label: 'Height (m)', sectionId: 'input-card', groupId: 'geometry', size: 6, required: true },
    { id: 'length_m', type: 'number', title: 'Length (m)', label: 'Length (m)', sectionId: 'input-card', groupId: 'geometry', size: 6, required: true },
    { id: 'bay_width_m', type: 'number', title: 'Bay width (m)', label: 'Bay width (m)', sectionId: 'input-card', groupId: 'geometry', size: 6, defaultValue: 2.4 },
    { id: 'lift_height_m', type: 'number', title: 'Lift height (m)', label: 'Lift height (m)', sectionId: 'input-card', groupId: 'geometry', size: 6, defaultValue: 2.0 },
    { id: 'environment', type: 'group', title: 'Environmental Factors', description: 'Exposure conditions', sectionId: 'input-card', order: 2, size: 24 },
    { id: 'exposure_class', type: 'select', title: 'Exposure class', label: 'Exposure class', sectionId: 'input-card', groupId: 'environment', size: 8, options: [
      { label: 'Enclosed (indoors)', value: 'enclosed' },
      { label: 'Partially enclosed', value: 'partial' },
      { label: 'Open (exposed)', value: 'open' }
    ], required: true },
    { id: 'wind_zone', type: 'select', title: 'Wind zone', label: 'Wind zone', sectionId: 'input-card', groupId: 'environment', size: 8, options: [
      { label: 'Low (< 20 m/s)', value: 'low' },
      { label: 'Medium (20-30 m/s)', value: 'medium' },
      { label: 'High (> 30 m/s)', value: 'high' }
    ] },
    { id: 'scaffold_type', type: 'select', title: 'Scaffold type', label: 'Scaffold type', sectionId: 'input-card', groupId: 'environment', size: 8, options: [
      { label: 'Tube & coupler', value: 'tube_coupler' },
      { label: 'System scaffold', value: 'system' },
      { label: 'Frame scaffold', value: 'frame' }
    ] },
    { id: 'strategy', type: 'group', title: 'Strategy', description: 'Optimization approach', sectionId: 'input-card', order: 3, size: 24, collapsible: true },
    { id: 'optimization_goal', type: 'select', title: 'Optimization', label: 'Optimize for', sectionId: 'input-card', groupId: 'strategy', size: 8, options: [
      { label: 'Min material', value: 'min_material' },
      { label: 'Max stability', value: 'max_stability' },
      { label: 'Balanced', value: 'balanced' }
    ], defaultValue: 'balanced' }
  ],
  aiPrompt: [
    'You are a scaffolding bracing design specialist.',
    '',
    'Calculate optimal diagonal bracing patterns based on scaffold geometry, exposure conditions, and stability requirements per EN 12811-1 and OSHA 1926 Subpart L.',
    '',
    'Use:',
    '- Plan bracing: Every 5th bay minimum, or 30m maximum spacing',
    '- Facade bracing: 45° diagonal pattern preferred, zigzag acceptable',
    '- Ledger bracing: At least every 30m and at movement joints',
    '- Node bracing: Required at cantilevers and load concentration points',
    '- Wind exposure factor: Enclosed=0.6, Partial=0.8, Open=1.0',
    '- Height factor: Additional bracing every 10m height for H>20m',
    '- Slenderness check: H/B ratio > 3:1 requires enhanced bracing',
    '',
    'Guidelines:',
    '- Calculate number of braced bays required',
    '- Determine bracing pattern (diagonal, zigzag, K-brace)',
    '- Specify bracing locations and intervals',
    '- Include plan, facade, and ledger bracing requirements',
    '',
    'Output ONLY:',
    '# Bracing Pattern Calculator',
    '## Report Summary',
    'One sentence summarizing the scaffold dimensions, exposure, and bracing requirements.',
    '## Key outputs',
    '| Key outputs | Value |',
    '| --- | --- |',
    '| Total braced bays required | <value> |',
    '| Plan bracing interval | <value> bays |',
    '| Facade bracing pattern | <pattern> |',
    '| Ledger bracing locations | <value> |',
    '| Node points requiring bracing | <value> |',
    '| Bracing tubes required | <value> |',
    '| Stability factor achieved | <value> |',
    '## Recommendations',
    '1. Primary bracing placement strategy',
    '2. Critical connection points to reinforce',
    '3. Additional measures for high exposure',
    '## Alternatives & Trade-offs',
    '| Option | Material Use | Stability | Labor Hours |',
    '| --- | --- | --- | --- |',
    '| Minimum code | Baseline | Adequate | Low |',
    '| Enhanced pattern | +15% | Good | Medium |',
    '| Maximum bracing | +30% | Excellent | High |',
    '## Calculations',
    '- Lateral force estimation',
    '- Bracing capacity calculation',
    '- Pattern efficiency analysis',
    '## Assumptions & Uncertainty',
    '- Wind load assumptions and safety factors',
    '- Connection rigidity assumptions',
    '- Confidence level: <value>%',
    '## Escalation Criteria',
    '- If H/B ratio > 4:1, require engineering review',
    '- If wind zone is high and height > 30m, specialist design needed',
    '## Rationale',
    'Explanation of bracing pattern selection based on stability analysis.',
    '## References and Standards',
    '- EN 12811-1:2003 Temporary works equipment',
    '- OSHA 1926.451 Scaffolding standard',
    '- TG20:21 Good Practice Guidance',
    '',
    'END OF REPORT'
  ].join('\n')
};









