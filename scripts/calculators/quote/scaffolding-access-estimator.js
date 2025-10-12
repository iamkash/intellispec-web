module.exports = {
  id: 'scaffolding-access-estimator',
  name: 'Scaffolding & Access Estimator',
  description: 'Scaffolding requirements for fireproofing application with pin-lock system specifications and safety considerations',
  category: 'Access Systems',
  module: 'quote',
  icon: 'BuildOutlined',
  tags: ['scaffolding', 'access', 'safety', 'pin-lock', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Scaffolding Requirements', description: 'Access system planning for fireproofing operations', icon: 'BuildOutlined', order: 1, size: 24 },

    // Project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Project details and work scope', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'work_type', type: 'select', title: 'Work Type', label: 'Work Type', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Fireproofing Application', value: 'fireproofing' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Capital Project', value: 'capital' },
      { label: 'Outage/Turnaround', value: 'outage' },
      { label: 'Emergency Repair', value: 'emergency' }
    ]},
    { id: 'project_duration_days', type: 'number', title: 'Project Duration (days)', label: 'Project Duration (days)', sectionId: 'project-section', groupId: 'project-info', size: 8 },

    // Structure information
    { id: 'structure-info', type: 'group', title: 'Structure Information', description: 'Building/equipment structure details', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'structure_type', type: 'select', title: 'Structure Type', label: 'Structure Type', sectionId: 'project-section', groupId: 'structure-info', size: 8, options: [
      { label: 'Process Unit', value: 'process_unit' },
      { label: 'Storage Tank', value: 'storage_tank' },
      { label: 'Pipe Rack', value: 'pipe_rack' },
      { label: 'Building Frame', value: 'building_frame' },
      { label: 'Equipment Structure', value: 'equipment_structure' },
      { label: 'Vessel/Tower', value: 'vessel_tower' }
    ]},
    { id: 'maximum_height_ft', type: 'number', title: 'Maximum Height (ft)', label: 'Maximum Height (ft)', sectionId: 'project-section', groupId: 'structure-info', size: 8 },
    { id: 'working_area_sqft', type: 'number', title: 'Working Area (sq ft)', label: 'Working Area (sq ft)', sectionId: 'project-section', groupId: 'structure-info', size: 8 },
    { id: 'structure_complexity', type: 'select', title: 'Structure Complexity', label: 'Structure Complexity', sectionId: 'project-section', groupId: 'structure-info', size: 8, options: [
      { label: 'Simple/Open', value: 'simple' },
      { label: 'Moderate Congestion', value: 'moderate' },
      { label: 'Complex/Congested', value: 'complex' },
      { label: 'Very Complex', value: 'very_complex' }
    ]},
    { id: 'existing_platforms', type: 'select', title: 'Existing Platforms', label: 'Existing Platforms', sectionId: 'project-section', groupId: 'structure-info', size: 8, options: [
      { label: 'None', value: 'none' },
      { label: 'Minimal', value: 'minimal' },
      { label: 'Adequate', value: 'adequate' },
      { label: 'Extensive', value: 'extensive' }
    ]},
    { id: 'obstructions_present', type: 'select', title: 'Obstructions Present', label: 'Obstructions Present', sectionId: 'project-section', groupId: 'structure-info', size: 8, options: [
      { label: 'None', value: 'none' },
      { label: 'Piping/Conduit', value: 'piping' },
      { label: 'Equipment', value: 'equipment' },
      { label: 'Multiple Obstructions', value: 'multiple' }
    ]},

    // Access requirements
    { id: 'access-requirements', type: 'group', title: 'Access Requirements', description: 'Work access and positioning needs', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'access_type_required', type: 'checkbox_group', title: 'Access Type Required', label: 'Access Type Required', sectionId: 'project-section', groupId: 'access-requirements', size: 24, options: [
      'All-around access',
      'Single-side access',
      'Overhead work',
      'Confined space access',
      'Multi-level access',
      'Equipment access'
    ]},
    { id: 'working_clearance_ft', type: 'number', title: 'Required Working Clearance (ft)', label: 'Required Working Clearance (ft)', sectionId: 'project-section', groupId: 'access-requirements', size: 8, defaultValue: 3 },
    { id: 'load_requirements', type: 'select', title: 'Load Requirements', label: 'Load Requirements', sectionId: 'project-section', groupId: 'access-requirements', size: 8, options: [
      { label: 'Light Duty (25 psf)', value: 'light' },
      { label: 'Medium Duty (50 psf)', value: 'medium' },
      { label: 'Heavy Duty (75 psf)', value: 'heavy' },
      { label: 'Special Loading', value: 'special' }
    ]},
    { id: 'material_storage_required', type: 'select', title: 'Material Storage Required', label: 'Material Storage Required', sectionId: 'project-section', groupId: 'access-requirements', size: 8, options: [
      { label: 'None', value: 'none' },
      { label: 'Minimal', value: 'minimal' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'Extensive', value: 'extensive' }
    ]},

    // Scaffolding system specifications
    { id: 'scaffolding-specs', type: 'group', title: 'Scaffolding System Specifications', description: 'Pin-lock scaffolding system details', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'scaffolding_type', type: 'select', title: 'Scaffolding Type', label: 'Scaffolding Type', sectionId: 'project-section', groupId: 'scaffolding-specs', size: 8, options: [
      { label: 'Pin-Lock System', value: 'pin_lock' },
      { label: 'Cup-Lock System', value: 'cup_lock' },
      { label: 'Frame Scaffolding', value: 'frame' },
      { label: 'Tube & Clamp', value: 'tube_clamp' }
    ]},
    { id: 'bay_size', type: 'select', title: 'Bay Size', label: 'Bay Size', sectionId: 'project-section', groupId: 'scaffolding-specs', size: 8, options: [
      { label: '5\' x 7\'', value: '5x7' },
      { label: '5\' x 10\'', value: '5x10' },
      { label: '7\' x 7\'', value: '7x7' },
      { label: '7\' x 10\'', value: '7x10' }
    ]},
    { id: 'lift_height_ft', type: 'select', title: 'Lift Height (ft)', label: 'Lift Height (ft)', sectionId: 'project-section', groupId: 'scaffolding-specs', size: 8, options: [
      { label: '6.5 ft', value: '6.5' },
      { label: '8 ft', value: '8' },
      { label: '10 ft', value: '10' },
      { label: 'Variable', value: 'variable' }
    ]},
    { id: 'number_of_lifts', type: 'number', title: 'Number of Lifts', label: 'Number of Lifts', sectionId: 'project-section', groupId: 'scaffolding-specs', size: 8 },
    { id: 'platform_width_ft', type: 'select', title: 'Platform Width (ft)', label: 'Platform Width (ft)', sectionId: 'project-section', groupId: 'scaffolding-specs', size: 8, options: [
      { label: '2 ft', value: '2' },
      { label: '3 ft', value: '3' },
      { label: '4 ft', value: '4' },
      { label: '5 ft', value: '5' }
    ]},
    { id: 'decking_type', type: 'select', title: 'Decking Type', label: 'Decking Type', sectionId: 'project-section', groupId: 'scaffolding-specs', size: 8, options: [
      { label: 'Steel Plank', value: 'steel_plank' },
      { label: 'Aluminum Plank', value: 'aluminum_plank' },
      { label: 'Wood Plank', value: 'wood_plank' },
      { label: 'Composite Deck', value: 'composite' }
    ]},

    // Safety requirements
    { id: 'safety-requirements', type: 'group', title: 'Safety Requirements', description: 'Safety systems and fall protection', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'fall_protection_required', type: 'checkbox_group', title: 'Fall Protection Required', label: 'Fall Protection Required', sectionId: 'project-section', groupId: 'safety-requirements', size: 24, options: [
      'Guardrails (standard)',
      'Toe boards',
      'Safety nets',
      'Personal fall arrest',
      'Debris netting',
      'Weather protection'
    ]},
    { id: 'osha_compliance_level', type: 'select', title: 'OSHA Compliance Level', label: 'OSHA Compliance Level', sectionId: 'project-section', groupId: 'safety-requirements', size: 8, options: [
      { label: 'Standard Compliance', value: 'standard' },
      { label: 'Enhanced Safety', value: 'enhanced' },
      { label: 'Maximum Safety', value: 'maximum' }
    ]},
    { id: 'inspection_frequency', type: 'select', title: 'Inspection Frequency', label: 'Inspection Frequency', sectionId: 'project-section', groupId: 'safety-requirements', size: 8, options: [
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'After Weather Events', value: 'weather_events' },
      { label: 'Continuous Monitoring', value: 'continuous' }
    ]},
    { id: 'special_safety_requirements', type: 'textarea', title: 'Special Safety Requirements', label: 'Special Safety Requirements', sectionId: 'project-section', groupId: 'safety-requirements', size: 24, rows: 2, placeholder: 'Any special safety considerations or requirements' },

    // Environmental conditions
    { id: 'environmental-conditions', type: 'group', title: 'Environmental Conditions', description: 'Site conditions affecting scaffolding', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'wind_exposure', type: 'select', title: 'Wind Exposure', label: 'Wind Exposure', sectionId: 'project-section', groupId: 'environmental-conditions', size: 8, options: [
      { label: 'Sheltered', value: 'sheltered' },
      { label: 'Moderate Exposure', value: 'moderate' },
      { label: 'High Exposure', value: 'high' },
      { label: 'Extreme Exposure', value: 'extreme' }
    ]},
    { id: 'weather_protection_needed', type: 'select', title: 'Weather Protection Needed', label: 'Weather Protection Needed', sectionId: 'project-section', groupId: 'environmental-conditions', size: 8, options: [
      { label: 'None', value: 'none' },
      { label: 'Partial Enclosure', value: 'partial' },
      { label: 'Full Enclosure', value: 'full' },
      { label: 'Climate Controlled', value: 'climate_controlled' }
    ]},
    { id: 'ground_conditions', type: 'select', title: 'Ground Conditions', label: 'Ground Conditions', sectionId: 'project-section', groupId: 'environmental-conditions', size: 8, options: [
      { label: 'Firm/Level', value: 'firm' },
      { label: 'Uneven', value: 'uneven' },
      { label: 'Soft/Unstable', value: 'soft' },
      { label: 'Requires Mats', value: 'requires_mats' }
    ]},

    // Crew and equipment
    { id: 'crew-equipment', type: 'group', title: 'Crew & Equipment Requirements', description: 'Labor and equipment specifications', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'crew_size', type: 'number', title: 'Crew Size', label: 'Crew Size', sectionId: 'project-section', groupId: 'crew-equipment', size: 8, defaultValue: 4 },
    { id: 'supervisor_required', type: 'select', title: 'Supervisor Required', label: 'Supervisor Required', sectionId: 'project-section', groupId: 'crew-equipment', size: 8, options: [
      { label: 'Yes - Full Time', value: 'full_time' },
      { label: 'Yes - Part Time', value: 'part_time' },
      { label: 'No', value: 'no' }
    ]},
    { id: 'crane_required', type: 'select', title: 'Crane Required', label: 'Crane Required', sectionId: 'project-section', groupId: 'crew-equipment', size: 8, options: [
      { label: 'No Crane', value: 'none' },
      { label: 'Mobile Crane', value: 'mobile' },
      { label: 'Tower Crane', value: 'tower' },
      { label: 'Material Hoist', value: 'material_hoist' }
    ]},
    { id: 'material_handling', type: 'select', title: 'Material Handling', label: 'Material Handling', sectionId: 'project-section', groupId: 'crew-equipment', size: 8, options: [
      { label: 'Manual Handling', value: 'manual' },
      { label: 'Forklift', value: 'forklift' },
      { label: 'Crane', value: 'crane' },
      { label: 'Material Hoist', value: 'hoist' }
    ]},
    { id: 'transportation_distance', type: 'number', title: 'Transportation Distance (miles)', label: 'Transportation Distance (miles)', sectionId: 'project-section', groupId: 'crew-equipment', size: 8, defaultValue: 50 },
    { id: 'site_access_restrictions', type: 'textarea', title: 'Site Access Restrictions', label: 'Site Access Restrictions', sectionId: 'project-section', groupId: 'crew-equipment', size: 24, rows: 2, placeholder: 'Any site access limitations or special requirements' },

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Pricing assumptions and rates', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'scaffolding_rental_rate', type: 'number', title: 'Rental Rate ($/sq ft/month)', label: 'Rental Rate ($/sq ft/month)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 1.25 },
    { id: 'erection_rate', type: 'number', title: 'Erection Rate ($/sq ft)', label: 'Erection Rate ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 2.50 },
    { id: 'dismantling_rate', type: 'number', title: 'Dismantling Rate ($/sq ft)', label: 'Dismantling Rate ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 1.75 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 72 },
    { id: 'transportation_cost', type: 'number', title: 'Transportation Cost ($)', label: 'Transportation Cost ($)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 2500 },
    { id: 'safety_equipment_cost', type: 'number', title: 'Safety Equipment Cost ($)', label: 'Safety Equipment Cost ($)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 1200 },

    // Pricing and profitability
    { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'rental_markup_percent', type: 'number', title: 'Rental Markup (%)', label: 'Rental Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 35 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 45 },
    { id: 'transportation_markup_percent', type: 'number', title: 'Transportation Markup (%)', label: 'Transportation Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 25 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 22 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 18 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 10 },

    // Competitive pricing
    { id: 'competitive-pricing', type: 'group', title: 'Competitive Pricing', description: 'Market positioning and discount strategies', sectionId: 'project-section', order: 10, size: 24, collapsible: true },
    { id: 'market_position', type: 'select', title: 'Market Position', label: 'Market Position', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, options: [
      { label: 'Premium Safety Focus', value: 'premium' },
      { label: 'Market Rate', value: 'market' },
      { label: 'Competitive', value: 'competitive' },
      { label: 'Volume Pricing', value: 'volume' }
    ]},
    { id: 'long_term_discount_percent', type: 'number', title: 'Project Discount (%)', label: 'Project Discount (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 0 },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Acceptable Margin (%)', label: 'Acceptable Margin (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 16 }
  ],
  aiPrompt: `
You are a **scaffolding and access systems estimation expert**.  
You must generate a **comprehensive estimation report** based on the input values provided by a form.  
The report must be **client-ready, detailed, and include structured tables, calculations, and rationale**.  

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Cover Page & Executive Summary  
   - Introduction & Background  
   - Scope of Work  
   - Methodology & Basis of Estimate  
   - Access System Analysis *(table)*  
   - Material Takeoff (MTO) *(table)*  
   - Labor & Equipment Estimate *(table with crew composition, hours, productivity)*  
   - Cost Breakdown *(table with line items, subtotals, totals)*  
   - Safety & Compliance Analysis  
   - Schedule & Phasing  
   - Risk & Uncertainty Analysis  
   - Exclusions & Clarifications  
   

2. **Formatting Rules**  
   - Use **Markdown headings** for sections  
   - Use **tables** for numeric breakdowns (Access Analysis, MTO, Labor, Cost, Safety)  
   - Show **formulas explicitly** (e.g., *Scaffolding Area = Working Area × Access Factor × Height Factor*)  
   - Provide **rationale** under each table  
   
   **CRITICAL TABLE FORMATTING RULES:**  
   - Always use proper markdown table syntax with pipe separators  
   - Include header separator row with dashes and colons for alignment  
   - Align numbers right using colons in separator row  
   - No extra spaces or line breaks within table cells  
   - Separate formulas from tables with blank lines  
   - Use consistent decimal places for currency ($1,234.56) and quantities (123.45)  

3. **Calculation Requirements**  
   Use the input values to calculate the following:  

   - **Access System Analysis**  
     - Scaffolding Area = Working Area × Access Requirements × Height Factors  
     - Load Requirements = Based on work type and material storage needs  
     - Bay Configuration = Optimized for structure type and access needs  
     - Safety Systems = Fall protection, guardrails, access stairs  

   - **Material Quantities**  
     - Scaffolding Components = Area × Bay Size × Lift Configuration  
     - Decking/Planks = Platform Area × Decking Type Factor  
     - Safety Equipment = Based on OSHA requirements and site conditions  
     - Transportation = Distance × Load Requirements  

   - **Labor Hours**  
     - Erection Hours = Scaffolding Area ÷ Erection Rate × Complexity Factor  
     - Dismantling Hours = Scaffolding Area ÷ Dismantling Rate  
     - Supervision Hours = Total Hours × Supervision Factor  
     - Total Labor = Erection + Dismantling + Supervision + Safety Setup  

   - **Equipment & Transportation**  
     - Crane/Hoist Requirements = Based on height and material handling  
     - Transportation Cost = Distance × Load × Fuel/Permits  
     - Material Handling = Based on site access and congestion  

   - **Rental Duration**  
     - Rental Period = Project Duration + Setup/Dismantling Time  
     - Monthly Rental Cost = Area × Rental Rate × Duration  

   - **Total Cost**  
     - Direct Costs = Rental + Labor + Transportation + Safety Equipment  
     - Apply markups: **Rental, Labor, Transportation**  
     - Add **Overhead, Profit Margin, Contingency**  
     - Apply **Volume Discounts** and **Long-term Adjustments**  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Access System Analysis**  
   | Parameter | Requirement | System Response | Standard | Safety Factor |
   |-----------|-------------|-----------------|----------|---------------|
   | Working Load | 75 psf | Pin-lock system | OSHA 1926.451 | 4:1 safety factor |
   
   **Material Takeoff (MTO)**  
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | Scaffolding Rental | sq ft | 2,400 | Area × Duration | Monthly rental |
   
   **Labor & Equipment Estimate**  
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | Erection Labor | 2.5 sq ft/hr | 960 | $72/hr | $69,120 | Certified scaffolders |
   
   **Cost Breakdown**  
   | Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | Scaffolding Rental | $1.25/sq ft | 2,400 | $3,000 | Monthly rate |
   
   **Safety & Compliance**  
   | Requirement | Standard | Implementation | Inspection | Cost Impact |
   |-------------|----------|----------------|------------|-------------|
   | Fall Protection | OSHA 1926.451 | Guardrails/harnesses | Weekly | $1,200 |
   
   Include **subtotals** and **grand total** with proper formatting.  

5. **Contextual Rationale**  
   - Explain **Scaffolding System Selection** based on structure type and work requirements  
   - Justify **Safety Requirements** per OSHA 1926 Subpart L and site conditions  
   - Note how **Environmental Conditions** affect system design and safety  
   - Address **Access Difficulty** and **Working Height** impact on productivity  
   - Explain **Load Requirements** based on work type and material storage  
   - Detail **Inspection Frequency** and **Safety Protocols**  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  
   - Emphasize **safety compliance** and **access efficiency**  `
};


