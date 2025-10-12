module.exports = {
  id: 'industrial-coatings-estimator',
  name: 'Industrial Coatings Estimator',
  description: 'Tank linings and specialty coatings estimation for chemical protection with NACE standards compliance',
  category: 'Coatings',
  module: 'quote',
  icon: 'ToolOutlined',
  tags: ['coatings', 'tank', 'lining', 'chemical', 'nace', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Industrial Coatings Specification', description: 'Tank linings and specialty coatings requirements', icon: 'ToolOutlined', order: 1, size: 8 },

    // Project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Project details and application scope', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'application_location', type: 'select', title: 'Application Location', label: 'Application Location', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Shop Applied', value: 'shop' },
      { label: 'Field Applied', value: 'field' },
      { label: 'Combination', value: 'combination' }
    ]},
    { id: 'project_phase', type: 'select', title: 'Project Phase', label: 'Project Phase', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'New Construction', value: 'new' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Repair/Reline', value: 'repair' },
      { label: 'Upgrade', value: 'upgrade' }
    ]},

    // Substrate specifications
    { id: 'substrate-specs', type: 'group', title: 'Substrate Specifications', description: 'Tank/vessel substrate details', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'substrate_type', type: 'select', title: 'Substrate Type', label: 'Substrate Type', sectionId: 'project-section', groupId: 'substrate-specs', size: 8, options: [
      { label: 'Carbon Steel Tank', value: 'carbon_steel_tank' },
      { label: 'Stainless Steel Vessel', value: 'stainless_vessel' },
      { label: 'Concrete Tank', value: 'concrete_tank' },
      { label: 'Steel Piping', value: 'steel_piping' },
      { label: 'Secondary Containment', value: 'secondary_containment' },
      { label: 'Process Equipment', value: 'process_equipment' }
    ]},
    { id: 'tank_diameter_ft', type: 'number', title: 'Tank Diameter (ft)', label: 'Tank Diameter (ft)', sectionId: 'project-section', groupId: 'substrate-specs', size: 8, watchField: 'substrate_type', showWhen: 'carbon_steel_tank,concrete_tank' },
    { id: 'tank_height_ft', type: 'number', title: 'Tank Height (ft)', label: 'Tank Height (ft)', sectionId: 'project-section', groupId: 'substrate-specs', size: 8, watchField: 'substrate_type', showWhen: 'carbon_steel_tank,concrete_tank' },
    { id: 'vessel_dimensions', type: 'text', title: 'Vessel Dimensions', label: 'Vessel Dimensions', sectionId: 'project-section', groupId: 'substrate-specs', size: 8, watchField: 'substrate_type', showWhen: 'stainless_vessel,process_equipment', placeholder: 'L x W x H or Diameter x Height' },
    { id: 'pipe_diameter_inches', type: 'number', title: 'Pipe Diameter (inches)', label: 'Pipe Diameter (inches)', sectionId: 'project-section', groupId: 'substrate-specs', size: 8, watchField: 'substrate_type', showWhen: 'steel_piping' },
    { id: 'pipe_length_ft', type: 'number', title: 'Pipe Length (ft)', label: 'Pipe Length (ft)', sectionId: 'project-section', groupId: 'substrate-specs', size: 8, watchField: 'substrate_type', showWhen: 'steel_piping' },
    { id: 'total_surface_area_sqft', type: 'number', title: 'Total Surface Area (sq ft)', label: 'Total Surface Area (sq ft)', sectionId: 'project-section', groupId: 'substrate-specs', size: 8 },
    { id: 'substrate_condition', type: 'select', title: 'Substrate Condition', label: 'Substrate Condition', sectionId: 'project-section', groupId: 'substrate-specs', size: 8, options: [
      { label: 'New/Clean', value: 'new_clean' },
      { label: 'Previously Coated', value: 'previously_coated' },
      { label: 'Corroded', value: 'corroded' },
      { label: 'Contaminated', value: 'contaminated' }
    ]},

    // Chemical exposure requirements
    { id: 'chemical-exposure', type: 'group', title: 'Chemical Exposure Requirements', description: 'Chemical resistance and environmental conditions', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'primary_chemical', type: 'select', title: 'Primary Chemical', label: 'Primary Chemical', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8, options: [
      { label: 'Sulfuric Acid', value: 'sulfuric_acid' },
      { label: 'Hydrochloric Acid', value: 'hydrochloric_acid' },
      { label: 'Caustic Soda', value: 'caustic_soda' },
      { label: 'Crude Oil', value: 'crude_oil' },
      { label: 'Gasoline', value: 'gasoline' },
      { label: 'Diesel Fuel', value: 'diesel' },
      { label: 'Seawater', value: 'seawater' },
      { label: 'Wastewater', value: 'wastewater' },
      { label: 'Mixed Chemicals', value: 'mixed_chemicals' }
    ]},
    { id: 'chemical_concentration', type: 'number', title: 'Chemical Concentration (%)', label: 'Chemical Concentration (%)', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8 },
    { id: 'ph_range', type: 'text', title: 'pH Range', label: 'pH Range', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8, placeholder: 'e.g., 1-3, 12-14' },
    { id: 'operating_temperature_f', type: 'number', title: 'Operating Temperature (°F)', label: 'Operating Temperature (°F)', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8 },
    { id: 'temperature_cycling', type: 'select', title: 'Temperature Cycling', label: 'Temperature Cycling', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8, options: [
      { label: 'Constant Temperature', value: 'constant' },
      { label: 'Moderate Cycling', value: 'moderate' },
      { label: 'Severe Cycling', value: 'severe' }
    ]},
    { id: 'immersion_type', type: 'select', title: 'Immersion Type', label: 'Immersion Type', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8, options: [
      { label: 'Full Immersion', value: 'full_immersion' },
      { label: 'Splash/Spill', value: 'splash_spill' },
      { label: 'Vapor Exposure', value: 'vapor' },
      { label: 'Atmospheric', value: 'atmospheric' }
    ]},
    { id: 'abrasion_resistance_required', type: 'select', title: 'Abrasion Resistance', label: 'Abrasion Resistance', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8, options: [
      { label: 'Not Required', value: 'none' },
      { label: 'Light Abrasion', value: 'light' },
      { label: 'Moderate Abrasion', value: 'moderate' },
      { label: 'Heavy Abrasion', value: 'heavy' }
    ]},
    { id: 'microbiological_resistance', type: 'select', title: 'Microbiological Resistance', label: 'Microbiological Resistance', sectionId: 'project-section', groupId: 'chemical-exposure', size: 8, options: [
      { label: 'Not Required', value: 'none' },
      { label: 'Standard MIC Protection', value: 'standard' },
      { label: 'Enhanced MIC Protection', value: 'enhanced' }
    ]},

    // Coating system selection
    { id: 'coating-system', type: 'group', title: 'Coating System Selection', description: 'Coating type and system specifications', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'coating_system_type', type: 'select', title: 'Coating System Type', label: 'Coating System Type', sectionId: 'project-section', groupId: 'coating-system', size: 8, options: [
      { label: 'Plural Component Tank Lining', value: 'plural_component' },
      { label: 'Flake-Filled Interior Lining', value: 'flake_filled' },
      { label: 'Vinyl Ester Lining', value: 'vinyl_ester' },
      { label: 'Force Cured Lining', value: 'force_cured' },
      { label: 'FRP Lining System', value: 'frp_lining' },
      { label: 'Zinc-Epoxy-Urethane', value: 'zinc_epoxy_urethane' },
      { label: 'Polysiloxane System', value: 'polysiloxane' }
    ]},
    { id: 'manufacturer', type: 'select', title: 'Manufacturer', label: 'Manufacturer', sectionId: 'project-section', groupId: 'coating-system', size: 8, options: [
      { label: 'Carboline', value: 'carboline' },
      { label: 'Sherwin-Williams', value: 'sherwin_williams' },
      { label: 'PPG', value: 'ppg' },
      { label: 'Jotun', value: 'jotun' },
      { label: 'Hempel', value: 'hempel' },
      { label: 'International Paint', value: 'international' },
      { label: 'Other', value: 'other' }
    ]},
    { id: 'product_name', type: 'text', title: 'Product Name', label: 'Product Name', sectionId: 'project-section', groupId: 'coating-system', size: 8, placeholder: 'e.g., Carboline 890, Plasite 4550' },
    { id: 'total_dft_mils', type: 'number', title: 'Total DFT (mils)', label: 'Total DFT (mils)', sectionId: 'project-section', groupId: 'coating-system', size: 8 },
    { id: 'number_of_coats', type: 'number', title: 'Number of Coats', label: 'Number of Coats', sectionId: 'project-section', groupId: 'coating-system', size: 8 },
    { id: 'theoretical_coverage', type: 'number', title: 'Theoretical Coverage (sq ft/gal)', label: 'Theoretical Coverage (sq ft/gal)', sectionId: 'project-section', groupId: 'coating-system', size: 8 },
    { id: 'solids_by_volume', type: 'number', title: 'Solids by Volume (%)', label: 'Solids by Volume (%)', sectionId: 'project-section', groupId: 'coating-system', size: 8 },

    // Surface preparation
    { id: 'surface-prep', type: 'group', title: 'Surface Preparation', description: 'Surface preparation requirements and specifications', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'surface_prep_standard', type: 'select', title: 'Surface Prep Standard', label: 'Surface Prep Standard', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'SSPC-SP 5 (White Metal)', value: 'sspc_sp5' },
      { label: 'SSPC-SP 10 (Near-White)', value: 'sspc_sp10' },
      { label: 'SSPC-SP 6 (Commercial)', value: 'sspc_sp6' },
      { label: 'SSPC-SP 11 (Power Tool)', value: 'sspc_sp11' },
      { label: 'NACE No. 2 (Near-White)', value: 'nace_2' },
      { label: 'NACE No. 3 (Commercial)', value: 'nace_3' }
    ]},
    { id: 'surface_profile_mils', type: 'select', title: 'Surface Profile (mils)', label: 'Surface Profile (mils)', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: '1.5-3.0 mils', value: '1.5_3.0' },
      { label: '2.0-4.0 mils', value: '2.0_4.0' },
      { label: '3.0-5.0 mils', value: '3.0_5.0' },
      { label: '4.0-6.0 mils', value: '4.0_6.0' }
    ]},
    { id: 'containment_required', type: 'select', title: 'Containment Required', label: 'Containment Required', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'No Containment', value: 'none' },
      { label: 'Partial Containment', value: 'partial' },
      { label: 'Full Containment', value: 'full' },
      { label: 'Negative Pressure', value: 'negative_pressure' }
    ]},
    { id: 'abrasive_type', type: 'select', title: 'Abrasive Type', label: 'Abrasive Type', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'Garnet', value: 'garnet' },
      { label: 'Steel Grit', value: 'steel_grit' },
      { label: 'Copper Slag', value: 'copper_slag' },
      { label: 'Glass Bead', value: 'glass_bead' },
      { label: 'Aluminum Oxide', value: 'aluminum_oxide' }
    ]},
    { id: 'surface_prep_cost_per_sqft', type: 'number', title: 'Surface Prep Cost ($/sq ft)', label: 'Surface Prep Cost ($/sq ft)', sectionId: 'project-section', groupId: 'surface-prep', size: 8, defaultValue: 4.50 },

    // Application conditions
    { id: 'application-conditions', type: 'group', title: 'Application Conditions', description: 'Environmental and application parameters', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'application_method', type: 'select', title: 'Application Method', label: 'Application Method', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Airless Spray', value: 'airless_spray' },
      { label: 'Plural Component Spray', value: 'plural_spray' },
      { label: 'Brush/Roller', value: 'brush_roller' },
      { label: 'Trowel Application', value: 'trowel' },
      { label: 'FRP Layup', value: 'frp_layup' }
    ]},
    { id: 'application_temperature_f', type: 'number', title: 'Application Temperature (°F)', label: 'Application Temperature (°F)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 75 },
    { id: 'relative_humidity_percent', type: 'number', title: 'Relative Humidity (%)', label: 'Relative Humidity (%)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 50 },
    { id: 'ventilation_required', type: 'select', title: 'Ventilation Required', label: 'Ventilation Required', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Natural Ventilation', value: 'natural' },
      { label: 'Mechanical Ventilation', value: 'mechanical' },
      { label: 'Forced Air', value: 'forced_air' },
      { label: 'Explosion-Proof', value: 'explosion_proof' }
    ]},
    { id: 'cure_method', type: 'select', title: 'Cure Method', label: 'Cure Method', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Ambient Cure', value: 'ambient' },
      { label: 'Heat Cure', value: 'heat_cure' },
      { label: 'Force Cure', value: 'force_cure' },
      { label: 'UV Cure', value: 'uv_cure' }
    ]},
    { id: 'cure_time_hours', type: 'number', title: 'Cure Time (hours)', label: 'Cure Time (hours)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 24 },
    { id: 'recoat_window_hours', type: 'number', title: 'Recoat Window (hours)', label: 'Recoat Window (hours)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, defaultValue: 72 },

    // Quality control and testing
    { id: 'quality-control', type: 'group', title: 'Quality Control & Testing', description: 'Inspection and testing requirements', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'dft_testing_frequency', type: 'select', title: 'DFT Testing Frequency', label: 'DFT Testing Frequency', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: '1 per 100 sq ft', value: '100_sqft' },
      { label: '1 per 50 sq ft', value: '50_sqft' },
      { label: '1 per 25 sq ft', value: '25_sqft' },
      { label: 'Grid Pattern', value: 'grid_pattern' }
    ]},
    { id: 'holiday_testing', type: 'select', title: 'Holiday Testing', label: 'Holiday Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Low Voltage (90V)', value: 'low_voltage' },
      { label: 'High Voltage', value: 'high_voltage' },
      { label: 'Wet Sponge', value: 'wet_sponge' },
      { label: 'No Testing', value: 'none' }
    ]},
    { id: 'adhesion_testing', type: 'select', title: 'Adhesion Testing', label: 'Adhesion Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Pull-off Test (ASTM D4541)', value: 'pull_off' },
      { label: 'Cross-cut Test (ASTM D3359)', value: 'cross_cut' },
      { label: 'Both Methods', value: 'both' },
      { label: 'No Testing', value: 'none' }
    ]},
    { id: 'chemical_resistance_testing', type: 'select', title: 'Chemical Resistance Testing', label: 'Chemical Resistance Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'NACE TM0174', value: 'nace_tm0174' },
      { label: 'ASTM D1308', value: 'astm_d1308' },
      { label: 'Custom Test Protocol', value: 'custom' },
      { label: 'No Testing', value: 'none' }
    ]},

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Material and labor cost assumptions', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'coating_cost_per_gallon', type: 'number', title: 'Coating Cost ($/gallon)', label: 'Coating Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 165 },
    { id: 'application_rate_sqft_per_hour', type: 'number', title: 'Application Rate (sq ft/hour)', label: 'Application Rate (sq ft/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 35 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 85 },
    { id: 'equipment_cost_per_day', type: 'number', title: 'Equipment Cost ($/day)', label: 'Equipment Cost ($/day)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 450 },
    { id: 'waste_factor_percent', type: 'number', title: 'Waste Factor (%)', label: 'Waste Factor (%)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 12 },
    { id: 'testing_cost_per_sqft', type: 'number', title: 'Testing Cost ($/sq ft)', label: 'Testing Cost ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 0.75 },

    // Pricing and profitability
    { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'material_markup_percent', type: 'number', title: 'Material Markup (%)', label: 'Material Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 25 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 35 },
    { id: 'equipment_markup_percent', type: 'number', title: 'Equipment Markup (%)', label: 'Equipment Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 20 },
    { id: 'subcontractor_markup_percent', type: 'number', title: 'Subcontractor Markup (%)', label: 'Subcontractor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 15 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 18 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 15 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 8 },
    { id: 'bond_insurance_percent', type: 'number', title: 'Bond & Insurance (%)', label: 'Bond & Insurance (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 3 },

    // Competitive pricing
    { id: 'competitive-pricing', type: 'group', title: 'Competitive Pricing', description: 'Market positioning and discount strategies', sectionId: 'project-section', order: 10, size: 24, collapsible: true },
    { id: 'market_position', type: 'select', title: 'Market Position', label: 'Market Position', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, options: [
      { label: 'Premium Pricing', value: 'premium' },
      { label: 'Market Rate', value: 'market' },
      { label: 'Competitive', value: 'competitive' },
      { label: 'Aggressive', value: 'aggressive' }
    ]},
    { id: 'volume_discount_percent', type: 'number', title: 'Volume Discount (%)', label: 'Volume Discount (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 0 },
    { id: 'early_payment_discount_percent', type: 'number', title: 'Early Discount (%)', label: 'Early Discount (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 2 },
    { id: 'repeat_customer_discount_percent', type: 'number', title: 'Customer Discount (%)', label: 'Customer Discount (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 0 },
    { id: 'competitive_adjustment_percent', type: 'number', title: 'Competitive Adjustment (%)', label: 'Competitive Adjustment (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 0, placeholder: 'Positive for premium, negative for discount' },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Minimum  Margin (%)', label: 'Minimum Margin (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 12 }
  ],
  aiPrompt: `
You are an **industrial coatings estimation expert**.  
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
   - Material Takeoff (MTO) *(table)*  
   - Labor & Equipment Estimate *(table with crew composition, hours, productivity)*  
   - Cost Breakdown *(table with line items, subtotals, totals)*  
   - Schedule & Phasing  
   - Risk & Uncertainty Analysis  
   - Exclusions & Clarifications  
   

2. **Formatting Rules**  
   - Use **Markdown headings** for sections  
   - Use **tables** for numeric breakdowns (MTO, Labor, Cost)  
   - Show **formulas explicitly** (e.g., *Gallons Required = Total Surface Area ÷ Coverage × Waste Factor*)  
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

   - **Material Quantities**  
     - Gallons = (Total Surface Area ÷ Theoretical Coverage) × (1 + Waste Factor%)  
     - Adjust for Number of Coats and Solids by Volume 

   - **Labor Hours**  
     - Labor Hours = (Total Surface Area ÷ Application Rate) × Number of Coats  
     - Labor Cost = Labor Hours × Labor Rate 

   - **Equipment**  
     - Days = Labor Hours ÷ (Crew Hours/Day) 
     - Equipment Cost = Days × Equipment Cost per Day 

   - **Testing & QA**  
     - Testing Cost = Testing Rate × Total Surface Area  

   - **Total Cost**  
     - Direct Costs = Materials + Labor + Equipment + Testing + Surface Prep  
     - Apply markups: **Material, Labor, Equipment, Subcontractor**  
     - Add **Overhead, Profit Margin, Contingency, Bond & Insurance**  
     - Apply **Discounts/Adjustments** if provided  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Material Takeoff (MTO)**  
   
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | Tank Lining Material | gal | 145.67 | Area ÷ Coverage × Coats × 1.12 | 12% waste factor |
   
   **Labor & Equipment Estimate**  
   
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | Surface Preparation | 25 sq ft/hr | 240 | $85/hr | $20,400 | SSPC-SP 10 blast |
   
   **Cost Breakdown**  
   
   | Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | Coating Materials | $165/gal | 145.67 | $24,036 | Specialty tank lining |
   
   Include **subtotals** and **grand total** with proper formatting.  

5. **Contextual Rationale**  
   - Explain why the chosen **Surface Prep Standard** impacts cost  
   - Note how **Application Location** (shop/field) affects logistics  
   - Justify the **Application Method** (e.g., plural spray) and **Cure Method**  
   - Explain how **Waste Factor, Temperature, Humidity, and Cure Time** influence the estimate  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  `
};


