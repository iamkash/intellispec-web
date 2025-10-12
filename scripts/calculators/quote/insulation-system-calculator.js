module.exports = {
  id: 'insulation-system-calculator',
  name: 'Insulation System Calculator',
  description: 'Industrial insulation estimation for piping, vessels, and equipment with thermal performance analysis',
  category: 'Insulation',
  module: 'quote',
  icon: 'FireOutlined',
  tags: ['insulation', 'thermal', 'piping', 'vessels', 'energy', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Insulation System Requirements', description: 'Industrial insulation system specifications', icon: 'FireOutlined', order: 1, size: 24 },

    // Project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Project details and insulation scope', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'insulation_purpose', type: 'select', title: 'Insulation Purpose', label: 'Insulation Purpose', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Personnel Protection', value: 'personnel_protection' },
      { label: 'Energy Conservation', value: 'energy_conservation' },
      { label: 'Process Control', value: 'process_control' },
      { label: 'Condensation Control', value: 'condensation_control' },
      { label: 'Freeze Protection', value: 'freeze_protection' },
      { label: 'Fire Protection', value: 'fire_protection' }
    ]},
    { id: 'project_location', type: 'text', title: 'Project Location', label: 'Project Location', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'City, State' },

    // Equipment specifications
    { id: 'equipment-specs', type: 'group', title: 'Equipment Specifications', description: 'Equipment type and dimensions', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'equipment_type', type: 'select', title: 'Equipment Type', label: 'Equipment Type', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, options: [
      { label: 'Piping', value: 'piping' },
      { label: 'Vessels/Tanks', value: 'vessels' },
      { label: 'Boilers', value: 'boilers' },
      { label: 'Turbines', value: 'turbines' },
      { label: 'Exhaust Stacks', value: 'exhaust_stacks' },
      { label: 'Breechings', value: 'breechings' },
      { label: 'Ductwork', value: 'ductwork' }
    ]},
    { id: 'pipe_diameter_inches', type: 'number', title: 'Pipe Diameter (inches)', label: 'Pipe Diameter (inches)', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, watchField: 'equipment_type', showWhen: 'piping' },
    { id: 'pipe_length_ft', type: 'number', title: 'Pipe Length (ft)', label: 'Pipe Length (ft)', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, watchField: 'equipment_type', showWhen: 'piping' },
    { id: 'vessel_diameter_ft', type: 'number', title: 'Vessel Diameter (ft)', label: 'Vessel Diameter (ft)', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, watchField: 'equipment_type', showWhen: 'vessels,boilers' },
    { id: 'vessel_height_ft', type: 'number', title: 'Vessel Height (ft)', label: 'Vessel Height (ft)', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, watchField: 'equipment_type', showWhen: 'vessels,boilers' },
    { id: 'equipment_surface_area_sqft', type: 'number', title: 'Equipment Surface Area (sq ft)', label: 'Equipment Surface Area (sq ft)', sectionId: 'project-section', groupId: 'equipment-specs', size: 8 },
    { id: 'number_of_fittings', type: 'number', title: 'Number of Fittings/Valves', label: 'Number of Fittings/Valves', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, watchField: 'equipment_type', showWhen: 'piping' },
    { id: 'fitting_complexity', type: 'select', title: 'Fitting Complexity', label: 'Fitting Complexity', sectionId: 'project-section', groupId: 'equipment-specs', size: 8, watchField: 'equipment_type', showWhen: 'piping', options: [
      { label: 'Simple (elbows, tees)', value: 'simple' },
      { label: 'Moderate (valves, flanges)', value: 'moderate' },
      { label: 'Complex (instruments, specialty)', value: 'complex' }
    ]},

    // Operating conditions
    { id: 'operating-conditions', type: 'group', title: 'Operating Conditions', description: 'Temperature and environmental conditions', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'operating_temperature_f', type: 'number', title: 'Operating Temperature (°F)', label: 'Operating Temperature (°F)', sectionId: 'project-section', groupId: 'operating-conditions', size: 8 },
    { id: 'ambient_temperature_f', type: 'number', title: 'Ambient Temperature (°F)', label: 'Ambient Temperature (°F)', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, defaultValue: 70 },
    { id: 'temperature_range', type: 'select', title: 'Temperature Range', label: 'Temperature Range', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'Cryogenic (< -150°F)', value: 'cryogenic' },
      { label: 'Chilled (-150°F to 32°F)', value: 'chilled' },
      { label: 'Ambient (32°F to 200°F)', value: 'ambient' },
      { label: 'Medium Temp (200°F to 650°F)', value: 'medium_temp' },
      { label: 'High Temp (650°F to 1200°F)', value: 'high_temp' },
      { label: 'Very High Temp (> 1200°F)', value: 'very_high_temp' }
    ]},
    { id: 'wind_velocity_mph', type: 'number', title: 'Wind Velocity (mph)', label: 'Wind Velocity (mph)', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, defaultValue: 7.5 },
    { id: 'environmental_exposure', type: 'select', title: 'Environmental Exposure', label: 'Environmental Exposure', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'Indoor/Sheltered', value: 'indoor' },
      { label: 'Outdoor/Dry', value: 'outdoor_dry' },
      { label: 'Outdoor/Wet', value: 'outdoor_wet' },
      { label: 'Marine/Coastal', value: 'marine' },
      { label: 'Chemical Exposure', value: 'chemical' }
    ]},
    { id: 'humidity_level', type: 'select', title: 'Humidity Level', label: 'Humidity Level', sectionId: 'project-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'Low (<50%)', value: 'low' },
      { label: 'Moderate (50-70%)', value: 'moderate' },
      { label: 'High (>70%)', value: 'high' }
    ]},

    // Insulation system selection
    { id: 'insulation-system', type: 'group', title: 'Insulation System Selection', description: 'Insulation type and system specifications', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'insulation_type', type: 'select', title: 'Insulation Type', label: 'Insulation Type', sectionId: 'project-section', groupId: 'insulation-system', size: 8, options: [
      { label: 'Glass Fiber', value: 'glass_fiber' },
      { label: 'Mineral Wool', value: 'mineral_wool' },
      { label: 'Cellular Glass', value: 'cellular_glass' },
      { label: 'Polyurethane Foam', value: 'polyurethane_foam' },
      { label: 'Polystyrene Foam', value: 'polystyrene_foam' },
      { label: 'Elastomeric Foam', value: 'elastomeric_foam' },
      { label: 'Aerogel', value: 'aerogel' },
      { label: 'Calcium Silicate', value: 'calcium_silicate' }
    ]},
    { id: 'insulation_form', type: 'select', title: 'Insulation Form', label: 'Insulation Form', sectionId: 'project-section', groupId: 'insulation-system', size: 8, options: [
      { label: 'Pipe Insulation (Molded)', value: 'pipe_molded' },
      { label: 'Blanket/Batt', value: 'blanket' },
      { label: 'Board/Block', value: 'board' },
      { label: 'Spray Applied', value: 'spray_applied' },
      { label: 'Loose Fill', value: 'loose_fill' },
      { label: 'Flexible Sheet', value: 'flexible_sheet' }
    ]},
    { id: 'insulation_thickness_inches', type: 'number', title: 'Insulation Thickness (inches)', label: 'Insulation Thickness (inches)', sectionId: 'project-section', groupId: 'insulation-system', size: 8 },
    { id: 'thermal_conductivity', type: 'number', title: 'Thermal Conductivity (BTU·in/hr·ft²·°F)', label: 'Thermal Conductivity (BTU·in/hr·ft²·°F)', sectionId: 'project-section', groupId: 'insulation-system', size: 8, placeholder: 'k-value at mean temperature' },
    { id: 'density_pcf', type: 'number', title: 'Density (pcf)', label: 'Density (pcf)', sectionId: 'project-section', groupId: 'insulation-system', size: 8 },
    { id: 'compressive_strength_psi', type: 'number', title: 'Compressive Strength (psi)', label: 'Compressive Strength (psi)', sectionId: 'project-section', groupId: 'insulation-system', size: 8 },

    // Jacketing and accessories
    { id: 'jacketing-accessories', type: 'group', title: 'Jacketing & Accessories', description: 'Weather protection and finishing systems', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'jacketing_type', type: 'select', title: 'Jacketing Type', label: 'Jacketing Type', sectionId: 'project-section', groupId: 'jacketing-accessories', size: 8, options: [
      { label: 'Aluminum', value: 'aluminum' },
      { label: 'Stainless Steel', value: 'stainless_steel' },
      { label: 'PVC', value: 'pvc' },
      { label: 'ASJ (All-Service Jacket)', value: 'asj' },
      { label: 'FSK (Foil-Scrim-Kraft)', value: 'fsk' },
      { label: 'None', value: 'none' }
    ]},
    { id: 'jacketing_thickness', type: 'select', title: 'Jacketing Thickness', label: 'Jacketing Thickness', sectionId: 'project-section', groupId: 'jacketing-accessories', size: 8, watchField: 'jacketing_type', showWhen: 'aluminum,stainless_steel', options: [
      { label: '0.016"', value: '0.016' },
      { label: '0.020"', value: '0.020' },
      { label: '0.024"', value: '0.024' },
      { label: '0.032"', value: '0.032' }
    ]},
    { id: 'vapor_barrier_required', type: 'select', title: 'Vapor Barrier Required', label: 'Vapor Barrier Required', sectionId: 'project-section', groupId: 'jacketing-accessories', size: 8, options: [
      { label: 'Yes - Standard', value: 'standard' },
      { label: 'Yes - Enhanced', value: 'enhanced' },
      { label: 'No', value: 'no' }
    ]},
    { id: 'vapor_barrier_type', type: 'select', title: 'Vapor Barrier Type', label: 'Vapor Barrier Type', sectionId: 'project-section', groupId: 'jacketing-accessories', size: 8, watchField: 'vapor_barrier_required', showWhen: 'standard,enhanced', options: [
      { label: 'ASJ Facing', value: 'asj_facing' },
      { label: 'Foil Facing', value: 'foil_facing' },
      { label: 'Plastic Film', value: 'plastic_film' },
      { label: 'Mastic Coating', value: 'mastic_coating' }
    ]},
    { id: 'uv_protection_required', type: 'select', title: 'UV Protection Required', label: 'UV Protection Required', sectionId: 'project-section', groupId: 'jacketing-accessories', size: 8, options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ]},
    { id: 'fire_retardant_required', type: 'select', title: 'Fire Retardant Required', label: 'Fire Retardant Required', sectionId: 'project-section', groupId: 'jacketing-accessories', size: 8, options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ]},

    // Installation factors
    { id: 'installation-factors', type: 'group', title: 'Installation Factors', description: 'Installation conditions and complexity', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'installation_difficulty', type: 'select', title: 'Installation Difficulty', label: 'Installation Difficulty', sectionId: 'project-section', groupId: 'installation-factors', size: 8, options: [
      { label: 'Easy Access', value: 'easy' },
      { label: 'Moderate Access', value: 'moderate' },
      { label: 'Difficult Access', value: 'difficult' },
      { label: 'Very Difficult', value: 'very_difficult' }
    ]},
    { id: 'working_height', type: 'select', title: 'Working Height', label: 'Working Height', sectionId: 'project-section', groupId: 'installation-factors', size: 8, options: [
      { label: 'Ground Level', value: 'ground' },
      { label: 'Low (< 20 ft)', value: 'low' },
      { label: 'Medium (20-50 ft)', value: 'medium' },
      { label: 'High (> 50 ft)', value: 'high' }
    ]},
    { id: 'congestion_level', type: 'select', title: 'Congestion Level', label: 'Congestion Level', sectionId: 'project-section', groupId: 'installation-factors', size: 8, options: [
      { label: 'Open Area', value: 'open' },
      { label: 'Moderate Congestion', value: 'moderate' },
      { label: 'Congested', value: 'congested' },
      { label: 'Very Congested', value: 'very_congested' }
    ]},
    { id: 'removable_insulation_required', type: 'select', title: 'Removable Insulation Required', label: 'Removable Insulation Required', sectionId: 'project-section', groupId: 'installation-factors', size: 8, options: [
      { label: 'Yes - Frequent Access', value: 'frequent' },
      { label: 'Yes - Occasional Access', value: 'occasional' },
      { label: 'No', value: 'no' }
    ]},
    { id: 'support_system_required', type: 'select', title: 'Support System Required', label: 'Support System Required', sectionId: 'project-section', groupId: 'installation-factors', size: 8, options: [
      { label: 'Standard Supports', value: 'standard' },
      { label: 'Heavy Duty Supports', value: 'heavy_duty' },
      { label: 'Special Supports', value: 'special' },
      { label: 'None Required', value: 'none' }
    ]},

    // Performance requirements
    { id: 'performance-requirements', type: 'group', title: 'Performance Requirements', description: 'Thermal performance and energy savings targets', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'heat_loss_target', type: 'number', title: 'Heat Loss Target (BTU/hr/ft)', label: 'Heat Loss Target (BTU/hr/ft)', sectionId: 'project-section', groupId: 'performance-requirements', size: 8, placeholder: 'Maximum allowable heat loss' },
    { id: 'surface_temperature_limit', type: 'number', title: 'Surface Temperature Limit (°F)', label: 'Surface Temperature Limit (°F)', sectionId: 'project-section', groupId: 'performance-requirements', size: 8, defaultValue: 140 },
    { id: 'energy_cost_per_mmbtu', type: 'number', title: 'Energy Cost ($/MMBTU)', label: 'Energy Cost ($/MMBTU)', sectionId: 'project-section', groupId: 'performance-requirements', size: 8, defaultValue: 8.50 },
    { id: 'operating_hours_per_year', type: 'number', title: 'Operating Hours/Year', label: 'Operating Hours/Year', sectionId: 'project-section', groupId: 'performance-requirements', size: 8, defaultValue: 8760 },
    { id: 'payback_period_target_years', type: 'number', title: 'Payback Period Target (years)', label: 'Payback Period Target (years)', sectionId: 'project-section', groupId: 'performance-requirements', size: 8, defaultValue: 3 },

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Material and labor cost assumptions', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'insulation_cost_per_cuft', type: 'number', title: 'Insulation Cost ($/cu ft)', label: 'Insulation Cost ($/cu ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 4.25 },
    { id: 'jacketing_cost_per_sqft', type: 'number', title: 'Jacketing Cost ($/sq ft)', label: 'Jacketing Cost ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 2.75 },
    { id: 'accessories_cost_per_sqft', type: 'number', title: 'Accessories Cost ($/sq ft)', label: 'Accessories Cost ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 1.50 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 68 },
    { id: 'productivity_sqft_per_hour', type: 'number', title: 'Productivity (sq ft/hour)', label: 'Productivity (sq ft/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 15 },
    { id: 'waste_factor_percent', type: 'number', title: 'Waste Factor (%)', label: 'Waste Factor (%)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 10 },

    // Pricing and profitability
    { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'material_markup_percent', type: 'number', title: 'Material Markup (%)', label: 'Material Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 28 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 38 },
    { id: 'jacketing_markup_percent', type: 'number', title: 'Jacketing Markup (%)', label: 'Jacketing Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 25 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 17 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 16 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 8 },

    // Energy savings value
    { id: 'energy-value', type: 'group', title: 'Energy Savings Value', description: 'Value-based pricing for energy efficiency', sectionId: 'project-section', order: 10, size: 24, collapsible: true },
    { id: 'energy_savings_sharing_percent', type: 'number', title: 'Energy Savings Sharing (%)', label: 'Energy Savings Sharing (%)', sectionId: 'project-section', groupId: 'energy-value', size: 8, defaultValue: 0, placeholder: 'Share of first-year energy savings' },
    { id: 'performance_guarantee_premium_percent', type: 'number', title: 'Performance Guarantee Premium (%)', label: 'Performance Guarantee Premium (%)', sectionId: 'project-section', groupId: 'energy-value', size: 8, defaultValue: 0 },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Minimum Acceptable Margin (%)', label: 'Minimum Acceptable Margin (%)', sectionId: 'project-section', groupId: 'energy-value', size: 8, defaultValue: 14 }
  ],
  aiPrompt: `
You are an **industrial insulation estimation expert**.  
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
   - Thermal Analysis & Thickness Optimization *(table)*  
   - Material Takeoff (MTO) *(table)*  
   - Labor & Equipment Estimate *(table with crew composition, hours, productivity)*  
   - Cost Breakdown *(table with line items, subtotals, totals)*  
   - Energy Savings Analysis *(table with calculations)*  
   - Schedule & Phasing  
   - Risk & Uncertainty Analysis  
   - Exclusions & Clarifications  
   

2. **Formatting Rules**  
   - Use **Markdown headings** for sections  
   - Use **tables** for numeric breakdowns (Thermal, MTO, Labor, Cost, Energy)  
   - Show **formulas explicitly** (e.g., *Heat Loss = (Operating Temp - Ambient Temp) × Surface Area ÷ R-Value*)  
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

   - **Thermal Performance**  
     - R-Value = Thickness ÷ Thermal Conductivity  
     - Heat Loss = (Operating Temp - Ambient Temp) × Surface Area ÷ R-Value  
     - Surface Temperature = Operating Temp - (Heat Loss × R-Value ÷ Surface Area)  
     - Energy Loss = Heat Loss × Operating Hours × Energy Cost  

   - **Material Quantities**  
     - Insulation Volume = Surface Area × Thickness × (1 + Waste Factor)  
     - Jacketing Area = Surface Area × Jacketing Factor  
     - Vapor Barrier Area = Surface Area × 1.1 (overlap)  
     - Support Hardware = Surface Area ÷ Support Spacing  

   - **Labor Hours**  
     - Installation Hours = Surface Area ÷ Productivity Rate  
     - Jacketing Hours = Jacketing Area ÷ Jacketing Rate  
     - Support Hours = Support Count × Installation Time per Support  
     - Total Labor = Installation + Jacketing + Support + Setup/QC  

   - **Equipment & Tools**  
     - Equipment Days = Total Labor Hours ÷ (Crew Hours/Day)  
     - Equipment Cost = Days × Equipment Rate per Day  

   - **Energy Savings**  
     - Baseline Heat Loss = Uninsulated Heat Loss  
     - Insulated Heat Loss = Heat Loss with Insulation  
     - Annual Energy Savings = (Baseline - Insulated) × Operating Hours × Energy Cost  
     - Simple Payback = Total Project Cost ÷ Annual Energy Savings  

   - **Total Cost**  
     - Direct Costs = Materials + Labor + Equipment + Testing  
     - Apply markups: **Material, Labor, Jacketing**  
     - Add **Overhead, Profit Margin, Contingency**  
     - Apply **Energy Savings Sharing** if applicable  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Thermal Analysis**  
   | Parameter | Uninsulated | Insulated | Improvement | Formula |
   |-----------|------------:|----------:|------------:|---------|
   | Heat Loss (BTU/hr) | 125,000 | 15,600 | 87.5% | (T1-T2) × A ÷ R |
   
   **Material Takeoff (MTO)**  
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | Glass Fiber Insulation | cu ft | 450.5 | Area × Thickness × 1.10 | 10% waste |
   
   **Labor & Equipment Estimate**  
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | Insulation Installation | 15 sq ft/hr | 400 | $68/hr | $27,200 | Certified insulators |
   
   **Cost Breakdown**  
| Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | Insulation Materials | $4.25/cu ft | 450.5 | $1,915 | Material costs |
   
   **Energy Savings Analysis**  
   | Parameter | Value | Unit | Calculation | Annual Impact |
   |-----------|------:|------|-------------|---------------|
   | Energy Savings | 87.5 | % | Heat loss reduction | $45,600/year |
   
   Include **subtotals** and **grand total** with proper formatting.

5. **Contextual Rationale**  
   - Explain **Insulation Type Selection** based on temperature range and environment  
   - Justify **Thickness Optimization** for energy efficiency vs. cost  
   - Note how **Environmental Exposure** affects jacketing and vapor barrier requirements  
   - Address **Installation Difficulty** and **Working Height** impact on productivity  
   - Explain **Energy Savings Methodology** and payback calculations  
   - Detail **Performance Requirements** and surface temperature limits  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  
   - Emphasize **energy efficiency** and **ROI benefits**  `
};


