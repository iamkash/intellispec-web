module.exports = {
  id: 'intumescent-coating-calculator',
  name: 'Intumescent Coating Calculator',
  description: 'Epoxy-based intumescent fireproofing estimation for structural steel with NASA-developed technology specifications',
  category: 'Fireproofing',
  module: 'quote',
  icon: 'ExperimentOutlined',
  tags: ['intumescent', 'epoxy', 'coating', 'nasa', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Intumescent System Specification', description: 'Epoxy intumescent coating system requirements', icon: 'ExperimentOutlined', order: 1, size: 24 },

    // Project identification
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Project details and scope', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'project_phase', type: 'select', title: 'Project Phase', label: 'Project Phase', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'New Construction', value: 'new' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Retrofit', value: 'retrofit' },
      { label: 'Emergency Repair', value: 'emergency' }
    ]},
    { id: 'application_location', type: 'select', title: 'Application Location', label: 'Application Location', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Shop Applied', value: 'shop' },
      { label: 'Field Applied', value: 'field' },
      { label: 'Combination', value: 'combination' }
    ]},

    // Steel substrate details
    { id: 'substrate-details', type: 'group', title: 'Steel Substrate Details', description: 'Steel structure specifications and surface conditions', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'steel_structure_type', type: 'select', title: 'Steel Structure Type', label: 'Steel Structure Type', sectionId: 'project-section', groupId: 'substrate-details', size: 8, options: [
      { label: 'Structural Beams', value: 'beams' },
      { label: 'Columns', value: 'columns' },
      { label: 'Vessel Skirts', value: 'vessel_skirts' },
      { label: 'Bulkheads', value: 'bulkheads' },
      { label: 'Underdecks', value: 'underdecks' },
      { label: 'Electrical Raceways', value: 'electrical_raceways' }
    ]},
    { id: 'steel_section_size', type: 'text', title: 'Steel Section Size', label: 'Steel Section Size', sectionId: 'project-section', groupId: 'substrate-details', size: 8, placeholder: 'e.g., W12x26, HSS8x8x1/2' },
    { id: 'steel_grade', type: 'select', title: 'Steel Grade', label: 'Steel Grade', sectionId: 'project-section', groupId: 'substrate-details', size: 8, options: [
      { label: 'A36', value: 'a36' },
      { label: 'A572 Grade 50', value: 'a572_50' },
      { label: 'A992', value: 'a992' },
      { label: 'A588 Weathering', value: 'a588' }
    ]},
    { id: 'surface_area_sqft', type: 'number', title: 'Total Surface Area (sq ft)', label: 'Total Surface Area (sq ft)', sectionId: 'project-section', groupId: 'substrate-details', size: 8 },
    { id: 'perimeter_linear_ft', type: 'number', title: 'Perimeter Length (linear ft)', label: 'Perimeter Length (linear ft)', sectionId: 'project-section', groupId: 'substrate-details', size: 8 },
    { id: 'web_area_sqft', type: 'number', title: 'Web Area (sq ft)', label: 'Web Area (sq ft)', sectionId: 'project-section', groupId: 'substrate-details', size: 8 },

    // Fire protection requirements
    { id: 'fire-protection', type: 'group', title: 'Fire Protection Requirements', description: 'Fire rating and scenario specifications', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'fire_rating_hours', type: 'select', title: 'Fire Rating (hours)', label: 'Fire Rating (hours)', sectionId: 'project-section', groupId: 'fire-protection', size: 8, options: [
      { label: '1 Hour', value: '1' },
      { label: '2 Hours', value: '2' },
      { label: '3 Hours', value: '3' },
      { label: '4 Hours', value: '4' }
    ]},
    { id: 'fire_scenario_type', type: 'select', title: 'Fire Scenario', label: 'Fire Scenario', sectionId: 'project-section', groupId: 'fire-protection', size: 8, options: [
      { label: 'Hydrocarbon Pool Fire', value: 'pool_fire' },
      { label: 'Jet Fire', value: 'jet_fire' },
      { label: 'Cellulosic Fire', value: 'cellulosic' },
      { label: 'Combined HC/Cellulosic', value: 'combined' }
    ]},
    { id: 'temperature_exposure', type: 'number', title: 'Max Temperature Exposure (°F)', label: 'Max Temperature Exposure (°F)', sectionId: 'project-section', groupId: 'fire-protection', size: 8, defaultValue: 2000 },
    { id: 'critical_steel_temp', type: 'number', title: 'Critical Steel Temperature (°F)', label: 'Critical Steel Temperature (°F)', sectionId: 'project-section', groupId: 'fire-protection', size: 8, defaultValue: 1000 },
    { id: 'massivity_factor', type: 'number', title: 'Massivity Factor (ft⁻¹)', label: 'Massivity Factor (ft⁻¹)', sectionId: 'project-section', groupId: 'fire-protection', size: 8, placeholder: 'Perimeter/Area ratio' },
    { id: 'load_bearing', type: 'select', title: 'Load Bearing Element', label: 'Load Bearing Element', sectionId: 'project-section', groupId: 'fire-protection', size: 8, options: [
      { label: 'Yes - Critical', value: 'critical' },
      { label: 'Yes - Non-Critical', value: 'non_critical' },
      { label: 'No', value: 'no' }
    ]},

    // Intumescent system specifications
    { id: 'intumescent-specs', type: 'group', title: 'Intumescent System Specifications', description: 'Epoxy intumescent coating specifications', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'intumescent_product', type: 'select', title: 'Intumescent Product', label: 'Intumescent Product', sectionId: 'project-section', groupId: 'intumescent-specs', size: 8, options: [
      { label: 'Carboline Pyrocrete 241', value: 'pyrocrete_241' },
      { label: 'Sherwin-Williams Firetex FX2001', value: 'firetex_fx2001' },
      { label: 'PPG Pitt-Char XP', value: 'pitt_char_xp' },
      { label: 'Jotun Chartek 1709', value: 'chartek_1709' },
      { label: 'Other NASA-approved', value: 'other_nasa' }
    ]},
    { id: 'coating_system_type', type: 'select', title: 'Coating System', label: 'Coating System', sectionId: 'project-section', groupId: 'intumescent-specs', size: 8, options: [
      { label: 'Two-Component Epoxy', value: 'two_component' },
      { label: 'Single Component', value: 'single_component' },
      { label: 'Water-Based', value: 'water_based' },
      { label: 'Solvent-Based', value: 'solvent_based' }
    ]},
    { id: 'required_dft_mils', type: 'number', title: 'Required DFT (mils)', label: 'Required DFT (mils)', sectionId: 'project-section', groupId: 'intumescent-specs', size: 8 },
    { id: 'expansion_ratio', type: 'number', title: 'Expansion Ratio', label: 'Expansion Ratio', sectionId: 'project-section', groupId: 'intumescent-specs', size: 8, defaultValue: 50, placeholder: 'Times original thickness' },
    { id: 'char_formation_temp', type: 'number', title: 'Char Formation Temp (°F)', label: 'Char Formation Temp (°F)', sectionId: 'project-section', groupId: 'intumescent-specs', size: 8, defaultValue: 400 },
    { id: 'theoretical_coverage', type: 'number', title: 'Theoretical Coverage (sq ft/gal)', label: 'Theoretical Coverage (sq ft/gal)', sectionId: 'project-section', groupId: 'intumescent-specs', size: 8 },

    // Surface preparation and primer
    { id: 'surface-prep', type: 'group', title: 'Surface Preparation & Primer', description: 'Surface preparation requirements and primer specifications', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'surface_prep_standard', type: 'select', title: 'Surface Prep Standard', label: 'Surface Prep Standard', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'SSPC-SP 6 (Commercial Blast)', value: 'sspc_sp6' },
      { label: 'SSPC-SP 10 (Near-White Blast)', value: 'sspc_sp10' },
      { label: 'SSPC-SP 3 (Power Tool)', value: 'sspc_sp3' },
      { label: 'SSPC-SP 2 (Hand Tool)', value: 'sspc_sp2' }
    ]},
    { id: 'surface_profile', type: 'select', title: 'Surface Profile', label: 'Surface Profile', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: '1.5-3.0 mils', value: '1.5_3.0' },
      { label: '2.0-4.0 mils', value: '2.0_4.0' },
      { label: '3.0-5.0 mils', value: '3.0_5.0' }
    ]},
    { id: 'primer_required', type: 'select', title: 'Primer Required', label: 'Primer Required', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'Yes - Epoxy Primer', value: 'epoxy_primer' },
      { label: 'Yes - Zinc-Rich Primer', value: 'zinc_primer' },
      { label: 'No - Direct to Steel', value: 'direct_steel' }
    ]},
    { id: 'primer_dft_mils', type: 'number', title: 'Primer DFT (mils)', label: 'Primer DFT (mils)', sectionId: 'project-section', groupId: 'surface-prep', size: 8, watchField: 'primer_required', showWhen: 'epoxy_primer,zinc_primer' },
    { id: 'primer_coverage', type: 'number', title: 'Primer Coverage (sq ft/gal)', label: 'Primer Coverage (sq ft/gal)', sectionId: 'project-section', groupId: 'surface-prep', size: 8, watchField: 'primer_required', showWhen: 'epoxy_primer,zinc_primer' },

    // Application conditions
    { id: 'application-conditions', type: 'group', title: 'Application Conditions', description: 'Environmental and application parameters', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'application_method', type: 'select', title: 'Application Method', label: 'Application Method', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Airless Spray', value: 'airless_spray' },
      { label: 'Air-Assisted Spray', value: 'air_assisted' },
      { label: 'Brush/Roller', value: 'brush_roller' },
      { label: 'Plural Component Spray', value: 'plural_component' }
    ]},
    { id: 'application_temperature', type: 'number', title: 'Application Temperature (°F)', label: 'Application Temperature (°F)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 75 },
    { id: 'relative_humidity', type: 'number', title: 'Relative Humidity (%)', label: 'Relative Humidity (%)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 50 },
    { id: 'cure_time_hours', type: 'number', title: 'Cure Time (hours)', label: 'Cure Time (hours)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 24 },
    { id: 'recoat_window_hours', type: 'number', title: 'Recoat Window (hours)', label: 'Recoat Window (hours)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 72 },
    { id: 'pot_life_minutes', type: 'number', title: 'Pot Life (minutes)', label: 'Pot Life (minutes)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 45 },

    // Quality control and testing
    { id: 'quality-control', type: 'group', title: 'Quality Control & Testing', description: 'Inspection and testing requirements', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'dft_testing_frequency', type: 'select', title: 'DFT Testing Frequency', label: 'DFT Testing Frequency', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: '1 per 100 sq ft', value: '100_sqft' },
      { label: '1 per 50 sq ft', value: '50_sqft' },
      { label: '1 per 25 sq ft', value: '25_sqft' },
      { label: 'Continuous monitoring', value: 'continuous' }
    ]},
    { id: 'adhesion_testing', type: 'select', title: 'Adhesion Testing', label: 'Adhesion Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Pull-off Test (ASTM D4541)', value: 'pull_off' },
      { label: 'Cross-cut Test (ASTM D3359)', value: 'cross_cut' },
      { label: 'Both Methods', value: 'both' },
      { label: 'None Required', value: 'none' }
    ]},
    { id: 'fire_testing_required', type: 'select', title: 'Fire Testing Required', label: 'Fire Testing Required', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'UL Listing Verification', value: 'ul_verification' },
      { label: 'ASTM E119 Test', value: 'astm_e119' },
      { label: 'Hydrocarbon Fire Test', value: 'hydrocarbon_test' },
      { label: 'No Testing', value: 'no_testing' }
    ]},

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Material and labor cost assumptions', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'intumescent_cost_per_gallon', type: 'number', title: 'Intumescent Cost ($/gallon)', label: 'Intumescent Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 125 },
    { id: 'primer_cost_per_gallon', type: 'number', title: 'Primer Cost ($/gallon)', label: 'Primer Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 45 },
    { id: 'surface_prep_cost_per_sqft', type: 'number', title: 'Surface Prep Cost ($/sq ft)', label: 'Surface Prep Cost ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 3.50 },
    { id: 'application_rate_sqft_per_hour', type: 'number', title: 'Application Rate (sq ft/hour)', label: 'Application Rate (sq ft/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 30 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 75 },
    { id: 'waste_factor_percent', type: 'number', title: 'Waste Factor (%)', label: 'Waste Factor (%)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 10 },

    // Pricing and profitability
    { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'material_markup_percent', type: 'number', title: 'Material Markup (%)', label: 'Material Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 28 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 38 },
    { id: 'equipment_markup_percent', type: 'number', title: 'Equipment Markup (%)', label: 'Equipment Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 22 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 16 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 18 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 8 },

    // Competitive pricing
    { id: 'competitive-pricing', type: 'group', title: 'Competitive Pricing', description: 'Market positioning and discount strategies', sectionId: 'project-section', order: 10, size: 24, collapsible: true },
    { id: 'market_position', type: 'select', title: 'Market Position', label: 'Market Position', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, options: [
      { label: 'Premium (NASA Technology)', value: 'premium' },
      { label: 'Market Rate', value: 'market' },
      { label: 'Competitive', value: 'competitive' }
    ]},
    { id: 'technology_premium_percent', type: 'number', title: 'Technology Premium (%)', label: 'Technology Premium (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 5 },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Minimum Acceptable Margin (%)', label: 'Minimum Acceptable Margin (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 18 }
  ],
  aiPrompt: `
You are an **intumescent coating estimation expert**.  
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
   - Show **formulas explicitly** (e.g., *Gallons Required = Surface Area ÷ Coverage × (1 + Waste Factor)*)  
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
     - Massivity Factor = Perimeter ÷ Cross-sectional Area  
     - Required DFT = Function of Fire Rating, Steel Type, Massivity  
     - Expansion Ratio Performance = DFT × Expansion Ratio  
     - Critical Temperature Protection = Steel Temperature Limit  

   - **Material Quantities**  
     - Intumescent Gallons = Surface Area ÷ Theoretical Coverage × (1 + Waste Factor)  
     - Primer Gallons = Surface Area ÷ Primer Coverage (if required)  
     - Total Material Cost = (Intumescent × Cost/Gal) + (Primer × Primer Cost/Gal)  

   - **Labor Hours**  
     - Surface Prep Hours = Surface Area ÷ Prep Rate  
     - Primer Application = Surface Area ÷ Primer Application Rate  
     - Intumescent Application = Surface Area ÷ Application Rate  
     - Total Labor Hours = Prep + Primer + Application + Setup/QC  

   - **Equipment**  
     - Equipment Days = Total Labor Hours ÷ (Crew Hours/Day)  
     - Equipment Cost = Days × Equipment Cost per Day  

   - **Testing & QA**  
     - DFT Testing Points = Surface Area ÷ Testing Frequency  
     - Adhesion Tests = Based on testing requirements  
     - Fire Testing = Based on fire testing requirements  

   - **Total Cost**  
     - Direct Costs = Materials + Labor + Equipment + Testing + Surface Prep  
     - Apply markups: **Material, Labor, Equipment**  
     - Add **Overhead, Profit Margin, Contingency**  
     - Apply **Technology Premium** and **Competitive Adjustments**  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Fire Protection Analysis**  
   | Parameter | Value | Unit | Standard | Performance |
   |-----------|------:|------|----------|-------------|
   | Required DFT | 25 | mils | UL Listed | 2-hour rating |
   
   **Material Takeoff (MTO)**  
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | Intumescent Coating | gal | 67.5 | Area ÷ Coverage × 1.10 | 10% waste |
   
   **Labor & Equipment Estimate**  
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | Spray Application | 30 sq ft/hr | 200 | $75/hr | $15,000 | NASA technology |
   
   **Cost Breakdown**  
   | Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | Intumescent Materials | $125/gal | 67.5 | $8,438 | Premium coating |
   
   Include **subtotals** and **grand total** with proper formatting.  

5. **Contextual Rationale**  
   - Explain **NASA Technology Heritage** and advanced epoxy formulation  
   - Justify **Fire Scenario Selection** (hydrocarbon vs. cellulosic) and impact on DFT  
   - Note how **Steel Structure Type** affects massivity and protection requirements  
   - Address **Surface Preparation Standards** and primer compatibility  
   - Explain **Application Method** selection and environmental conditions  
   - Detail **Quality Control** requirements and fire testing protocols  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  
   - Emphasize **advanced technology** and **performance advantages**  `
};


