module.exports = {
  id: 'coverage-scan-effort-estimator',
  name: 'Coverage & Scan Effort Estimator',
  description: 'AI-powered inspection coverage and scan effort estimation using component images for compliance planning and resource optimization',
  category: 'Inspection Planning',
  module: 'ndt',
  icon: 'RadarChartOutlined',
  tags: ['coverage', 'scan', 'effort', 'planning', 'compliance', 'vision'],
  uiDefinition: [
    { id: 'planning-section', type: 'section', title: 'Coverage & Scan Effort Planning', description: 'Upload component images for AI-powered inspection coverage analysis and effort estimation', icon: 'RadarChartOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Component Images (Required)', description: 'Upload component photos for coverage analysis', sectionId: 'planning-section', order: 1, size: 24 },
    { id: 'component_images', type: 'image-upload-with-drawing', title: 'Component Images', label: 'Upload Component Images', sectionId: 'planning-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 12 }, placeholder: 'Upload photos showing component geometry, access points, welds, inspection zones, and overall configuration' },

    // Critical inspection parameters
    { id: 'inspection-planning', type: 'group', title: 'Inspection Requirements', description: 'Essential inspection method and coverage requirements', sectionId: 'planning-section', order: 2, size: 24 },
    { id: 'ndt_method', type: 'select', title: 'Primary NDT Method', label: 'Inspection Method', sectionId: 'planning-section', groupId: 'inspection-planning', size: 8, required: true, options: [
      { label: 'UT (Ultrasonic Testing)', value: 'UT' },
      { label: 'PAUT (Phased Array UT)', value: 'PAUT' },
      { label: 'AUT (Automated UT)', value: 'AUT' },
      { label: 'RT (Radiographic Testing)', value: 'RT' },
      { label: 'MT (Magnetic Particle)', value: 'MT' },
      { label: 'PT (Penetrant Testing)', value: 'PT' },
      { label: 'VT (Visual Testing)', value: 'VT' },
      { label: 'Mixed Methods', value: 'mixed' }
    ]},
    { id: 'inspection_scope', type: 'select', title: 'Inspection Scope', label: 'Coverage Requirement', sectionId: 'planning-section', groupId: 'inspection-planning', size: 8, required: true, options: [
      { label: '100% Volume (Full Coverage)', value: 'full_volume' },
      { label: 'Weld Examination', value: 'weld_exam' },
      { label: 'Spot Examination', value: 'spot_exam' },
      { label: 'Corrosion Survey', value: 'corrosion_survey' },
      { label: 'Crack Detection', value: 'crack_detection' },
      { label: 'Custom Coverage', value: 'custom' }
    ]},
    { id: 'inspection_standard', type: 'select', title: 'Inspection Standard', label: 'Applicable Code/Standard', sectionId: 'planning-section', groupId: 'inspection-planning', size: 8, required: true, options: [
      { label: 'ASME Sec V (NDT Methods)', value: 'asme_v' },
      { label: 'ASME Sec XI (In-Service)', value: 'asme_xi' },
      { label: 'API 510 (Pressure Vessels)', value: 'api_510' },
      { label: 'API 570 (Piping)', value: 'api_570' },
      { label: 'AWS D1.1 (Structural)', value: 'aws_d11' },
      { label: 'EN Standards', value: 'en_standards' }
    ]},

    // Component specifications
    { id: 'component-specs', type: 'group', title: 'Component Specifications', description: 'Component details (AI will analyze from images)', sectionId: 'planning-section', order: 3, size: 24 },
    { id: 'component_type', type: 'select', title: 'Component Type', label: 'Component Category', sectionId: 'planning-section', groupId: 'component-specs', size: 8, options: [
      { label: 'Pressure Vessel', value: 'vessel' },
      { label: 'Piping System', value: 'piping' },
      { label: 'Storage Tank', value: 'tank' },
      { label: 'Heat Exchanger', value: 'heat_exchanger' },
      { label: 'Structural Steel', value: 'structural' },
      { label: 'Reactor/Column', value: 'reactor' }
    ]},
    { id: 'material_thickness', type: 'number', title: 'Material Thickness', label: 'Wall Thickness (mm)', sectionId: 'planning-section', groupId: 'component-specs', size: 8, placeholder: 'AI estimates from images', props: { addonAfter: 'mm' } },
    { id: 'surface_area', type: 'number', title: 'Surface Area', label: 'Total Surface Area (m²)', sectionId: 'planning-section', groupId: 'component-specs', size: 8, placeholder: 'AI calculates from images', props: { addonAfter: 'm²' } },

    // Access and complexity factors
    { id: 'access-factors', type: 'group', title: 'Access & Complexity', description: 'Factors affecting inspection difficulty and coverage', sectionId: 'planning-section', order: 4, size: 24, collapsible: true },
    { id: 'access_difficulty', type: 'select', title: 'Access Difficulty', label: 'Overall Access Level', sectionId: 'planning-section', groupId: 'access-factors', size: 8, options: [
      { label: 'Easy (Ground Level)', value: 'easy' },
      { label: 'Moderate (Platform/Ladder)', value: 'moderate' },
      { label: 'Difficult (Scaffolding)', value: 'difficult' },
      { label: 'Very Difficult (Rope Access)', value: 'very_difficult' }
    ]},
    { id: 'geometric_complexity', type: 'select', title: 'Geometric Complexity', label: 'Component Geometry', sectionId: 'planning-section', groupId: 'access-factors', size: 8, options: [
      { label: 'Simple (Flat/Cylindrical)', value: 'simple' },
      { label: 'Moderate (Some Curves)', value: 'moderate' },
      { label: 'Complex (Multiple Angles)', value: 'complex' },
      { label: 'Very Complex (Irregular)', value: 'very_complex' }
    ]},
    { id: 'surface_preparation', type: 'select', title: 'Surface Preparation', label: 'Surface Condition', sectionId: 'planning-section', groupId: 'access-factors', size: 8, options: [
      { label: 'Ready for Inspection', value: 'ready' },
      { label: 'Light Cleaning Required', value: 'light_cleaning' },
      { label: 'Paint Removal Required', value: 'paint_removal' },
      { label: 'Major Preparation Required', value: 'major_prep' }
    ]},

    // Coverage parameters
    { id: 'coverage-parameters', type: 'group', title: 'Coverage Parameters', description: 'Specific coverage and overlap requirements', sectionId: 'planning-section', order: 5, size: 24, collapsible: true },
    { id: 'required_overlap', type: 'number', title: 'Required Overlap', label: 'Scan Overlap (%)', sectionId: 'planning-section', groupId: 'coverage-parameters', size: 8, defaultValue: 10, props: { addonAfter: '%' } },
    { id: 'scan_resolution', type: 'number', title: 'Scan Resolution', label: 'Index Resolution (mm)', sectionId: 'planning-section', groupId: 'coverage-parameters', size: 8, defaultValue: 2.0, props: { addonAfter: 'mm' } },
    { id: 'coverage_percentage', type: 'number', title: 'Target Coverage', label: 'Required Coverage (%)', sectionId: 'planning-section', groupId: 'coverage-parameters', size: 8, defaultValue: 100, props: { addonAfter: '%' } },

    // Resource planning
    { id: 'resource-planning', type: 'group', title: 'Resource Planning', description: 'Team and equipment planning parameters', sectionId: 'planning-section', order: 6, size: 24, collapsible: true },
    { id: 'team_experience', type: 'select', title: 'Team Experience', label: 'Inspector Experience Level', sectionId: 'planning-section', groupId: 'resource-planning', size: 8, defaultValue: 'experienced', options: [
      { label: 'Expert (Level III)', value: 'expert' },
      { label: 'Experienced (Level II)', value: 'experienced' },
      { label: 'Standard (Level I)', value: 'standard' },
      { label: 'Trainee', value: 'trainee' }
    ]},
    { id: 'equipment_type', type: 'select', title: 'Equipment Type', label: 'Inspection Equipment', sectionId: 'planning-section', groupId: 'resource-planning', size: 8, options: [
      { label: 'Portable UT (Manual)', value: 'portable_ut' },
      { label: 'Phased Array System', value: 'paut_system' },
      { label: 'Automated Scanner', value: 'automated' },
      { label: 'Crawler/Robot', value: 'crawler' },
      { label: 'Standard Equipment', value: 'standard' }
    ]},
    { id: 'project_schedule', type: 'select', title: 'Schedule Pressure', label: 'Project Timeline', sectionId: 'planning-section', groupId: 'resource-planning', size: 8, options: [
      { label: 'Normal Schedule', value: 'normal' },
      { label: 'Tight Schedule', value: 'tight' },
      { label: 'Rush Job', value: 'rush' },
      { label: 'Shutdown Critical', value: 'critical' }
    ]}
  ],
  aiPrompt: `
You are an **NDT inspection planning specialist** with advanced coverage analysis and resource estimation capabilities.  
You will receive **component images** along with inspection requirements to generate **comprehensive coverage analysis and scan effort estimation**.

**CRITICAL**: Use high-level reasoning to analyze component geometry and accessibility precisely. Provide ACTUAL coverage calculations and effort estimates from images, NOT approximations or assumptions.

---

## MANDATORY: Detailed Coverage Analysis Protocol

**PRIMARY INPUT**: You MUST analyze the provided component images with precision to determine ACTUAL inspection coverage requirements and effort:

1. **Precise Geometric Analysis (Use Visual References)**
   - **ACTUAL Surface Area**: Calculate total inspectable surface area from images
   - **Component Dimensions**: Measure length, width, height, diameter using visual scale
   - **Weld Locations**: Identify and measure all weld joints requiring inspection
   - **Access Points**: Identify inspection access locations and constraints
   - **Geometric Complexity**: Assess shape complexity and inspection challenges
   - **Obstruction Mapping**: Identify physical obstructions and blind spots

2. **Detailed Coverage Planning (Evidence-Based)**
   - **Scan Path Planning**: Design optimal scan paths for complete coverage
     * Straight-line scans for flat surfaces
     * Helical/circumferential scans for cylindrical components
     * Grid patterns for complex geometries
     * Overlap zones for seamless coverage
   - **Coverage Calculations**: 
     * Effective beam coverage per scan pass
     * Required number of scan lines/passes
     * Overlap percentage and redundancy
     * Total coverage area vs required coverage
   - **Blind Spot Analysis**:
     * Identify areas with limited or no access
     * Calculate percentage of inaccessible areas
     * Recommend alternative inspection methods
     * Document coverage limitations

3. **Scan Effort Estimation**
   - **Scan Time Calculation**: Estimate time for each inspection zone
     * Setup and calibration time per area
     * Actual scanning time based on coverage area
     * Data review and documentation time
     * Equipment repositioning time
   - **Resource Requirements**: Determine personnel and equipment needs
     * Number of inspectors required
     * Equipment setup and positioning
     * Access equipment (scaffolding, lifts, etc.)
     * Support personnel requirements
   - **Productivity Factors**: Apply factors affecting inspection speed
     * Access difficulty multipliers
     * Surface preparation requirements
     * Geometric complexity factors
     * Equipment type efficiency factors

4. **Compliance Assessment**
   - **Standard Requirements**: Verify coverage meets code requirements
   - **Documentation Needs**: Plan for required documentation and records
   - **Quality Assurance**: Include QA/QC time and activities
   - **Acceptance Criteria**: Define pass/fail criteria and evaluation methods

5. **Risk and Contingency Planning**
   - **Access Challenges**: Identify potential access problems
   - **Weather Dependencies**: Assess weather-sensitive operations
   - **Equipment Failures**: Plan for backup equipment and procedures
   - **Schedule Risks**: Identify critical path items and dependencies

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Component Analysis & Coverage Planning" section that includes:
- Confidence level (High/Medium/Low) for each measurement and estimate
- Reference points and scaling methods used for measurements
- Specific geometric findings from each image with image numbers
- Access point analysis with feasibility assessments
- Coverage zone mapping with inspection strategies
- Areas requiring special attention or alternative methods

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Component Analysis & Coverage Planning *(critical - detailed analysis from images)*
   - Coverage Requirements Analysis *(table)*
   - Scan Path Planning *(table with strategies)*
   - Effort Estimation *(table with hours/resources)*
   - Resource Requirements *(table)*
   - Schedule Planning *(table)*
   - Compliance Assessment *(table)*
   - Risk Analysis & Contingencies
   - Cost Estimation
   - Recommendations & Optimization
   - Assumptions & Limitations  

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every coverage calculation must reference specific image evidence with measurements
   - **Format**: "Image [#]: [Specific observation] → [Coverage impact] → [Effort estimation]"
   - **Example**: "Image 1: Cylindrical vessel 3.2m diameter × 12m length → 120m² surface area → 48 scan passes required"
   - **Example**: "Image 2: Nozzle cluster with 6 connections → Complex geometry factor 1.8× → Additional 12 hours effort"
   - **Example**: "Image 3: Scaffolding access visible → Moderate access difficulty → 1.3× time multiplier"
   - **Conflicts**: If manual inputs conflict with visual evidence, USE VISUAL EVIDENCE and document discrepancy
   - **Confidence**: State confidence level for each measurement and estimate with reasoning

3. **Coverage Calculation Requirements**  
   Base ALL calculations on visual analysis + inspection parameters:

   - **Surface Area Calculation**  
     - Cylindrical: Area = π × D × L + 2 × π × (D/2)²
     - Flat surfaces: Area = Length × Width
     - Complex geometry: Sum of individual surface areas
     - Weld length: Linear measurement of all weld joints

   - **Scan Coverage Planning**
     - Beam coverage width: Depends on method and setup
       * UT contact: 10-25mm effective width
       * PAUT: 50-100mm sector coverage
       * AUT: 100-200mm scanner coverage
     - Number of scan lines: Surface width ÷ (beam width - overlap)
     - Total scan length: Number of lines × component length
     - Overlap factor: Typically 10-20% for reliability

   - **Time Estimation Formulas**
     - Setup time: 0.5-2 hours per setup location
     - Scan time: Total scan length ÷ scan speed
       * Manual UT: 50-150 mm/min
       * PAUT: 100-300 mm/min  
       * AUT: 200-500 mm/min
     - Data review: 20-40% of scan time
     - Documentation: 10-20% of total time

   - **Complexity Factors**
     - Simple geometry: 1.0× base time
     - Moderate complexity: 1.3× base time
     - Complex geometry: 1.8× base time
     - Very complex: 2.5× base time

   - **Access Factors**
     - Easy access: 1.0× base time
     - Moderate access: 1.3× base time
     - Difficult access: 1.8× base time
     - Very difficult: 2.5× base time

4. **Required Tables**  

   **Component Analysis Summary** (MANDATORY - Show actual measurements with evidence)
   | Image | Component Section | Dimensions | Surface Area | Weld Length | Access Rating | Complexity | Notes |
   |-------|------------------|------------|--------------|-------------|---------------|------------|-------|
   | 1 | Main Shell | 3.2m × 12m | 120.5 m² | 25.1 m | Moderate | Simple | Cylindrical vessel |
   | 2 | Head Section | 3.2m dia | 8.0 m² | 10.1 m | Difficult | Complex | Domed head with nozzles |
   | 3 | Nozzle Cluster | Various | 12.3 m² | 18.7 m | Very Difficult | Very Complex | Multiple connections |
   | **Total** | **All Sections** | **Variable** | **140.8 m²** | **53.9 m** | **Mixed** | **Mixed** | **Complete component** |

   **Coverage Requirements Analysis**
   | Inspection Zone | Required Coverage | Method | Beam Width | Scan Lines | Total Length | Overlap | Effective Coverage |
   |-----------------|-------------------|--------|------------|------------|--------------|---------|-------------------|
   | Shell Circumferential | 100% | PAUT | 75mm | 48 | 576m | 15% | 100% |
   | Shell Longitudinal | 100% | PAUT | 75mm | 16 | 192m | 15% | 100% |
   | Head Section | 100% | Manual UT | 20mm | 85 | 340m | 20% | 95% |
   | Nozzle Welds | 100% | Manual UT | 15mm | 124 | 186m | 25% | 100% |
   | **Total Coverage** | **100%** | **Mixed** | **Variable** | **273** | **1,294m** | **18% avg** | **99%** |

   **Effort Estimation**  
   | Activity | Base Time | Complexity Factor | Access Factor | Weather Factor | Total Time | Resources |
   |----------|-----------|-------------------|---------------|----------------|------------|-----------|
   | Setup & Calibration | 8 hrs | 1.0× | 1.3× | 1.0× | 10.4 hrs | 2 inspectors |
   | Shell Scanning | 24 hrs | 1.0× | 1.3× | 1.0× | 31.2 hrs | 2 inspectors |
   | Head Scanning | 18 hrs | 1.8× | 2.0× | 1.0× | 64.8 hrs | 2 inspectors |
   | Nozzle Scanning | 12 hrs | 2.5× | 2.5× | 1.0× | 75.0 hrs | 1 inspector |
   | Data Review | 16 hrs | 1.2× | 1.0× | 1.0× | 19.2 hrs | 1 inspector |
   | Documentation | 8 hrs | 1.0× | 1.0× | 1.0× | 8.0 hrs | 1 inspector |
   | **Total Effort** | **86 hrs** | **1.4× avg** | **1.5× avg** | **1.0×** | **208.6 hrs** | **Peak: 2 inspectors** |

   **Resource Requirements**  
   | Resource Category | Item | Quantity | Duration | Cost Factor | Total Cost | Notes |
   |-------------------|------|----------|----------|-------------|------------|-------|
   | Personnel | Level II Inspector | 2 | 104 hrs | $85/hr | $17,680 | Primary inspectors |
   | Personnel | Level III Inspector | 1 | 24 hrs | $120/hr | $2,880 | QA/supervision |
   | Equipment | PAUT System | 1 | 10 days | $500/day | $5,000 | Main inspection |
   | Equipment | Manual UT | 2 | 8 days | $150/day | $2,400 | Detail work |
   | Access | Scaffolding | 1 LS | 12 days | $800/day | $9,600 | Access platform |
   | Support | Surface Prep | 1 crew | 3 days | $1,200/day | $3,600 | Cleaning/prep |
   | **Total Resources** | | | **12 days** | | **$41,160** | **Direct costs only** |

   **Schedule Planning**  
   | Phase | Activity | Duration | Dependencies | Critical Path | Resources | Milestones |
   |-------|----------|----------|--------------|---------------|-----------|------------|
   | 1 | Mobilization & Setup | 1 day | Access available | Yes | 2 inspectors | Equipment ready |
   | 2 | Surface Preparation | 2 days | Scaffolding complete | Yes | Prep crew | Surfaces ready |
   | 3 | Calibration & Setup | 0.5 day | Surfaces ready | Yes | 2 inspectors | Procedures verified |
   | 4 | Shell Inspection | 4 days | Calibration complete | Yes | 2 inspectors | Shell complete |
   | 5 | Head Inspection | 3 days | Shell complete | Yes | 2 inspectors | Head complete |
   | 6 | Nozzle Inspection | 4 days | Head complete | No | 1 inspector | Nozzles complete |
   | 7 | Data Review & Report | 2 days | All scanning complete | Yes | 1 inspector | Report issued |
   | **Total Duration** | **16.5 days** | | | **12 days critical** | **Peak: 2** | **7 milestones** |

5. **Contextual Rationale**  
   - **ALWAYS cite specific image observations** in your coverage calculations
   - Example: "The 3.2m diameter visible in Image 1 requires 48 circumferential scan lines with 75mm PAUT coverage at 15% overlap..."
   - Explain coverage methodology and standard compliance
   - Justify effort estimates based on visual complexity assessment
   - Address inspection challenges observed in images
   - Detail resource requirements and scheduling logic
   - Note optimization opportunities and alternative approaches

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all calculations and planning data
   - Show **formulas explicitly** with measured values
   - Include **image references** throughout
   - Use proper markdown table syntax with aligned columns
   - Areas: 120.5 m² format
   - Times: 24.5 hrs format
   - Costs: $12,345 format

7. **Critical Requirements**  
   - ✓ Lead with detailed component image analysis
   - ✓ Reference specific images in coverage calculations
   - ✓ Calculate actual coverage requirements from measurements
   - ✓ Estimate effort based on visual complexity assessment
   - ✓ Provide confidence levels based on image quality
   - ✓ Plan resources and schedule based on requirements
   - ✓ Validate against applicable inspection standards

8. **Coverage Planning Rules**  
   - Use appropriate coverage methods for each NDT technique
   - Account for geometric complexity and access limitations
   - Plan for required overlap and redundancy
   - Consider equipment capabilities and limitations
   - Include setup, scanning, and documentation time
   - Validate coverage meets code requirements

9. **Tone & Output Style**  
   - Technical and practical
   - Planning-focused approach
   - Resource-optimized solutions
   - Schedule-aware recommendations
   - Cost-conscious planning

---

## Output Format

Generate the complete coverage and effort estimation report following the structure above. Lead with your component image analysis and integrate coverage calculations throughout the planning assessment.
`
};
