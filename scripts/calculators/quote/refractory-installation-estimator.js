module.exports = {
  id: 'refractory-installation-estimator',
  name: 'Refractory Installation Estimator',
  description: 'High-temperature refractory lining estimation for furnaces, kilns, and process equipment with thermal performance analysis',
  category: 'Refractory',
  module: 'quote',
  icon: 'FireOutlined',
  tags: ['refractory', 'high-temperature', 'furnace', 'kiln', 'thermal', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Refractory System Specification', description: 'High-temperature refractory lining system requirements', icon: 'FireOutlined', order: 1, size: 24 },

    // Project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Project identification and scope details', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'project_location', type: 'text', title: 'Project Location', label: 'Project Location', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'City, State' },
    { id: 'client_name', type: 'text', title: 'Client Name', label: 'Client Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Client organization' },
    { id: 'project_type', type: 'select', title: 'Project Type', label: 'Project Type', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'New Installation', value: 'new_installation' },
      { label: 'Reline/Replacement', value: 'reline' },
      { label: 'Repair/Maintenance', value: 'repair' },
      { label: 'Upgrade/Modification', value: 'upgrade' },
      { label: 'Emergency Repair', value: 'emergency' }
    ]},
    { id: 'industry_sector', type: 'select', title: 'Industry Sector', label: 'Industry Sector', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Steel Production', value: 'steel' },
      { label: 'Aluminum Smelting', value: 'aluminum' },
      { label: 'Cement Manufacturing', value: 'cement' },
      { label: 'Glass Manufacturing', value: 'glass' },
      { label: 'Petrochemical', value: 'petrochemical' },
      { label: 'Power Generation', value: 'power' },
      { label: 'Waste-to-Energy', value: 'waste_energy' }
    ]},
    { id: 'project_schedule', type: 'select', title: 'Project Schedule', label: 'Project Schedule', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Normal Schedule', value: 'normal' },
      { label: 'Accelerated', value: 'accelerated' },
      { label: 'Outage/Turnaround', value: 'outage' },
      { label: 'Emergency', value: 'emergency' }
    ]},

    // Equipment specifications
    { id: 'equipment-specs', type: 'group', title: 'Equipment Specifications', description: 'Furnace, kiln, or equipment details', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'equipment_type', type: 'select', title: 'Equipment Type', label: 'Equipment Type', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, options: [
      { label: 'Blast Furnace', value: 'blast_furnace' },
      { label: 'Electric Arc Furnace', value: 'eaf' },
      { label: 'Rotary Kiln', value: 'rotary_kiln' },
      { label: 'Boiler/Steam Generator', value: 'boiler' },
      { label: 'Incinerator', value: 'incinerator' },
      { label: 'Reformer/Cracker', value: 'reformer' },
      { label: 'Ladle/Tundish', value: 'ladle' },
      { label: 'Reheat Furnace', value: 'reheat_furnace' }
    ]},
    { id: 'equipment_capacity', type: 'text', title: 'Equipment Capacity', label: 'Equipment Capacity', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, placeholder: 'e.g., 150 ton/hr, 500 MW' },
    { id: 'equipment_dimensions', type: 'text', title: 'Equipment Dimensions', label: 'Equipment Dimensions', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, placeholder: 'Length x Width x Height' },
    { id: 'lining_area_sqft', type: 'number', title: 'Total Lining Area (sq ft)', label: 'Total Lining Area (sq ft)', sectionId: 'project-section', groupId: 'equipment-specs', size: 8 },
    { id: 'lining_volume_cuft', type: 'number', title: 'Lining Volume (cu ft)', label: 'Lining Volume (cu ft)', sectionId: 'project-section', groupId: 'equipment-specs', size: 8 },
    { id: 'shell_material', type: 'select', title: 'Shell Material', label: 'Shell Material', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, options: [
      { label: 'Carbon Steel', value: 'carbon_steel' },
      { label: 'Stainless Steel', value: 'stainless_steel' },
      { label: 'Alloy Steel', value: 'alloy_steel' },
      { label: 'Concrete', value: 'concrete' }
    ]},

    // Operating conditions
    { id: 'operating-conditions', type: 'group', title: 'Operating Conditions', description: 'Temperature and environmental requirements', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'operating_temperature_f', type: 'number', title: 'Operating Temperature (°F)', label: 'Operating Temperature (°F)', sectionId: 'project-section', groupId: 'operating-conditions', size: 8 },
    { id: 'maximum_temperature_f', type: 'number', title: 'Maximum Temperature (°F)', label: 'Maximum Temperature (°F)', sectionId: 'project-section', groupId: 'operating-conditions', size: 8 },
    { id: 'temperature_cycling', type: 'select', title: 'Temperature Cycling', label: 'Temperature Cycling', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'Continuous Operation', value: 'continuous' },
      { label: 'Moderate Cycling', value: 'moderate' },
      { label: 'Frequent Cycling', value: 'frequent' },
      { label: 'Severe Cycling', value: 'severe' }
    ]},
    { id: 'atmosphere_type', type: 'select', title: 'Atmosphere Type', label: 'Atmosphere Type', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'Oxidizing', value: 'oxidizing' },
      { label: 'Reducing', value: 'reducing' },
      { label: 'Neutral', value: 'neutral' },
      { label: 'Corrosive', value: 'corrosive' },
      { label: 'Vacuum', value: 'vacuum' }
    ]},
    { id: 'chemical_exposure', type: 'select', title: 'Chemical Exposure', label: 'Chemical Exposure', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'None', value: 'none' },
      { label: 'Alkali Attack', value: 'alkali' },
      { label: 'Acid Attack', value: 'acid' },
      { label: 'Slag Attack', value: 'slag' },
      { label: 'Metal Penetration', value: 'metal' },
      { label: 'Carbon Monoxide', value: 'co' }
    ]},
    { id: 'mechanical_stress', type: 'select', title: 'Mechanical Stress', label: 'Mechanical Stress', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'Low', value: 'low' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'High Abrasion', value: 'high_abrasion' },
      { label: 'Impact Loading', value: 'impact' },
      { label: 'Thermal Shock', value: 'thermal_shock' }
    ]},

    // Refractory system selection
    { id: 'refractory-system', type: 'group', title: 'Refractory System Selection', description: 'Refractory material and system specifications', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'refractory_type', type: 'select', title: 'Primary Refractory Type', label: 'Primary Refractory Type', sectionId: 'project-section', groupId: 'refractory-system', size: 8, options: [
      { label: 'Fire Clay Brick', value: 'fire_clay' },
      { label: 'High Alumina Brick', value: 'high_alumina' },
      { label: 'Silica Brick', value: 'silica' },
      { label: 'Magnesia Brick', value: 'magnesia' },
      { label: 'Chrome-Magnesia', value: 'chrome_magnesia' },
      { label: 'Castable Refractory', value: 'castable' },
      { label: 'Plastic Refractory', value: 'plastic' },
      { label: 'Ceramic Fiber', value: 'ceramic_fiber' }
    ]},
    { id: 'refractory_grade', type: 'select', title: 'Refractory Grade', label: 'Refractory Grade', sectionId: 'project-section', groupId: 'refractory-system', size: 8, options: [
      { label: 'Standard Duty', value: 'standard' },
      { label: 'Intermediate Duty', value: 'intermediate' },
      { label: 'High Duty', value: 'high' },
      { label: 'Super Duty', value: 'super' },
      { label: 'Ultra High Temp', value: 'ultra_high' }
    ]},
    { id: 'installation_method', type: 'select', title: 'Installation Method', label: 'Installation Method', sectionId: 'project-section', groupId: 'refractory-system', size: 8, options: [
      { label: 'Hand Laid Brick', value: 'hand_laid' },
      { label: 'Castable Pour', value: 'castable_pour' },
      { label: 'Gunning/Shotcreting', value: 'gunning' },
      { label: 'Ramming', value: 'ramming' },
      { label: 'Fiber Installation', value: 'fiber_install' },
      { label: 'Combination Methods', value: 'combination' }
    ]},
    { id: 'lining_thickness_inches', type: 'number', title: 'Lining Thickness (inches)', label: 'Lining Thickness (inches)', sectionId: 'project-section', groupId: 'refractory-system', size: 8 },
    { id: 'backup_insulation', type: 'select', title: 'Backup Insulation', label: 'Backup Insulation', sectionId: 'project-section', groupId: 'refractory-system', size: 8, options: [
      { label: 'None Required', value: 'none' },
      { label: 'Insulating Brick', value: 'insulating_brick' },
      { label: 'Ceramic Fiber', value: 'ceramic_fiber' },
      { label: 'Calcium Silicate', value: 'calcium_silicate' },
      { label: 'Perlite Concrete', value: 'perlite' }
    ]},
    { id: 'anchoring_system', type: 'select', title: 'Anchoring System', label: 'Anchoring System', sectionId: 'project-section', groupId: 'refractory-system', size: 8, options: [
      { label: 'No Anchors', value: 'none' },
      { label: 'Metallic Anchors', value: 'metallic' },
      { label: 'Ceramic Anchors', value: 'ceramic' },
      { label: 'Stud Welding', value: 'stud_welding' },
      { label: 'Hexmesh', value: 'hexmesh' }
    ]},

    // Quality and testing requirements
    { id: 'quality-testing', type: 'group', title: 'Quality & Testing Requirements', description: 'Quality control and testing specifications', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'material_testing', type: 'select', title: 'Material Testing', label: 'Material Testing', sectionId: 'project-section', groupId: 'quality-testing', size: 8, options: [
      { label: 'Standard Testing', value: 'standard' },
      { label: 'Enhanced Testing', value: 'enhanced' },
      { label: 'Full Characterization', value: 'full' },
      { label: 'No Testing', value: 'none' }
    ]},
    { id: 'installation_inspection', type: 'select', title: 'Installation Inspection', label: 'Installation Inspection', sectionId: 'project-section', groupId: 'quality-testing', size: 8, options: [
      { label: 'Visual Only', value: 'visual' },
      { label: 'Dimensional Check', value: 'dimensional' },
      { label: 'Core Sampling', value: 'core_sampling' },
      { label: 'Thermal Imaging', value: 'thermal_imaging' }
    ]},
    { id: 'dryout_procedure', type: 'select', title: 'Dryout Procedure', label: 'Dryout Procedure', sectionId: 'project-section', groupId: 'quality-testing', size: 8, options: [
      { label: 'Standard Dryout', value: 'standard' },
      { label: 'Controlled Dryout', value: 'controlled' },
      { label: 'Accelerated Dryout', value: 'accelerated' },
      { label: 'No Dryout Required', value: 'none' }
    ]},

    // Installation conditions
    { id: 'installation-conditions', type: 'group', title: 'Installation Conditions', description: 'Site conditions and installation factors', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'access_difficulty', type: 'select', title: 'Access Difficulty', label: 'Access Difficulty', sectionId: 'project-section', groupId: 'installation-conditions', size: 8, options: [
      { label: 'Easy Access', value: 'easy' },
      { label: 'Moderate Access', value: 'moderate' },
      { label: 'Difficult Access', value: 'difficult' },
      { label: 'Confined Space', value: 'confined' }
    ]},
    { id: 'working_environment', type: 'select', title: 'Working Environment', label: 'Working Environment', sectionId: 'project-section', groupId: 'installation-conditions', size: 8, options: [
      { label: 'Normal Conditions', value: 'normal' },
      { label: 'Hot Work', value: 'hot_work' },
      { label: 'Hazardous Area', value: 'hazardous' },
      { label: 'Contaminated', value: 'contaminated' }
    ]},
    { id: 'demolition_required', type: 'select', title: 'Demolition Required', label: 'Demolition Required', sectionId: 'project-section', groupId: 'installation-conditions', size: 8, options: [
      { label: 'No Demolition', value: 'none' },
      { label: 'Partial Removal', value: 'partial' },
      { label: 'Complete Removal', value: 'complete' },
      { label: 'Mechanical Removal', value: 'mechanical' }
    ]},

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Material and labor cost assumptions', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'refractory_cost_per_cuft', type: 'number', title: 'Refractory Cost ($/cu ft)', label: 'Refractory Cost ($/cu ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 45 },
    { id: 'mortar_cost_per_cuft', type: 'number', title: 'Mortar Cost ($/cu ft)', label: 'Mortar Cost ($/cu ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 35 },
    { id: 'anchor_cost_per_sqft', type: 'number', title: 'Anchor Cost ($/sq ft)', label: 'Anchor Cost ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 2.50 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 78 },
    { id: 'productivity_cuft_per_hour', type: 'number', title: 'Productivity (cu ft/hour)', label: 'Productivity (cu ft/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 3.5 },
    { id: 'waste_factor_percent', type: 'number', title: 'Waste Factor (%)', label: 'Waste Factor (%)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 15 },

    // Pricing and profitability
    { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'material_markup_percent', type: 'number', title: 'Material Markup (%)', label: 'Material Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 35 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 45 },
    { id: 'equipment_markup_percent', type: 'number', title: 'Equipment Markup (%)', label: 'Equipment Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 30 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 20 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 18 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 12 },

    // Competitive pricing
    { id: 'competitive-pricing', type: 'group', title: 'Competitive Pricing', description: 'Market positioning and discount strategies', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'market_position', type: 'select', title: 'Market Position', label: 'Market Position', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, options: [
      { label: 'Premium Specialist', value: 'premium' },
      { label: 'Market Rate', value: 'market' },
      { label: 'Competitive', value: 'competitive' },
      { label: 'Value Engineering', value: 'value' }
    ]},
    { id: 'specialty_premium_percent', type: 'number', title: 'Specialty Premium (%)', label: 'Specialty Premium (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 8 },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Minimum Acceptable Margin (%)', label: 'Minimum Acceptable Margin (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 16 }
  ],
  aiPrompt: `
You are a **refractory installation estimation expert**.  
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
   - Thermal Analysis & Material Selection *(table)*  
   - Material Takeoff (MTO) *(table)*  
   - Labor & Equipment Estimate *(table with crew composition, hours, productivity)*  
   - Cost Breakdown *(table with line items, subtotals, totals)*  
   - Schedule & Phasing  
   - Risk & Uncertainty Analysis  
   - Exclusions & Clarifications  
   

2. **Formatting Rules**  
   - Use **Markdown headings** for sections  
   - Use **tables** for numeric breakdowns (Thermal, MTO, Labor, Cost)  
   - Show **formulas explicitly** (e.g., *Material Volume = Lining Area × Thickness × (1 + Waste Factor)*)  
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

   - **Thermal Analysis**  
     - Operating Temperature Requirements vs. Material Limits  
     - Thermal Conductivity and Heat Loss Calculations  
     - Thermal Expansion Considerations  
     - Refractory Selection Justification  

   - **Material Quantities**  
     - Primary Refractory Volume = Lining Area × Thickness × (1 + Waste Factor)  
     - Mortar/Cement = Refractory Volume × Mortar Factor  
     - Anchoring System = Lining Area × Anchor Density  
     - Backup Insulation = Area × Backup Thickness (if required)  

   - **Labor Hours**  
     - Installation Hours = Material Volume ÷ Productivity Rate × Access Factor  
     - Demolition Hours = Existing Material Volume ÷ Demolition Rate  
     - Dryout Hours = Based on dryout procedure and volume  
     - Total Labor = Installation + Demolition + Dryout + Setup/QC  

   - **Equipment & Tools**  
     - Equipment Days = Total Labor Hours ÷ (Crew Hours/Day)  
     - Specialized Equipment = Based on installation method  
     - Equipment Cost = Days × Equipment Rate per Day  

   - **Testing & QA**  
     - Material Testing = Based on testing requirements  
     - Installation Inspection = Based on inspection level  
     - Dryout Monitoring = Based on dryout procedure  

   - **Total Cost**  
     - Direct Costs = Materials + Labor + Equipment + Testing + Demolition  
     - Apply markups: **Material, Labor, Equipment**  
     - Add **Overhead, Profit Margin, Contingency**  
     - Apply **Specialty Premium** and competitive adjustments  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Thermal Analysis & Material Selection**  
   | Parameter | Requirement | Material Response | Standard | Performance |
   |-----------|-------------|-------------------|----------|-------------|
   | Operating Temp | 2,800°F | High alumina brick | ASTM C27 | 3,000°F max |
   
   **Material Takeoff (MTO)**  
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | Refractory Brick | cu ft | 850.5 | Area × Thickness × 1.15 | 15% waste |
   
   **Labor & Equipment Estimate**  
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | Refractory Installation | 3.5 cu ft/hr | 243 | $78/hr | $18,954 | Certified masons |
   
   **Cost Breakdown**  
   | Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | Refractory Materials | $45/cu ft | 850.5 | $38,273 | High-temp brick |
   
   Include **subtotals** and **grand total** with proper formatting.  

5. **Contextual Rationale**  
   - Explain **Refractory Type Selection** based on operating temperature and atmosphere  
   - Justify **Installation Method** based on equipment type and access conditions  
   - Note how **Chemical Exposure** and **Mechanical Stress** affect material choice  
   - Address **Demolition Requirements** and existing condition impact  
   - Explain **Dryout Procedure** importance and schedule impact  
   - Detail **Quality Control** and **Testing Requirements**  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  
   - Emphasize **high-temperature expertise** and **thermal performance**  `
};
