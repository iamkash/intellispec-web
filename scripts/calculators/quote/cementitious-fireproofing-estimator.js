module.exports = {
  id: 'cementitious-fireproofing-estimator',
  name: 'Cementitious Fireproofing Estimator',
  description: 'Spray-applied cementitious fireproofing estimation with mechanical attachment systems for structural steel protection',
  category: 'Fireproofing',
  module: 'quote',
  icon: 'BuildOutlined',
  tags: ['cementitious', 'mechanical', 'attachment', 'fireproofing', 'sfrm', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Cementitious Fireproofing Specification', description: 'Spray-applied cementitious fireproofing system requirements', icon: 'BuildOutlined', order: 1, size: 24 },

    // Project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Project identification and scope details', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'project_location', type: 'text', title: 'Project Location', label: 'Project Location', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'City, State' },
    { id: 'client_name', type: 'text', title: 'Client Name', label: 'Client Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Client organization' },
    { id: 'project_type', type: 'select', title: 'Project Type', label: 'Project Type', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'New Construction', value: 'new_construction' },
      { label: 'Retrofit', value: 'retrofit' },
      { label: 'Maintenance/Repair', value: 'maintenance' },
      { label: 'Upgrade', value: 'upgrade' },
      { label: 'Turnaround', value: 'turnaround' }
    ]},
    { id: 'application_location', type: 'select', title: 'Application Location', label: 'Application Location', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Shop Applied', value: 'shop' },
      { label: 'Field Applied', value: 'field' },
      { label: 'Combination', value: 'combination' }
    ]},
    { id: 'industry_sector', type: 'select', title: 'Industry Sector', label: 'Industry Sector', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Petroleum Refining', value: 'petroleum' },
      { label: 'Petrochemical', value: 'petrochemical' },
      { label: 'Chemical Processing', value: 'chemical' },
      { label: 'Power Generation', value: 'power' },
      { label: 'Commercial Building', value: 'commercial' },
      { label: 'Industrial Facility', value: 'industrial' }
    ]},

    // Steel structure details
    { id: 'steel-structure', type: 'group', title: 'Steel Structure Details', description: 'Steel member specifications and geometry', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'steel_member_type', type: 'select', title: 'Steel Member Type', label: 'Steel Member Type', sectionId: 'project-section', groupId: 'steel-structure', size: 8, options: [
      { label: 'Wide Flange Beams', value: 'wide_flange' },
      { label: 'Columns', value: 'columns' },
      { label: 'Hollow Structural Sections', value: 'hss' },
      { label: 'Angles', value: 'angles' },
      { label: 'Channels', value: 'channels' },
      { label: 'Trusses', value: 'trusses' }
    ]},
    { id: 'steel_section_designation', type: 'text', title: 'Section Designation', label: 'Section Designation', sectionId: 'project-section', groupId: 'steel-structure', size: 8, placeholder: 'e.g., W18x35, HSS12x12x1/2' },
    { id: 'steel_grade', type: 'select', title: 'Steel Grade', label: 'Steel Grade', sectionId: 'project-section', groupId: 'steel-structure', size: 8, options: [
      { label: 'A36', value: 'a36' },
      { label: 'A572 Grade 50', value: 'a572_50' },
      { label: 'A992', value: 'a992' },
      { label: 'A500 Grade B', value: 'a500_b' }
    ]},
    { id: 'total_linear_feet', type: 'number', title: 'Total Linear Feet', label: 'Total Linear Feet', sectionId: 'project-section', groupId: 'steel-structure', size: 8 },
    { id: 'perimeter_inches', type: 'number', title: 'Perimeter (inches)', label: 'Perimeter (inches)', sectionId: 'project-section', groupId: 'steel-structure', size: 8, placeholder: 'Total perimeter of section' },
    { id: 'web_depth_inches', type: 'number', title: 'Web Depth (inches)', label: 'Web Depth (inches)', sectionId: 'project-section', groupId: 'steel-structure', size: 8 },

    // Fire protection requirements
    { id: 'fire-requirements', type: 'group', title: 'Fire Protection Requirements', description: 'Fire rating and protection specifications', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'fire_rating_hours', type: 'select', title: 'Fire Rating (hours)', label: 'Fire Rating (hours)', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, options: [
      { label: '1 Hour', value: '1' },
      { label: '2 Hours', value: '2' },
      { label: '3 Hours', value: '3' },
      { label: '4 Hours', value: '4' }
    ]},
    { id: 'fire_test_standard', type: 'select', title: 'Fire Test Standard', label: 'Fire Test Standard', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, options: [
      { label: 'ASTM E119 (Cellulosic)', value: 'astm_e119' },
      { label: 'UL 1709 (Hydrocarbon)', value: 'ul_1709' },
      { label: 'BS 476 (British)', value: 'bs_476' },
      { label: 'ISO 834 (International)', value: 'iso_834' }
    ]},
    { id: 'restrained_unrestrained', type: 'select', title: 'Restraint Condition', label: 'Restraint Condition', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, options: [
      { label: 'Restrained', value: 'restrained' },
      { label: 'Unrestrained', value: 'unrestrained' }
    ]},
    { id: 'load_bearing', type: 'select', title: 'Load Bearing', label: 'Load Bearing', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ]},
    { id: 'w_d_ratio', type: 'number', title: 'W/D Ratio', label: 'W/D Ratio', sectionId: 'project-section', groupId: 'fire-requirements', size: 8, placeholder: 'Weight/Perimeter ratio' },
    { id: 'required_thickness_inches', type: 'number', title: 'Required Thickness (inches)', label: 'Required Thickness (inches)', sectionId: 'project-section', groupId: 'fire-requirements', size: 8 },

    // Cementitious material specifications
    { id: 'material-specs', type: 'group', title: 'Cementitious Material Specifications', description: 'Material type and properties', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'cementitious_type', type: 'select', title: 'Cementitious Type', label: 'Cementitious Type', sectionId: 'project-section', groupId: 'material-specs', size: 8, options: [
      { label: 'Spray-Applied (SFRM)', value: 'spray_applied' },
      { label: 'Trowel-Applied', value: 'trowel_applied' },
      { label: 'Board System', value: 'board_system' },
      { label: 'Precast Concrete', value: 'precast_concrete' }
    ]},
    { id: 'material_manufacturer', type: 'select', title: 'Manufacturer', label: 'Manufacturer', sectionId: 'project-section', groupId: 'material-specs', size: 8, options: [
      { label: 'Grace Construction (Monokote)', value: 'grace_monokote' },
      { label: 'Carboline (Pyrocrete)', value: 'carboline_pyrocrete' },
      { label: 'Isolatek (Cafco)', value: 'isolatek_cafco' },
      { label: 'PPG (Pitt-Char)', value: 'ppg_pittchar' },
      { label: 'Other', value: 'other' }
    ]},
    { id: 'product_name', type: 'text', title: 'Product Name', label: 'Product Name', sectionId: 'project-section', groupId: 'material-specs', size: 8, placeholder: 'e.g., Monokote Z-106' },
    { id: 'density_pcf', type: 'number', title: 'Density (pcf)', label: 'Density (pcf)', sectionId: 'project-section', groupId: 'material-specs', size: 8, defaultValue: 15 },
    { id: 'compressive_strength_psi', type: 'number', title: 'Compressive Strength (psi)', label: 'Compressive Strength (psi)', sectionId: 'project-section', groupId: 'material-specs', size: 8, defaultValue: 350 },
    { id: 'bond_strength_psi', type: 'number', title: 'Bond Strength (psi)', label: 'Bond Strength (psi)', sectionId: 'project-section', groupId: 'material-specs', size: 8, defaultValue: 150 },

    // Mechanical attachment system
    { id: 'attachment-system', type: 'group', title: 'Mechanical Attachment System', description: 'Metal lath and fastener specifications', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'attachment_method', type: 'select', title: 'Attachment Method', label: 'Attachment Method', sectionId: 'project-section', groupId: 'attachment-system', size: 8, options: [
      { label: 'Welded Wire Lath', value: 'welded_wire' },
      { label: 'Expanded Metal Lath', value: 'expanded_metal' },
      { label: 'Woven Wire Lath', value: 'woven_wire' },
      { label: 'Self-Furring Lath', value: 'self_furring' }
    ]},
    { id: 'lath_gauge', type: 'select', title: 'Lath Gauge', label: 'Lath Gauge', sectionId: 'project-section', groupId: 'attachment-system', size: 8, options: [
      { label: '16 Gauge', value: '16_gauge' },
      { label: '18 Gauge', value: '18_gauge' },
      { label: '20 Gauge', value: '20_gauge' },
      { label: '22 Gauge', value: '22_gauge' }
    ]},
    { id: 'lath_mesh_size', type: 'select', title: 'Mesh Size', label: 'Mesh Size', sectionId: 'project-section', groupId: 'attachment-system', size: 8, options: [
      { label: '1" x 1"', value: '1x1' },
      { label: '2" x 2"', value: '2x2' },
      { label: '3" x 3"', value: '3x3' },
      { label: '4" x 4"', value: '4x4' }
    ]},
    { id: 'fastener_type', type: 'select', title: 'Fastener Type', label: 'Fastener Type', sectionId: 'project-section', groupId: 'attachment-system', size: 8, options: [
      { label: 'Powder-Actuated Pins', value: 'powder_actuated' },
      { label: 'Self-Drilling Screws', value: 'self_drilling' },
      { label: 'Welded Studs', value: 'welded_studs' },
      { label: 'Adhesive Anchors', value: 'adhesive_anchors' }
    ]},
    { id: 'fastener_spacing_inches', type: 'number', title: 'Fastener Spacing (inches)', label: 'Fastener Spacing (inches)', sectionId: 'project-section', groupId: 'attachment-system', size: 8, defaultValue: 12 },
    { id: 'fastener_length_inches', type: 'number', title: 'Fastener Length (inches)', label: 'Fastener Length (inches)', sectionId: 'project-section', groupId: 'attachment-system', size: 8, defaultValue: 2.5 },

    // Surface preparation requirements
    { id: 'surface-prep', type: 'group', title: 'Surface Preparation Requirements', description: 'Steel surface preparation specifications', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'surface_prep_level', type: 'select', title: 'Surface Prep Level', label: 'Surface Prep Level', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'Minimal (Wire Brush)', value: 'minimal' },
      { label: 'SSPC-SP 2 (Hand Tool)', value: 'sspc_sp2' },
      { label: 'SSPC-SP 3 (Power Tool)', value: 'sspc_sp3' },
      { label: 'SSPC-SP 6 (Commercial Blast)', value: 'sspc_sp6' }
    ]},
    { id: 'primer_required', type: 'select', title: 'Primer Required', label: 'Primer Required', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'No Primer', value: 'none' },
      { label: 'Shop Primer', value: 'shop_primer' },
      { label: 'Zinc-Rich Primer', value: 'zinc_primer' },
      { label: 'Epoxy Primer', value: 'epoxy_primer' }
    ]},
    { id: 'surface_contamination', type: 'select', title: 'Surface Contamination', label: 'Surface Contamination', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'Clean Steel', value: 'clean' },
      { label: 'Oil/Grease Present', value: 'oil_grease' },
      { label: 'Heavy Mill Scale', value: 'mill_scale' },
      { label: 'Previous Coating', value: 'previous_coating' }
    ]},

    // Application conditions
    { id: 'application-conditions', type: 'group', title: 'Application Conditions', description: 'Environmental and access factors', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'application_method', type: 'select', title: 'Application Method', label: 'Application Method', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Spray Application', value: 'spray' },
      { label: 'Trowel Application', value: 'trowel' },
      { label: 'Pneumatic Placement', value: 'pneumatic' },
      { label: 'Hand Application', value: 'hand' }
    ]},
    { id: 'access_difficulty', type: 'select', title: 'Access Difficulty', label: 'Access Difficulty', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Easy Access', value: 'easy' },
      { label: 'Moderate Access', value: 'moderate' },
      { label: 'Difficult Access', value: 'difficult' },
      { label: 'Very Difficult', value: 'very_difficult' }
    ]},
    { id: 'working_height', type: 'select', title: 'Working Height', label: 'Working Height', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Ground Level', value: 'ground' },
      { label: 'Low (< 20 ft)', value: 'low' },
      { label: 'Medium (20-50 ft)', value: 'medium' },
      { label: 'High (> 50 ft)', value: 'high' }
    ]},
    { id: 'environmental_conditions', type: 'select', title: 'Environmental Conditions', label: 'Environmental Conditions', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Indoor/Controlled', value: 'indoor' },
      { label: 'Outdoor/Sheltered', value: 'outdoor_sheltered' },
      { label: 'Outdoor/Exposed', value: 'outdoor_exposed' },
      { label: 'Marine Environment', value: 'marine' }
    ]},
    { id: 'temperature_range', type: 'text', title: 'Temperature Range (°F)', label: 'Temperature Range (°F)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, placeholder: 'e.g., 40-90°F' },
    { id: 'humidity_range', type: 'text', title: 'Humidity Range (%)', label: 'Humidity Range (%)', sectionId: 'project-section', groupId: 'application-conditions', size: 8, placeholder: 'e.g., 30-80%' },

    // Quality control and testing
    { id: 'quality-control', type: 'group', title: 'Quality Control & Testing', description: 'Inspection and testing requirements', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'thickness_testing', type: 'select', title: 'Thickness Testing', label: 'Thickness Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Core Sampling', value: 'core_sampling' },
      { label: 'Probe Testing', value: 'probe_testing' },
      { label: 'Ultrasonic Testing', value: 'ultrasonic' },
      { label: 'Visual Inspection Only', value: 'visual_only' }
    ]},
    { id: 'bond_testing', type: 'select', title: 'Bond Testing', label: 'Bond Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Pull-off Test', value: 'pull_off' },
      { label: 'Tap Test', value: 'tap_test' },
      { label: 'Visual Inspection', value: 'visual' },
      { label: 'No Testing', value: 'none' }
    ]},
    { id: 'density_testing', type: 'select', title: 'Density Testing', label: 'Density Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Core Sampling', value: 'core_sampling' },
      { label: 'In-situ Testing', value: 'in_situ' },
      { label: 'No Testing', value: 'none' }
    ]},

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Material and labor cost assumptions', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'material_cost_per_bag', type: 'number', title: 'Material Cost ($/bag)', label: 'Material Cost ($/bag)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 28 },
    { id: 'lath_cost_per_sqft', type: 'number', title: 'Lath Cost ($/sq ft)', label: 'Lath Cost ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 1.25 },
    { id: 'fastener_cost_each', type: 'number', title: 'Fastener Cost ($/each)', label: 'Fastener Cost ($/each)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 0.35 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 68 },
    { id: 'productivity_sqft_per_hour', type: 'number', title: 'Productivity (sq ft/hour)', label: 'Productivity (sq ft/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 20 },
    { id: 'waste_factor_percent', type: 'number', title: 'Waste Factor (%)', label: 'Waste Factor (%)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 20 },

    // Pricing and profitability
    { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 10, size: 24, collapsible: true },
    { id: 'material_markup_percent', type: 'number', title: 'Material Markup (%)', label: 'Material Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 32 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 42 },
    { id: 'equipment_markup_percent', type: 'number', title: 'Equipment Markup (%)', label: 'Equipment Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 28 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 19 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 16 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 12 },

    // Competitive pricing
    { id: 'competitive-pricing', type: 'group', title: 'Competitive Pricing', description: 'Market positioning and discount strategies', sectionId: 'project-section', order: 11, size: 24, collapsible: true },
    { id: 'market_position', type: 'select', title: 'Market Position', label: 'Market Position', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, options: [
      { label: 'Premium Pricing', value: 'premium' },
      { label: 'Market Rate', value: 'market' },
      { label: 'Competitive', value: 'competitive' },
      { label: 'Aggressive', value: 'aggressive' }
    ]},
    { id: 'volume_discount_percent', type: 'number', title: 'Volume Discount (%)', label: 'Volume Discount (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 0 },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Minimum Acceptable Margin (%)', label: 'Minimum Acceptable Margin (%)', sectionId: 'project-section', groupId: 'competitive-pricing', size: 8, defaultValue: 14 }
  ],
  aiPrompt: `
You are a **cementitious fireproofing estimation expert**.  
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

   - **Material Quantities**  
     - Bags Required = (Surface Area × Thickness × Density) ÷ Coverage per Bag  
     - Metal Lath Area = Surface Area × 1.1 (10% overlap)  
     - Fasteners = Lath Area ÷ Fastener Spacing  

   - **Labor Hours**  
     - Lath Installation = Lath Area ÷ Lath Installation Rate  
     - Spray Application = Surface Area ÷ Application Rate  
     - Total Labor Hours = Installation + Application + Setup/Cleanup  

   - **Equipment**  
     - Days = Total Labor Hours ÷ (Crew Hours/Day)  
     - Equipment Cost = Days × Equipment Cost per Day  

   - **Testing & QA**  
     - Testing Cost = Testing Rate × Surface Area  

   - **Total Cost**  
     - Direct Costs = Materials + Labor + Equipment + Testing + Surface Prep  
     - Apply markups: **Material, Labor, Equipment**  
     - Add **Overhead, Profit Margin, Contingency**  
     - Apply **Discounts/Adjustments** if provided  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Material Takeoff (MTO)**  
   
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | Cementitious Material | bags | 85 | Volume ÷ Coverage × 1.20 | 20% waste factor |
   
   **Labor & Equipment Estimate**  
   
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | Spray Application | 20 sq ft/hr | 300 | $68/hr | $20,400 | SFRM installation |
   
   **Cost Breakdown**  
   
   | Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | Cementitious Materials | $28/bag | 85 | $2,380 | Material costs |
   
   Include **subtotals** and **grand total** with proper formatting.  

5. **Contextual Rationale**  
   - Explain why the chosen **Surface Prep Level** impacts cost  
   - Note how **Application Location** (shop/field) affects logistics  
   - Justify the **Attachment Method** (welded wire, expanded metal) and **Fastener Type**  
   - Explain how **Waste Factor, Access Difficulty, and Working Height** influence the estimate  
   - Address **Fire Rating Requirements** and **Testing Standards**  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  `
};


