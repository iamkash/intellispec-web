module.exports = {
  id: 'pfp-system-estimator',
  name: 'PFP System Estimator',
  description: 'Passive Fire Protection system estimation with material thickness and coverage calculations for structural steel protection',
  category: 'Fireproofing',
  module: 'quote',
  icon: 'FireOutlined',
  tags: ['pfp', 'fireproofing', 'structural', 'estimation', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Project Information', description: 'Basic project details and requirements', icon: 'ProjectOutlined', order: 1, size: 24 },

     // Project basics
     { id: 'project-info', type: 'group', title: 'Project Details', description: 'Project identification and scope', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'rfp_number', type: 'text', title: 'RFP Number', label: 'RFP Number', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'RFP-2024-001' },
    { id: 'project_location', type: 'text', title: 'Project Location', label: 'Project Location', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'City, State' },
    { id: 'project_type', type: 'select', title: 'Project Type', label: 'Project Type', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'New Construction', value: 'new_construction' },
      { label: 'Maintenance/Repair', value: 'maintenance' },
      { label: 'Retrofit', value: 'retrofit' },
      { label: 'Turnaround', value: 'turnaround' }
    ]},
    { id: 'industry_sector', type: 'select', title: 'Industry Sector', label: 'Industry Sector', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Petroleum Refining', value: 'petroleum' },
      { label: 'Petrochemical', value: 'petrochemical' },
      { label: 'Chemical Processing', value: 'chemical' },
      { label: 'Power Generation', value: 'power' },
      { label: 'Commercial', value: 'commercial' }
    ]},

     // Fire protection requirements
     { id: 'fire-requirements', type: 'group', title: 'Fire Protection Requirements', description: 'Fire rating and protection specifications', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'fire_rating_hours', type: 'select', title: 'Fire Rating Required (hours)', label: 'Fire Rating Required (hours)', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, options: [
      { label: '1 Hour', value: '1' },
      { label: '2 Hours', value: '2' },
      { label: '3 Hours', value: '3' },
      { label: '4 Hours', value: '4' }
    ]},
    { id: 'fire_scenario', type: 'select', title: 'Fire Scenario', label: 'Fire Scenario', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, options: [
      { label: 'Hydrocarbon Pool Fire', value: 'pool_fire' },
      { label: 'Jet Fire', value: 'jet_fire' },
      { label: 'Cellulosic Fire', value: 'cellulosic' },
      { label: 'Combined Scenarios', value: 'combined' }
    ]},
    { id: 'critical_temperature', type: 'number', title: 'Critical Temperature (°F)', label: 'Critical Temperature (°F)', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, defaultValue: 1000 },
    { id: 'ambient_temperature', type: 'number', title: 'Ambient Temperature (°F)', label: 'Ambient Temperature (°F)', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, defaultValue: 70 },
    { id: 'regulatory_requirements', type: 'checkbox_group', title: 'Regulatory Requirements', label: 'Regulatory Requirements', sectionId: 'project-section', groupId: 'fire-requirements', size: 24, options: [
      'OSHA 1910.106',
      'API 2218',
      'NFPA 30',
      'Local Fire Code',
      'Insurance Requirements',
      'Corporate Standards'
    ]},

     // Substrate information
     { id: 'substrate-info', type: 'group', title: 'Substrate Information', description: 'Steel structure details and specifications', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'substrate_type', type: 'select', title: 'Substrate Type', label: 'Substrate Type', sectionId: 'project-section', groupId: 'substrate-info', size: 8, options: [
      { label: 'Structural Steel Beams', value: 'steel_beams' },
      { label: 'Steel Columns', value: 'steel_columns' },
      { label: 'Vessel Skirts', value: 'vessel_skirts' },
      { label: 'Pipe Supports', value: 'pipe_supports' },
      { label: 'Equipment Supports', value: 'equipment_supports' },
      { label: 'Electrical Raceways', value: 'electrical_raceways' }
    ]},
    { id: 'steel_grade', type: 'select', title: 'Steel Grade', label: 'Steel Grade', sectionId: 'project-section', groupId: 'substrate-info', size: 8, options: [
      { label: 'A36', value: 'a36' },
      { label: 'A572 Grade 50', value: 'a572_50' },
      { label: 'A992', value: 'a992' },
      { label: 'Stainless Steel', value: 'stainless' }
    ]},
    { id: 'surface_condition', type: 'select', title: 'Surface Condition', label: 'Surface Condition', sectionId: 'project-section', groupId: 'substrate-info', size: 8, options: [
      { label: 'Mill Scale', value: 'mill_scale' },
      { label: 'Blast Cleaned', value: 'blast_cleaned' },
      { label: 'Previously Coated', value: 'previously_coated' },
      { label: 'Weathered', value: 'weathered' }
    ]},
    { id: 'total_surface_area', type: 'number', title: 'Total Surface Area (sq ft)', label: 'Total Surface Area (sq ft)', sectionId: 'project-section', groupId: 'substrate-info', size: 8 },
    { id: 'perimeter_area', type: 'number', title: 'Perimeter Area (sq ft)', label: 'Perimeter Area (sq ft)', sectionId: 'project-section', groupId: 'substrate-info', size: 8 },
    { id: 'complex_geometry_factor', type: 'select', title: 'Geometry Complexity', label: 'Geometry Complexity', sectionId: 'project-section', groupId: 'substrate-info', size: 8, options: [
      { label: 'Simple (1.0x)', value: '1.0' },
      { label: 'Moderate (1.2x)', value: '1.2' },
      { label: 'Complex (1.5x)', value: '1.5' },
      { label: 'Very Complex (2.0x)', value: '2.0' }
    ]},

     // System selection
     { id: 'system-selection', type: 'group', title: 'PFP System Selection', description: 'Fireproofing system type and specifications', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'pfp_system_type', type: 'select', title: 'PFP System Type', label: 'PFP System Type', sectionId: 'project-section', groupId: 'system-selection', size: 8, options: [
      { label: 'Epoxy Intumescent', value: 'epoxy_intumescent' },
      { label: 'Cementitious Spray', value: 'cementitious_spray' },
      { label: 'Mineral Fiber Board', value: 'mineral_fiber' },
      { label: 'Concrete Encasement', value: 'concrete' }
    ]},
    { id: 'manufacturer', type: 'select', title: 'Manufacturer', label: 'Manufacturer', sectionId: 'project-section', groupId: 'system-selection', size: 8, options: [
      { label: 'Carboline', value: 'carboline' },
      { label: 'Sherwin-Williams', value: 'sherwin_williams' },
      { label: 'PPG', value: 'ppg' },
      { label: 'Jotun', value: 'jotun' },
      { label: 'Other', value: 'other' }
    ]},
    { id: 'product_name', type: 'text', title: 'Product Name', label: 'Product Name', sectionId: 'project-section', groupId: 'system-selection', size: 8, placeholder: 'e.g., Pyrocrete 241' },
    { id: 'required_thickness_mils', type: 'number', title: 'Required Thickness (mils)', label: 'Required Thickness (mils)', sectionId: 'project-section', groupId: 'system-selection', size: 8 },
    { id: 'coverage_sqft_per_gallon', type: 'number', title: 'Coverage (sq ft/gal)', label: 'Coverage (sq ft/gal)', sectionId: 'project-section', groupId: 'system-selection', size: 8 },

     // Environmental conditions
     { id: 'environmental', type: 'group', title: 'Environmental Conditions', description: 'Site conditions and environmental factors', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'environmental_exposure', type: 'select', title: 'Environmental Exposure', label: 'Environmental Exposure', sectionId: 'project-section', groupId: 'environmental', size: 8, options: [
      { label: 'Indoor/Sheltered', value: 'indoor' },
      { label: 'Outdoor/Atmospheric', value: 'outdoor' },
      { label: 'Marine/Coastal', value: 'marine' },
      { label: 'Chemical Exposure', value: 'chemical' }
    ]},
    { id: 'humidity_level', type: 'select', title: 'Humidity Level', label: 'Humidity Level', sectionId: 'project-section', groupId: 'environmental', size: 8, options: [
      { label: 'Low (<50%)', value: 'low' },
      { label: 'Moderate (50-70%)', value: 'moderate' },
      { label: 'High (>70%)', value: 'high' }
    ]},
    { id: 'temperature_cycling', type: 'select', title: 'Temperature Cycling', label: 'Temperature Cycling', sectionId: 'project-section', groupId: 'environmental', size: 8, options: [
      { label: 'Minimal', value: 'minimal' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'Severe', value: 'severe' }
    ]},

     // Application factors
     { id: 'application-factors', type: 'group', title: 'Application Factors', description: 'Installation method and site factors', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'application_method', type: 'select', title: 'Application Method', label: 'Application Method', sectionId: 'project-section', groupId: 'application-factors', size: 8, options: [
      { label: 'Spray Application', value: 'spray' },
      { label: 'Brush/Roller', value: 'brush_roller' },
      { label: 'Trowel Application', value: 'trowel' }
    ]},
    { id: 'access_difficulty', type: 'select', title: 'Access Difficulty', label: 'Access Difficulty', sectionId: 'project-section', groupId: 'application-factors', size: 8, options: [
      { label: 'Easy Access', value: 'easy' },
      { label: 'Moderate Access', value: 'moderate' },
      { label: 'Difficult Access', value: 'difficult' },
      { label: 'Very Difficult', value: 'very_difficult' }
    ]},
    { id: 'working_height', type: 'select', title: 'Working Height', label: 'Working Height', sectionId: 'project-section', groupId: 'application-factors', size: 8, options: [
      { label: 'Ground Level', value: 'ground' },
      { label: 'Low (< 20 ft)', value: 'low' },
      { label: 'Medium (20-50 ft)', value: 'medium' },
      { label: 'High (> 50 ft)', value: 'high' }
    ]},
    { id: 'surface_prep_required', type: 'select', title: 'Surface Prep Required', label: 'Surface Prep Required', sectionId: 'project-section', groupId: 'application-factors', size: 8, options: [
      { label: 'Minimal Cleaning', value: 'minimal' },
      { label: 'Power Tool Cleaning', value: 'power_tool' },
      { label: 'Blast Cleaning', value: 'blast' },
      { label: 'Chemical Stripping', value: 'chemical' }
    ]},
    { id: 'primer_required', type: 'select', title: 'Primer Required', label: 'Primer Required', sectionId: 'project-section', groupId: 'application-factors', size: 8, options: [
      { label: 'No Primer', value: 'none' },
      { label: 'Standard Primer', value: 'standard' },
      { label: 'High-Performance Primer', value: 'high_performance' }
    ]},
    { id: 'waste_factor_percent', type: 'number', title: 'Waste Factor (%)', label: 'Waste Factor (%)', sectionId: 'project-section', groupId: 'application-factors', size: 8, defaultValue: 15 },

     // Cost factors
     { id: 'cost-factors', type: 'group', title: 'Cost Factors', description: 'Pricing and cost assumptions', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'material_cost_per_gallon', type: 'number', title: 'Material Cost ($/gallon)', label: 'Material Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-factors', size: 8, defaultValue: 85 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-factors', size: 8, defaultValue: 65 },
    { id: 'productivity_sqft_per_hour', type: 'number', title: 'Productivity (sq ft/hour)', label: 'Productivity (sq ft/hour)', sectionId: 'project-section', groupId: 'cost-factors', size: 8, defaultValue: 25 },
    { id: 'equipment_cost_per_day', type: 'number', title: 'Equipment Cost ($/day)', label: 'Equipment Cost ($/day)', sectionId: 'project-section', groupId: 'cost-factors', size: 8, defaultValue: 350 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'cost-factors', size: 8, defaultValue: 20 },
    { id: 'profit_margin_percentage', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'cost-factors', size: 8, defaultValue: 15 },

     // Pricing and profitability
     { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'material_markup_percent', type: 'number', title: 'Material Markup (%)', label: 'Material Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 30 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 40 },
    { id: 'equipment_markup_percent', type: 'number', title: 'Equipment Markup (%)', label: 'Equipment Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 25 },
    { id: 'subcontractor_markup_percent', type: 'number', title: 'Subcontractor Markup (%)', label: 'Subcontractor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 15 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 10 },
    { id: 'bond_insurance_percent', type: 'number', title: 'Bond & Insurance (%)', label: 'Bond & Insurance (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 3 },

     // Competitive pricing
     { id: 'competitive-pricing', type: 'group', title: 'Competitive Pricing', description: 'Market positioning and discount strategies', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'market_position', type: 'select', title: 'Market Position', label: 'Market Position', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, options: [
      { label: 'Premium Pricing', value: 'premium' },
      { label: 'Market Rate', value: 'market' },
      { label: 'Competitive', value: 'competitive' },
      { label: 'Aggressive', value: 'aggressive' }
    ]},
    { id: 'volume_discount_percent', type: 'number', title: 'Volume Discount (%)', label: 'Volume Discount (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 0 },
    { id: 'competitive_adjustment_percent', type: 'number', title: 'Competitive Adjustment (%)', label: 'Competitive Adjustment (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 0 },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Minimum Acceptable Margin (%)', label: 'Minimum Acceptable Margin (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 15 }
  ],
  aiPrompt: `
You are a **passive fire protection estimation expert**.  
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
   - Fire Protection Analysis *(table)*  
   - Material Takeoff (MTO) *(table)*  
   - Labor & Equipment Estimate *(table with crew composition, hours, productivity)*  
   - Cost Breakdown *(table with line items, subtotals, totals)*  
   - Schedule & Phasing  
   - Risk & Uncertainty Analysis  
   - Exclusions & Clarifications  
   

2. **Formatting Rules**  
   - Use **Markdown headings** for sections  
   - Use **tables** for numeric breakdowns (Fire Analysis, MTO, Labor, Cost)  
   - Show **formulas explicitly** (e.g., *Material Volume = Surface Area × Thickness × Density Factor*)  
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

   - **Fire Protection Analysis**  
     - Fire Rating Requirements = Based on fire scenario and regulatory standards  
     - Critical Temperature = Steel failure temperature vs. fire exposure  
     - System Selection = Based on substrate type and environmental conditions  
     - Thickness Requirements = Function of fire rating and system type  

   - **Material Quantities**  
     - PFP Material Volume = Surface Area × Thickness × Geometry Factor  
     - Primer/Sealer = Surface Area × Coverage Rate (if required)  
     - Accessories = Based on system requirements and complexity  

   - **Labor Hours**  
     - Surface Preparation = Surface Area ÷ Prep Rate × Complexity Factor  
     - PFP Application = Surface Area ÷ Application Rate × Access Factor  
     - Quality Control = Surface Area × QC Rate  
     - Total Labor = Prep + Application + QC + Setup/Cleanup  

   - **Equipment**  
     - Equipment Days = Total Labor Hours ÷ (Crew Hours/Day)  
     - Equipment Cost = Days × Equipment Rate per Day  

   - **Testing & Inspection**  
     - Thickness Testing = Surface Area ÷ Testing Frequency  
     - Fire Rating Verification = Based on regulatory requirements  
     - Documentation = Complete certification package  

   - **Total Cost**  
     - Direct Costs = Materials + Labor + Equipment + Testing + Surface Prep  
     - Apply markups: **Material, Labor, Equipment, Subcontractor**  
     - Add **Overhead, Profit Margin, Contingency, Bond & Insurance**  
     - Apply **Volume Discounts** and **Competitive Adjustments**  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Fire Protection Analysis**  
   | Parameter | Requirement | System Response | Standard | Compliance |
   |-----------|-------------|-----------------|----------|------------|
   | Fire Rating | 2 hours | Epoxy intumescent | ASTM E119 | UL Listed |
   
   **Material Takeoff (MTO)**  
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | PFP Materials | gal | 125.8 | Area × Thickness × 1.15 | 15% waste |
   
   **Labor & Equipment Estimate**  
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | PFP Application | 25 sq ft/hr | 240 | $65/hr | $15,600 | Certified applicators |
   
   **Cost Breakdown**  
   | Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | PFP Materials | $85/gal | 125.8 | $10,693 | Fire protection system |
   
   Include **subtotals** and **grand total** with proper formatting.  

5. **Contextual Rationale**  
   - Explain **PFP System Selection** based on fire scenario and substrate type  
   - Justify **Fire Rating Requirements** per regulatory standards (OSHA, API, NFPA)  
   - Note how **Environmental Exposure** affects system durability and performance  
   - Address **Surface Condition** and preparation requirements  
   - Explain **Application Method** selection and site access factors  
   - Detail **Quality Control** and **Regulatory Compliance** requirements  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  
   - Emphasize **regulatory compliance** and **fire safety performance**  `
};


