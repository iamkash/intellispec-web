module.exports = {
  id: 'marine-coatings-estimator',
  name: 'Marine Coatings Estimator',
  description: 'Marine and offshore coating estimation for vessels, platforms, and marine structures with corrosion protection analysis',
  category: 'Marine Coatings',
  module: 'quote',
  icon: 'GlobalOutlined',
  tags: ['marine', 'offshore', 'corrosion', 'vessels', 'platforms', 'vision'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Marine Coatings Specification', description: 'Marine and offshore coating system requirements', icon: 'GlobalOutlined', order: 1, size: 24 },

    // Project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Project identification and marine environment details', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'project_location', type: 'text', title: 'Project Location', label: 'Project Location', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Port, Country' },
    { id: 'client_name', type: 'text', title: 'Client Name', label: 'Client Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Shipowner/Operator' },
    { id: 'project_type', type: 'select', title: 'Project Type', label: 'Project Type', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'New Construction', value: 'new_construction' },
      { label: 'Drydock Maintenance', value: 'drydock' },
      { label: 'Floating Maintenance', value: 'floating' },
      { label: 'Emergency Repair', value: 'emergency' },
      { label: 'Survey/Certification', value: 'survey' }
    ]},
    { id: 'vessel_classification', type: 'select', title: 'Vessel Classification', label: 'Vessel Classification', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Commercial Vessel', value: 'commercial' },
      { label: 'Naval/Military', value: 'naval' },
      { label: 'Offshore Platform', value: 'platform' },
      { label: 'Yacht/Pleasure Craft', value: 'yacht' },
      { label: 'Workboat/Tug', value: 'workboat' }
    ]},
    { id: 'regulatory_requirements', type: 'select', title: 'Regulatory Requirements', label: 'Regulatory Requirements', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'IMO PSPC', value: 'imo_pspc' },
      { label: 'USCG', value: 'uscg' },
      { label: 'Lloyd\'s Register', value: 'lloyds' },
      { label: 'DNV GL', value: 'dnv' },
      { label: 'ABS', value: 'abs' },
      { label: 'Bureau Veritas', value: 'bv' }
    ]},

    // Vessel/structure specifications
    { id: 'vessel-specs', type: 'group', title: 'Vessel/Structure Specifications', description: 'Vessel type and structural details', sectionId: 'project-section', order: 2, size: 24, collapsible: true },
    { id: 'vessel_type', type: 'select', title: 'Vessel Type', label: 'Vessel Type', sectionId: 'project-section', groupId: 'vessel-specs', size: 8, options: [
      { label: 'Container Ship', value: 'container' },
      { label: 'Bulk Carrier', value: 'bulk_carrier' },
      { label: 'Tanker (Oil/Chemical)', value: 'tanker' },
      { label: 'Cruise Ship', value: 'cruise' },
      { label: 'Offshore Platform', value: 'platform' },
      { label: 'FPSO', value: 'fpso' },
      { label: 'Naval Vessel', value: 'naval' },
      { label: 'Fishing Vessel', value: 'fishing' }
    ]},
    { id: 'vessel_length_ft', type: 'number', title: 'Vessel Length (ft)', label: 'Vessel Length (ft)', sectionId: 'project-section', groupId: 'vessel-specs', size: 8 },
    { id: 'vessel_beam_ft', type: 'number', title: 'Vessel Beam (ft)', label: 'Vessel Beam (ft)', sectionId: 'project-section', groupId: 'vessel-specs', size: 8 },
    { id: 'total_surface_area_sqft', type: 'number', title: 'Total Surface Area (sq ft)', label: 'Total Surface Area (sq ft)', sectionId: 'project-section', groupId: 'vessel-specs', size: 8 },
    { id: 'hull_material', type: 'select', title: 'Hull Material', label: 'Hull Material', sectionId: 'project-section', groupId: 'vessel-specs', size: 8, options: [
      { label: 'Mild Steel', value: 'mild_steel' },
      { label: 'High Tensile Steel', value: 'high_tensile' },
      { label: 'Stainless Steel', value: 'stainless' },
      { label: 'Aluminum', value: 'aluminum' },
      { label: 'Fiberglass/GRP', value: 'fiberglass' }
    ]},
    { id: 'construction_age', type: 'select', title: 'Construction Age', label: 'Construction Age', sectionId: 'project-section', groupId: 'vessel-specs', size: 8, options: [
      { label: 'New Construction', value: 'new' },
      { label: '0-5 years', value: '0_5' },
      { label: '5-10 years', value: '5_10' },
      { label: '10-20 years', value: '10_20' },
      { label: 'Over 20 years', value: 'over_20' }
    ]},

    // Marine environment conditions
    { id: 'marine-environment', type: 'group', title: 'Marine Environment Conditions', description: 'Operating environment and exposure conditions', sectionId: 'project-section', order: 3, size: 24, collapsible: true },
    { id: 'operating_area', type: 'select', title: 'Operating Area', label: 'Operating Area', sectionId: 'project-section', groupId: 'marine-environment', size: 8, options: [
      { label: 'Coastal/Harbor', value: 'coastal' },
      { label: 'Open Ocean', value: 'open_ocean' },
      { label: 'Arctic Waters', value: 'arctic' },
      { label: 'Tropical Waters', value: 'tropical' },
      { label: 'Inland Waterways', value: 'inland' },
      { label: 'Offshore Fields', value: 'offshore' }
    ]},
    { id: 'salinity_level', type: 'select', title: 'Salinity Level', label: 'Salinity Level', sectionId: 'project-section', groupId: 'marine-environment', size: 8, options: [
      { label: 'Fresh Water', value: 'fresh' },
      { label: 'Brackish Water', value: 'brackish' },
      { label: 'Normal Seawater', value: 'normal_seawater' },
      { label: 'High Salinity', value: 'high_salinity' }
    ]},
    { id: 'temperature_range', type: 'select', title: 'Temperature Range', label: 'Temperature Range', sectionId: 'project-section', groupId: 'marine-environment', size: 8, options: [
      { label: 'Arctic (-20°F to 40°F)', value: 'arctic' },
      { label: 'Temperate (40°F to 80°F)', value: 'temperate' },
      { label: 'Tropical (80°F to 110°F)', value: 'tropical' },
      { label: 'Extreme Heat (>110°F)', value: 'extreme_heat' }
    ]},
    { id: 'ice_conditions', type: 'select', title: 'Ice Conditions', label: 'Ice Conditions', sectionId: 'project-section', groupId: 'marine-environment', size: 8, options: [
      { label: 'No Ice', value: 'no_ice' },
      { label: 'Light Ice', value: 'light_ice' },
      { label: 'Heavy Ice', value: 'heavy_ice' },
      { label: 'Icebreaker Service', value: 'icebreaker' }
    ]},
    { id: 'uv_exposure', type: 'select', title: 'UV Exposure', label: 'UV Exposure', sectionId: 'project-section', groupId: 'marine-environment', size: 8, options: [
      { label: 'Low (Northern Latitudes)', value: 'low' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'High (Tropical)', value: 'high' },
      { label: 'Extreme (Desert/Equatorial)', value: 'extreme' }
    ]},
    { id: 'pollution_exposure', type: 'select', title: 'Pollution Exposure', label: 'Pollution Exposure', sectionId: 'project-section', groupId: 'marine-environment', size: 8, options: [
      { label: 'Clean Environment', value: 'clean' },
      { label: 'Industrial Pollution', value: 'industrial' },
      { label: 'Oil/Chemical Exposure', value: 'oil_chemical' },
      { label: 'Heavy Contamination', value: 'heavy_contamination' }
    ]},

    // Coating zones and systems
    { id: 'coating-zones', type: 'group', title: 'Coating Zones & Systems', description: 'Coating system specifications by zone', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'underwater_hull_system', type: 'select', title: 'Underwater Hull System', label: 'Underwater Hull System', sectionId: 'project-section', groupId: 'coating-zones', size: 8, options: [
      { label: 'Antifouling + Primer', value: 'antifouling_primer' },
      { label: 'Self-Polishing Copolymer', value: 'spc' },
      { label: 'Copper-Free Antifouling', value: 'copper_free' },
      { label: 'Foul Release Coating', value: 'foul_release' },
      { label: 'Hard Antifouling', value: 'hard_antifouling' }
    ]},
    { id: 'boot_topping_system', type: 'select', title: 'Boot Topping System', label: 'Boot Topping System', sectionId: 'project-section', groupId: 'coating-zones', size: 8, options: [
      { label: 'Epoxy Boot Topping', value: 'epoxy_boot' },
      { label: 'Vinyl Boot Topping', value: 'vinyl_boot' },
      { label: 'Polyurethane Boot', value: 'polyurethane_boot' },
      { label: 'Antifouling Extension', value: 'antifouling_ext' }
    ]},
    { id: 'topsides_system', type: 'select', title: 'Topsides System', label: 'Topsides System', sectionId: 'project-section', groupId: 'coating-zones', size: 8, options: [
      { label: 'Epoxy-Polyurethane', value: 'epoxy_polyurethane' },
      { label: 'Acrylic Polyurethane', value: 'acrylic_polyurethane' },
      { label: 'Fluoropolymer', value: 'fluoropolymer' },
      { label: 'Silicone Alkyd', value: 'silicone_alkyd' }
    ]},
    { id: 'superstructure_system', type: 'select', title: 'Superstructure System', label: 'Superstructure System', sectionId: 'project-section', groupId: 'coating-zones', size: 8, options: [
      { label: 'Polyurethane Finish', value: 'polyurethane' },
      { label: 'Acrylic Finish', value: 'acrylic' },
      { label: 'Fluoropolymer Premium', value: 'fluoropolymer_premium' },
      { label: 'Siloxane Finish', value: 'siloxane' }
    ]},
    { id: 'deck_system', type: 'select', title: 'Deck System', label: 'Deck System', sectionId: 'project-section', groupId: 'coating-zones', size: 8, options: [
      { label: 'Non-Slip Deck Coating', value: 'non_slip' },
      { label: 'Epoxy Deck System', value: 'epoxy_deck' },
      { label: 'Polyurethane Deck', value: 'polyurethane_deck' },
      { label: 'Rubber Deck Covering', value: 'rubber_deck' }
    ]},
    { id: 'tank_coating_system', type: 'select', title: 'Tank Coating System', label: 'Tank Coating System', sectionId: 'project-section', groupId: 'coating-zones', size: 8, options: [
      { label: 'Pure Epoxy Tank Lining', value: 'pure_epoxy' },
      { label: 'Zinc Epoxy System', value: 'zinc_epoxy' },
      { label: 'Phenolic Epoxy', value: 'phenolic_epoxy' },
      { label: 'Inorganic Zinc Silicate', value: 'inorganic_zinc' },
      { label: 'No Tank Coating', value: 'none' }
    ]},

    // Surface preparation requirements
    { id: 'surface-prep', type: 'group', title: 'Surface Preparation Requirements', description: 'Surface preparation specifications by zone', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'hull_surface_prep', type: 'select', title: 'Hull Surface Prep', label: 'Hull Surface Prep', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'SSPC-SP 10 (Near-White)', value: 'sspc_sp10' },
      { label: 'SSPC-SP 6 (Commercial)', value: 'sspc_sp6' },
      { label: 'SSPC-SP 11 (Power Tool)', value: 'sspc_sp11' },
      { label: 'Water Jetting WJ-2', value: 'wj2' },
      { label: 'UHP Water Jetting WJ-1', value: 'wj1' }
    ]},
    { id: 'topsides_surface_prep', type: 'select', title: 'Topsides Surface Prep', label: 'Topsides Surface Prep', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'SSPC-SP 10 (Near-White)', value: 'sspc_sp10' },
      { label: 'SSPC-SP 6 (Commercial)', value: 'sspc_sp6' },
      { label: 'SSPC-SP 3 (Power Tool)', value: 'sspc_sp3' },
      { label: 'Sweep Blasting', value: 'sweep_blast' }
    ]},
    { id: 'containment_requirements', type: 'select', title: 'Containment Requirements', label: 'Containment Requirements', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'No Containment', value: 'none' },
      { label: 'Partial Containment', value: 'partial' },
      { label: 'Full Containment', value: 'full' },
      { label: 'Negative Pressure', value: 'negative_pressure' }
    ]},
    { id: 'environmental_compliance', type: 'select', title: 'Environmental Compliance', label: 'Environmental Compliance', sectionId: 'project-section', groupId: 'surface-prep', size: 8, options: [
      { label: 'Standard Compliance', value: 'standard' },
      { label: 'Enhanced Environmental', value: 'enhanced' },
      { label: 'Zero Discharge', value: 'zero_discharge' },
      { label: 'Enclosed Facility Only', value: 'enclosed_only' }
    ]},

    // Application conditions
    { id: 'application-conditions', type: 'group', title: 'Application Conditions', description: 'Environmental and application parameters', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'application_location', type: 'select', title: 'Application Location', label: 'Application Location', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Drydock', value: 'drydock' },
      { label: 'Shipyard Hall', value: 'shipyard_hall' },
      { label: 'Floating Dock', value: 'floating_dock' },
      { label: 'Alongside Pier', value: 'alongside' },
      { label: 'Offshore Platform', value: 'offshore' }
    ]},
    { id: 'weather_conditions', type: 'select', title: 'Weather Conditions', label: 'Weather Conditions', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Controlled Environment', value: 'controlled' },
      { label: 'Fair Weather Only', value: 'fair_weather' },
      { label: 'Variable Conditions', value: 'variable' },
      { label: 'Adverse Conditions', value: 'adverse' }
    ]},
    { id: 'access_difficulty', type: 'select', title: 'Access Difficulty', label: 'Access Difficulty', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'Easy Access', value: 'easy' },
      { label: 'Moderate Access', value: 'moderate' },
      { label: 'Difficult Access', value: 'difficult' },
      { label: 'Confined Spaces', value: 'confined' }
    ]},
    { id: 'tidal_considerations', type: 'select', title: 'Tidal Considerations', label: 'Tidal Considerations', sectionId: 'project-section', groupId: 'application-conditions', size: 8, options: [
      { label: 'No Tidal Impact', value: 'none' },
      { label: 'Moderate Tidal Range', value: 'moderate' },
      { label: 'High Tidal Range', value: 'high' },
      { label: 'Extreme Tidal Range', value: 'extreme' }
    ]},

    // Quality control and inspection
    { id: 'quality-control', type: 'group', title: 'Quality Control & Inspection', description: 'Inspection and testing requirements', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'coating_inspection_level', type: 'select', title: 'Coating Inspection Level', label: 'Coating Inspection Level', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Basic Inspection', value: 'basic' },
      { label: 'Standard NACE/SSPC', value: 'standard' },
      { label: 'Enhanced Inspection', value: 'enhanced' },
      { label: 'Class Survey Level', value: 'class_survey' }
    ]},
    { id: 'dft_measurement_frequency', type: 'select', title: 'DFT Measurement Frequency', label: 'DFT Measurement Frequency', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: '1 per 100 sq ft', value: '100_sqft' },
      { label: '1 per 50 sq ft', value: '50_sqft' },
      { label: '1 per 25 sq ft', value: '25_sqft' },
      { label: 'Continuous Monitoring', value: 'continuous' }
    ]},
    { id: 'holiday_detection', type: 'select', title: 'Holiday Detection', label: 'Holiday Detection', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Low Voltage Spark Test', value: 'low_voltage' },
      { label: 'High Voltage Holiday', value: 'high_voltage' },
      { label: 'Wet Sponge Test', value: 'wet_sponge' },
      { label: 'No Holiday Testing', value: 'none' }
    ]},
    { id: 'adhesion_testing', type: 'select', title: 'Adhesion Testing', label: 'Adhesion Testing', sectionId: 'project-section', groupId: 'quality-control', size: 8, options: [
      { label: 'Pull-off Test (ASTM D4541)', value: 'pull_off' },
      { label: 'Cross-cut Test (ASTM D3359)', value: 'cross_cut' },
      { label: 'Knife Test', value: 'knife_test' },
      { label: 'No Adhesion Testing', value: 'none' }
    ]},

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Material and labor cost assumptions', sectionId: 'project-section', order: 8, size: 24, collapsible: true },
    { id: 'primer_cost_per_gallon', type: 'number', title: 'Primer Cost ($/gallon)', label: 'Primer Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 85 },
    { id: 'intermediate_cost_per_gallon', type: 'number', title: 'Intermediate Cost ($/gallon)', label: 'Intermediate Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 95 },
    { id: 'topcoat_cost_per_gallon', type: 'number', title: 'Topcoat Cost ($/gallon)', label: 'Topcoat Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 125 },
    { id: 'antifouling_cost_per_gallon', type: 'number', title: 'Antifouling Cost ($/gallon)', label: 'Antifouling Cost ($/gallon)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 165 },
    { id: 'surface_prep_cost_per_sqft', type: 'number', title: 'Surface Prep Cost ($/sq ft)', label: 'Surface Prep Cost ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 5.50 },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 88 },
    { id: 'application_rate_sqft_per_hour', type: 'number', title: 'Application Rate (sq ft/hour)', label: 'Application Rate (sq ft/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 40 },
    { id: 'waste_factor_percent', type: 'number', title: 'Waste Factor (%)', label: 'Waste Factor (%)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 8 },

    // Pricing and profitability
    { id: 'pricing-profitability', type: 'group', title: 'Pricing & Profitability', description: 'Markup, margins, and final pricing strategy', sectionId: 'project-section', order: 9, size: 24, collapsible: true },
    { id: 'material_markup_percent', type: 'number', title: 'Material Markup (%)', label: 'Material Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 30 },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 40 },
    { id: 'equipment_markup_percent', type: 'number', title: 'Equipment Markup (%)', label: 'Equipment Markup (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 25 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 22 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 18 },
    { id: 'contingency_percent', type: 'number', title: 'Contingency (%)', label: 'Contingency (%)', sectionId: 'project-section', groupId: 'pricing-profitability', size: 8, defaultValue: 10 },

    // Marine-specific pricing
    { id: 'marine-pricing', type: 'group', title: 'Marine-Specific Pricing', description: 'Marine industry pricing factors', sectionId: 'project-section', order: 10, size: 24, collapsible: true },
    { id: 'drydock_premium_percent', type: 'number', title: 'Drydock Premium (%)', label: 'Drydock Premium (%)', sectionId: 'project-section', groupId: 'marine-pricing', size: 8, defaultValue: 15 },
    { id: 'offshore_premium_percent', type: 'number', title: 'Offshore Premium (%)', label: 'Offshore Premium (%)', sectionId: 'project-section', groupId: 'marine-pricing', size: 8, defaultValue: 25 },
    { id: 'weather_delay_allowance_percent', type: 'number', title: 'Weather Delay Allowance (%)', label: 'Weather Delay Allowance (%)', sectionId: 'project-section', groupId: 'marine-pricing', size: 8, defaultValue: 12 },
    { id: 'classification_society_premium_percent', type: 'number', title: 'Class Society Premium (%)', label: 'Class Society Premium (%)', sectionId: 'project-section', groupId: 'marine-pricing', size: 8, defaultValue: 8 },
    { id: 'minimum_acceptable_margin_percent', type: 'number', title: 'Minimum Acceptable Margin (%)', label: 'Minimum Acceptable Margin (%)', sectionId: 'project-section', groupId: 'marine-pricing', size: 8, defaultValue: 18 }
  ],
  aiPrompt: `
You are a **marine coatings estimation expert**.  
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
   - Marine Environment Analysis *(table)*  
   - Coating System Specification by Zone *(table)*  
   - Material Takeoff (MTO) *(table)*  
   - Labor & Equipment Estimate *(table with crew composition, hours, productivity)*  
   - Cost Breakdown *(table with line items, subtotals, totals)*  
   - Schedule & Phasing  
   - Risk & Uncertainty Analysis  
   - Exclusions & Clarifications  
   

2. **Formatting Rules**  
   - Use **Markdown headings** for sections  
   - Use **tables** for numeric breakdowns (Environment, Coating Zones, MTO, Labor, Cost)  
   - Show **formulas explicitly** (e.g., *Coating Volume = Surface Area ÷ Coverage × Number of Coats × (1 + Waste Factor)*)  
   - Provide **rationale** under each table  
   
   **CRITICAL TABLE FORMATTING RULES:**  
   - Always use proper markdown table syntax with pipe separators  
   - Include header separator row with dashes and colons for alignment  
   - Align numbers right using colons in separator row
   - No extra spaces or line breaks within table cells  
   - Separate formulas from tables with blank lines  
   - Use consistent decimal places for currency  and quantities 

3. **Calculation Requirements**  
   Use the input values to calculate the following:  

   - **Marine Environment Analysis**  
     - Corrosivity Category (C1-C5-M based on ISO 12944)  
     - Expected Service Life vs. Coating System  
     - Environmental Stress Factors  
     - Regulatory Compliance Requirements  

   - **Coating System by Zone**  
     - Underwater Hull: Primer + Antifouling System  
     - Boot Topping: Intermediate + Boot Topping  
     - Topsides: Primer + Intermediate + Topcoat  
     - Superstructure: Primer + Topcoat  
     - Decks: Non-slip or Deck Coating System  
     - Tanks: Tank Lining System (if applicable)  

   - **Material Quantities**  
     - Coating Volume by Zone = Area ÷ Coverage × Coats × (1 + Waste Factor)  
     - Total Primer = Sum of all zones requiring primer  
     - Total Intermediate = Topsides + Boot Topping areas  
     - Total Topcoat = Topsides + Superstructure areas  
     - Total Antifouling = Underwater hull area  

   - **Labor Hours**  
     - Surface Prep Hours = Area ÷ Prep Rate × Access Factor  
     - Application Hours = Area ÷ Application Rate × Number of Coats  
     - Inspection Hours = Area × Inspection Factor  
     - Total Labor = Prep + Application + Inspection + Setup/Cleanup  

   - **Equipment & Tools**  
     - Blast Equipment Days = Surface Prep Hours ÷ Equipment Hours/Day  
     - Spray Equipment Days = Application Hours ÷ Equipment Hours/Day  
     - Containment/Scaffolding = Based on vessel size and location  

   - **Marine-Specific Costs**  
     - Drydock Premium = Based on drydock vs. floating work  
     - Offshore Premium = For offshore platform work  
     - Weather Delays = Based on location and season  
     - Classification Society = For class-approved work  

   - **Total Cost**  
     - Direct Costs = Materials + Labor + Equipment + Surface Prep  
     - Apply markups: **Material, Labor, Equipment**  
     - Add **Overhead, Profit Margin, Contingency**  
     - Apply **Marine Premiums** (drydock, offshore, weather, class)  
     - Show **Grand Total**  

4. **Tables Required**  
   
   **Marine Environment Analysis**  
 
   | Parameter | Condition | Corrosivity | Standard | Impact |
   |-----------|-----------|-------------|----------|--------|
   | Salinity | Normal Seawater | C5-M | ISO 12944 | High corrosion rate |
 
   
   **Coating System by Zone**  
 
   | Zone | System | Coats | DFT (mils) | Coverage (sq ft/gal) | Rationale |
   |------|--------|------:|-----------:|--------------------:|-----------|
   | Underwater Hull | Primer + Antifouling | 3 | 14 | 185.5 | IMO PSPC compliance |
 
   
   **Material Takeoff (MTO)**  
 
   | Item | Unit | Quantity | Formula | Notes |
   |------|------|--------:|---------|-------|
   | Primer | gal | 297.18 | Area ÷ Coverage × Coats × 1.08 | All zones |
 
   
   **Labor & Equipment Estimate**  
 
   | Trade | Productivity | Hours | Labor Rate | Subtotal | Rationale |
   |-------|-------------|------:|-----------:|---------:|-----------|
   | Surface Prep | 50 sq ft/hr | 1,207 | $88/hr | $106,216 | Blast cleaning |
 
   
   **Cost Breakdown**  
 
   | Category | Unit Rate | Quantity | Subtotal | Rationale |
   |----------|----------:|---------:|---------:|-----------|
   | Materials | $85/gal | 297.18 | $25,270 | Primer costs |
 
   
   Include **subtotals** and **grand total** with proper formatting.  

5. **Contextual Rationale**  
   - Explain **Marine Environment Impact** on coating system selection  
   - Justify **Coating System by Zone** based on exposure and regulations  
   - Note how **Vessel Type** and **Operating Area** affect specifications  
   - Address **Surface Preparation Requirements** for marine environments  
   - Explain **Application Location** impact (drydock vs. floating vs. offshore)  
   - Detail **Quality Control** and **Classification Society** requirements  
   - Address **Weather Considerations** and **Tidal Impacts**  

6. **Tone & Output Style**  
   - Professional and technical  
   - Mix **narrative + tables**  
   - Always provide **transparent assumptions**  
   - Emphasize **marine expertise** and **regulatory compliance**  `
};
