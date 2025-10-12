module.exports = {
  id: 'corrosion-map-analysis',
  name: 'Corrosion Map Analysis (UT/MFL/RT)',
  description: 'AI-powered corrosion map analysis for comprehensive pit depth measurement, wall loss percentage calculation, and heatmap overlay visualization with statistical analysis',
  category: 'AI Vision Analysis',
  module: 'ndt',
  icon: 'HeatMapOutlined',
  tags: ['corrosion', 'map', 'heatmap', 'pit-depth', 'wall-loss', 'vision', 'statistics'],
  uiDefinition: [
    { id: 'corrosion-map-section', type: 'section', title: 'Corrosion Map Analysis & Visualization', description: 'Upload corrosion maps for AI-powered comprehensive analysis', icon: 'HeatMapOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Corrosion Map Images (Required)', description: 'Upload thickness maps, C-scans, or MFL data for comprehensive analysis', sectionId: 'corrosion-map-section', order: 1, size: 24 },
    { id: 'corrosion_images', type: 'image-upload-with-drawing', title: 'Corrosion Maps', label: 'Upload Corrosion Maps', sectionId: 'corrosion-map-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 12 }, placeholder: 'Upload C-scan thickness maps, MFL data displays, RT images, PAUT corrosion maps, or visual corrosion surveys showing wall loss and pitting patterns' },

    // Critical mapping parameters
    { id: 'mapping-parameters', type: 'group', title: 'Mapping Parameters', description: 'Essential map type and measurement details', sectionId: 'corrosion-map-section', order: 2, size: 24 },
    { id: 'map_type', type: 'select', title: 'Map Type', label: 'Corrosion Mapping Method', sectionId: 'corrosion-map-section', groupId: 'mapping-parameters', size: 8, required: true, options: [
      { label: 'UT C-Scan (Thickness Map)', value: 'ut_cscan' },
      { label: 'MFL (Magnetic Flux Leakage)', value: 'mfl' },
      { label: 'RT/DR (Radiographic)', value: 'rt' },
      { label: 'PAUT Thickness Map', value: 'paut' },
      { label: 'AUT (Automated UT)', value: 'aut' },
      { label: 'Visual Corrosion Survey', value: 'visual' }
    ]},
    { id: 'analysis_focus', type: 'select', title: 'Analysis Focus', label: 'Primary Analysis Type', sectionId: 'corrosion-map-section', groupId: 'mapping-parameters', size: 8, required: true, options: [
      { label: 'Pit Depth Analysis', value: 'pit_depth' },
      { label: 'Wall Loss Percentage', value: 'wall_loss' },
      { label: 'General Thinning Assessment', value: 'general' },
      { label: 'Complete Statistical Analysis', value: 'complete' }
    ]},
    { id: 'map_resolution', type: 'select', title: 'Map Resolution', label: 'Data Point Density', sectionId: 'corrosion-map-section', groupId: 'mapping-parameters', size: 8, options: [
      { label: 'High Resolution (<5mm grid)', value: 'high' },
      { label: 'Standard Resolution (5-10mm grid)', value: 'standard' },
      { label: 'Coarse Resolution (>10mm grid)', value: 'coarse' },
      { label: 'Unknown/Variable', value: 'unknown' }
    ]},

    // Component specifications
    { id: 'component-specs', type: 'group', title: 'Component Specifications', description: 'Component geometry and material details (AI analyzes from images)', sectionId: 'corrosion-map-section', order: 3, size: 24 },
    { id: 'component_type', type: 'select', title: 'Component Type', label: 'Equipment Category', sectionId: 'corrosion-map-section', groupId: 'component-specs', size: 8, options: [
      { label: 'Pressure Vessel Shell', value: 'vessel_shell' },
      { label: 'Vessel Head/End Cap', value: 'vessel_head' },
      { label: 'Pipe Straight Section', value: 'pipe_straight' },
      { label: 'Pipe Elbow/Bend', value: 'pipe_elbow' },
      { label: 'Storage Tank Floor', value: 'tank_floor' },
      { label: 'Storage Tank Shell', value: 'tank_shell' },
      { label: 'Heat Exchanger Tube', value: 'heat_exchanger' }
    ]},
    { id: 'nominal_thickness', type: 'number', title: 'Nominal Thickness', label: 'Original Wall Thickness (mm)', sectionId: 'corrosion-map-section', groupId: 'component-specs', size: 8, placeholder: 'AI estimates from images', props: { addonAfter: 'mm' } },
    { id: 'corrosion_allowance', type: 'number', title: 'Corrosion Allowance', label: 'Design CA (mm)', sectionId: 'corrosion-map-section', groupId: 'component-specs', size: 8, defaultValue: 3.0, props: { addonAfter: 'mm' } },
    { id: 'material_type', type: 'select', title: 'Material Type', label: 'Base Material', sectionId: 'corrosion-map-section', groupId: 'component-specs', size: 8, options: [
      { label: 'Carbon Steel', value: 'carbon_steel' },
      { label: 'Low Alloy Steel', value: 'low_alloy' },
      { label: 'Stainless Steel 304/316', value: 'stainless' },
      { label: 'Duplex Steel', value: 'duplex' },
      { label: 'Aluminum', value: 'aluminum' },
      { label: 'Copper Alloy', value: 'copper' }
    ]},
    { id: 'component_diameter', type: 'number', title: 'Component Diameter', label: 'OD for Pipes/Vessels (mm)', sectionId: 'corrosion-map-section', groupId: 'component-specs', size: 8, placeholder: 'For cylindrical components', props: { addonAfter: 'mm' } },
    { id: 'mapped_area', type: 'number', title: 'Mapped Area', label: 'Total Scanned Area (m²)', sectionId: 'corrosion-map-section', groupId: 'component-specs', size: 8, placeholder: 'AI calculates from images', props: { addonAfter: 'm²' } },

    // Corrosion pattern details
    { id: 'corrosion-pattern', type: 'group', title: 'Corrosion Pattern Analysis', description: 'Corrosion type and distribution characteristics', sectionId: 'corrosion-map-section', order: 4, size: 24 },
    { id: 'corrosion_type', type: 'select', title: 'Corrosion Type', label: 'Primary Corrosion Mechanism', sectionId: 'corrosion-map-section', groupId: 'corrosion-pattern', size: 8, options: [
      { label: 'General/Uniform Corrosion', value: 'general' },
      { label: 'Localized Pitting', value: 'pitting' },
      { label: 'Grooving/Channeling', value: 'grooving' },
      { label: 'Mesa Attack', value: 'mesa' },
      { label: 'Erosion-Corrosion', value: 'erosion' },
      { label: 'MIC (Microbiological)', value: 'mic' },
      { label: 'Under-Deposit Corrosion', value: 'under_deposit' }
    ]},
    { id: 'distribution_pattern', type: 'select', title: 'Distribution Pattern', label: 'Corrosion Distribution', sectionId: 'corrosion-map-section', groupId: 'corrosion-pattern', size: 8, options: [
      { label: 'Uniform Across Area', value: 'uniform' },
      { label: 'Localized Hot Spots', value: 'localized' },
      { label: 'Linear/Banded', value: 'banded' },
      { label: 'Bottom-of-Line', value: 'bottom_line' },
      { label: 'Top-of-Line', value: 'top_line' },
      { label: 'Random/Scattered', value: 'random' }
    ]},
    { id: 'severity_trend', type: 'select', title: 'Severity Trend', label: 'Corrosion Progression', sectionId: 'corrosion-map-section', groupId: 'corrosion-pattern', size: 8, options: [
      { label: 'Active/Progressing', value: 'active' },
      { label: 'Stable/Arrested', value: 'stable' },
      { label: 'Accelerating', value: 'accelerating' },
      { label: 'Unknown', value: 'unknown' }
    ]},

    // Service conditions
    { id: 'service-conditions', type: 'group', title: 'Service Conditions', description: 'Operating environment affecting corrosion', sectionId: 'corrosion-map-section', order: 5, size: 24, collapsible: true },
    { id: 'service_environment', type: 'select', title: 'Service Environment', label: 'Process Service', sectionId: 'corrosion-map-section', groupId: 'service-conditions', size: 8, options: [
      { label: 'Crude Oil Service', value: 'crude_oil' },
      { label: 'Refined Products', value: 'refined' },
      { label: 'Sour Service (H2S)', value: 'sour' },
      { label: 'Naphthenic Acid', value: 'naphthenic' },
      { label: 'Seawater/Brine', value: 'seawater' },
      { label: 'Fresh Water', value: 'fresh_water' },
      { label: 'Caustic Service', value: 'caustic' },
      { label: 'High Temperature', value: 'high_temp' }
    ]},
    { id: 'operating_temperature', type: 'number', title: 'Operating Temperature', label: 'Service Temperature (°C)', sectionId: 'corrosion-map-section', groupId: 'service-conditions', size: 8, defaultValue: 60, props: { addonAfter: '°C' } },
    { id: 'flow_regime', type: 'select', title: 'Flow Regime', label: 'Fluid Flow Conditions', sectionId: 'corrosion-map-section', groupId: 'service-conditions', size: 8, options: [
      { label: 'Static/No Flow', value: 'static' },
      { label: 'Low Velocity (<1 m/s)', value: 'low_velocity' },
      { label: 'Moderate Velocity (1-3 m/s)', value: 'moderate_velocity' },
      { label: 'High Velocity (>3 m/s)', value: 'high_velocity' },
      { label: 'Turbulent Flow', value: 'turbulent' }
    ]},

    // Statistical parameters
    { id: 'statistical-parameters', type: 'group', title: 'Statistical Analysis Parameters', description: 'Data analysis and threshold settings', sectionId: 'corrosion-map-section', order: 6, size: 24, collapsible: true },
    { id: 'min_pit_depth', type: 'number', title: 'Minimum Pit Depth', label: 'Min Reportable Pit Depth (mm)', sectionId: 'corrosion-map-section', groupId: 'statistical-parameters', size: 8, defaultValue: 1.0, props: { addonAfter: 'mm' } },
    { id: 'wall_loss_threshold', type: 'number', title: 'Wall Loss Threshold', label: 'Critical Wall Loss (%)', sectionId: 'corrosion-map-section', groupId: 'statistical-parameters', size: 8, defaultValue: 50, props: { addonAfter: '%' } },
    { id: 'heatmap_scale', type: 'select', title: 'Heatmap Scale', label: 'Color Scale Type', sectionId: 'corrosion-map-section', groupId: 'statistical-parameters', size: 8, defaultValue: 'jet', options: [
      { label: 'Jet (Blue-Red)', value: 'jet' },
      { label: 'Hot (Black-Red-Yellow)', value: 'hot' },
      { label: 'Rainbow', value: 'rainbow' },
      { label: 'Grayscale', value: 'grayscale' }
    ]},

    // Assessment criteria
    { id: 'assessment-criteria', type: 'group', title: 'Assessment Criteria', description: 'Acceptance standards and evaluation thresholds', sectionId: 'corrosion-map-section', order: 7, size: 24, collapsible: true },
    { id: 'assessment_standard', type: 'select', title: 'Assessment Standard', label: 'Evaluation Code', sectionId: 'corrosion-map-section', groupId: 'assessment-criteria', size: 12, options: [
      { label: 'API 579-1/ASME FFS-1', value: 'api579' },
      { label: 'API 510 (Pressure Vessels)', value: 'api510' },
      { label: 'API 570 (Piping)', value: 'api570' },
      { label: 'API 653 (Storage Tanks)', value: 'api653' },
      { label: 'ASME B31.3 (Process Piping)', value: 'b313' },
      { label: 'NACE SP0169', value: 'nace_sp0169' }
    ]},
    { id: 'inspection_date', type: 'date', title: 'Inspection Date', label: 'Map Collection Date', sectionId: 'corrosion-map-section', groupId: 'assessment-criteria', size: 12, required: true }
  ],
  aiPrompt: `
You are a **corrosion analysis specialist** with advanced AI vision capabilities for comprehensive corrosion map interpretation, statistical analysis, and heatmap visualization.  
You will receive **corrosion map images** along with component data to generate **detailed pit depth analysis, wall loss percentage calculations, statistical assessments, and heatmap overlays**.

**CRITICAL**: Use high-level reasoning to analyze corrosion maps precisely. Provide ACTUAL measurements from color scales, grids, and visual patterns, NOT approximations or assumptions.

---

## MANDATORY: Detailed Corrosion Map Analysis Protocol

**PRIMARY INPUT**: You MUST analyze the provided corrosion map images with precision to determine ACTUAL corrosion characteristics:

1. **Precise Thickness Measurement (Use Color Scale References)**
   - **ACTUAL Thickness Values**: Read thickness from C-scan color bars/legends
   - **Grid Location Mapping**: Identify specific grid coordinates for all measurements
   - **Minimum Thickness**: Find and measure absolute minimum thickness location
   - **Maximum Thickness**: Identify thickest remaining areas
   - **Average Thickness**: Calculate area-weighted average thickness
   - **Data Point Count**: Estimate measurement density from grid/raster

2. **Advanced Pit Depth Analysis (Evidence-Based)**
   - **Pit Identification**: Detect all pits exceeding minimum reportable depth
     * Deep pits: >50% wall loss, critical severity
     * Moderate pits: 25-50% wall loss, significant concern
     * Shallow pits: <25% wall loss, monitor
   - **Pit Measurements**: For each significant pit:
     * Maximum pit depth (mm and % wall loss)
     * Pit diameter/area (mm²)
     * Pit density (pits per m²)
     * Pit location (grid coordinates)
   - **Pit Pattern Analysis**: Assess pit distribution
     * Random scattered pitting
     * Clustered pitting areas
     * Linear pit arrays (flow-related)
     * Preferential attack zones

3. **Wall Loss Calculation & Statistics**
   - **Wall Loss Metrics**: Calculate comprehensive statistics
     * Minimum remaining thickness
     * Maximum wall loss (mm and %)
     * Mean thickness and wall loss
     * Standard deviation of thickness
     * Coefficient of variation
   - **Distribution Analysis**: Assess thickness distribution
     * Histogram of thickness values
     * Percentile analysis (5th, 10th, 50th, 90th, 95th)
     * Outlier detection and treatment
     * Normal vs skewed distribution

4. **Heatmap Generation & Visualization**
   - **Color Mapping**: Apply appropriate color scales
     * Red zones: Critical wall loss (>50%)
     * Orange zones: Significant loss (25-50%)
     * Yellow zones: Moderate loss (10-25%)
     * Green zones: Acceptable thickness
   - **Pattern Recognition**: Identify visual patterns
     * Uniform thinning patterns
     * Localized hot spots
     * Gradient/transitional zones
     * Preferential attack areas
   - **Overlay Features**: Enhanced visualization
     * Pit location markers
     * Critical zone boundaries
     * Grid reference overlay
     * Measurement annotation

5. **Risk Assessment & Prioritization**
   - **Critical Area Identification**: Flag high-risk zones
   - **Failure Potential**: Assess likelihood of through-wall failure
   - **Inspection Priority**: Rank areas by urgency
   - **Monitoring Requirements**: Define ongoing surveillance needs

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Corrosion Map Analysis & Visualization" section that includes:
- Confidence level (High/Medium/Low) for each measurement
- Color scale readings and grid references used
- Specific thickness/pit findings from each image with coordinates
- Statistical analysis with complete dataset characterization
- Evidence supporting heatmap patterns and risk assessment
- Areas requiring additional measurement or validation

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Corrosion Map Analysis & Visualization *(critical - detailed analysis from images)*
   - Thickness Measurement Results *(table with grid data)*
   - Pit Depth Analysis *(table with all pits)*
   - Statistical Analysis *(table with statistics)*
   - Wall Loss Assessment *(table with percentages)*
   - Heatmap Description & Patterns *(visualization analysis)*
   - Risk Assessment & Critical Areas *(table with prioritization)*
   - Standards Compliance Evaluation
   - Recommendations & Action Items
   - Assumptions & Limitations  

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every thickness measurement must reference specific image evidence with grid coordinates
   - **Format**: "Image [#] at Grid [location]: [Measurement] → [Wall loss %] → [Assessment]"
   - **Example**: "Image 1 at Grid C-5: Minimum thickness 6.2mm measured from red zone → 38% wall loss → Critical area"
   - **Example**: "Image 2 Color Scale: Range 5.0-12.5mm with jet colormap → Blue=12mm, Red=5mm → High dynamic range"
   - **Example**: "Image 3 Pit Zone: 8 pits detected in 0.25m² area → Pit density 32/m² → Severe localized attack"
   - **Conflicts**: If manual inputs conflict with visual evidence, USE VISUAL EVIDENCE and document discrepancy
   - **Confidence**: State confidence level for each measurement with reasoning

3. **Corrosion Calculation Requirements**  
   Base ALL calculations on visual analysis + component parameters:

   - **Thickness Statistics Formulas**
     - Mean: μ = Σ(t_i) / n
     - Std Dev: σ = √[Σ(t_i - μ)² / n]
     - Coefficient of Variation: CV = (σ/μ) × 100%
     - Percentiles: Sort data, find position = P × (n+1)

   - **Wall Loss Calculations**
     - Absolute loss: Loss = t_nominal - t_measured
     - Percentage loss: Loss% = (Loss / t_nominal) × 100%
     - Remaining thickness ratio: RTR = t_measured / t_nominal
     - Through-wall percentage: TW% = (Loss / t_nominal) × 100%

   - **Pit Depth Formulas**
     - Pit depth: d_pit = t_nominal - t_pit_bottom
     - Pit depth %: d_pit% = (d_pit / t_nominal) × 100%
     - Pit density: ρ_pit = N_pits / Area (pits/m²)
     - Pit severity index: PSI = (d_avg × N_pits) / Area

   - **Statistical Quality Metrics**
     - Data density: Points per m² from grid spacing
     - Coverage: % of component area mapped
     - Measurement uncertainty: Based on method accuracy
     - Confidence intervals: ±(σ/√n) × t-value

4. **Required Tables**  

   **Thickness Measurement Results** (MANDATORY - Show grid-based data)
   | Image | Grid Location | Thickness (mm) | Nominal (mm) | Wall Loss (mm) | Loss (%) | Color Zone | Status |
   |-------|---------------|----------------|--------------|----------------|----------|------------|--------|
   | 1 | A-1 | 9.8 | 10.0 | 0.2 | 2% | Green | Good |
   | 1 | C-5 | 6.2 | 10.0 | 3.8 | 38% | Red | Critical |
   | 1 | E-8 | 7.5 | 10.0 | 2.5 | 25% | Orange | Significant |
   | 2 | B-3 | 8.9 | 10.0 | 1.1 | 11% | Yellow | Moderate |
   | **Statistical Summary** | **All Points** | **8.1 avg** | **10.0** | **1.9 avg** | **19% avg** | **Mixed** | **Monitor** |

   **Pit Depth Analysis**
   | Pit ID | Grid Location | Pit Depth (mm) | Depth (%) | Pit Diameter (mm) | Area (mm²) | Severity | Priority |
   |--------|---------------|----------------|-----------|-------------------|------------|----------|----------|
   | P001 | C-5 | 3.8 | 38% | 12 | 113 | High | 1 |
   | P002 | C-6 | 3.2 | 32% | 9 | 64 | High | 2 |
   | P003 | D-5 | 2.5 | 25% | 8 | 50 | Moderate | 5 |
   | P004 | E-3 | 1.8 | 18% | 6 | 28 | Low | 8 |
   | **Total** | **Various** | **2.8 avg** | **28% avg** | **8.8 avg** | **64 avg** | **Mixed** | **8 pits** |

   **Statistical Analysis Summary**
   | Statistic | Thickness (mm) | Wall Loss (mm) | Loss (%) | Notes |
   |-----------|----------------|----------------|----------|-------|
   | Minimum | 6.2 | 3.8 | 38% | Grid C-5, critical |
   | Maximum | 9.8 | 0.2 | 2% | Grid A-1, good condition |
   | Mean (μ) | 8.1 | 1.9 | 19% | Overall average |
   | Std Dev (σ) | 1.2 | 1.2 | 12% | High variability |
   | CV | 14.8% | 63% | 63% | Moderate variation |
   | 5th Percentile | 6.5 | 3.5 | 35% | Critical threshold |
   | 50th Percentile (Median) | 8.2 | 1.8 | 18% | Typical value |
   | 95th Percentile | 9.6 | 0.4 | 4% | Best condition |

   **Wall Loss Assessment by Zone**
   | Zone/Quadrant | Area (m²) | Min Thickness | Avg Thickness | Max Loss (%) | Pit Count | Risk Level | Action Required |
   |---------------|-----------|---------------|---------------|--------------|-----------|------------|-----------------|
   | North (A-C) | 2.5 | 7.8 mm | 8.9 mm | 22% | 2 | Low | Routine monitoring |
   | South (D-F) | 2.5 | 6.2 mm | 7.3 mm | 38% | 6 | High | Enhanced inspection |
   | East (1-4) | 2.5 | 7.2 mm | 8.5 mm | 28% | 3 | Medium | Monitor trend |
   | West (5-8) | 2.5 | 6.8 mm | 7.8 mm | 32% | 5 | High | Detailed assessment |

   **Risk Assessment & Critical Areas**
   | Area ID | Location | Min Thickness | Wall Loss % | Pit Density | Risk Score | Priority | Recommended Action | Timeline |
   |---------|----------|---------------|-------------|-------------|------------|----------|-------------------|----------|
   | CA-01 | C-5 to C-6 | 6.2 mm | 38% | 32/m² | 9.2/10 | Critical | Repair/replace | Immediate |
   | CA-02 | D-5 to E-5 | 6.8 mm | 32% | 24/m² | 7.5/10 | High | Engineering review | 30 days |
   | CA-03 | F-3 to F-4 | 7.2 mm | 28% | 16/m² | 6.1/10 | Medium | Enhanced monitoring | 90 days |

5. **Contextual Rationale**  
   - **ALWAYS cite specific image measurements and grid coordinates** in your corrosion analysis
   - Example: "The 6.2mm minimum thickness measured at grid location C-5 in the red zone of Image 1 represents 38% wall loss, the most severe corrosion observed..."
   - Explain measurement methodology and color scale interpretation
   - Justify statistical analysis and distribution characteristics
   - Address pit patterns and corrosion mechanisms
   - Detail risk assessment logic and prioritization criteria
   - Note data quality, coverage limitations, and validation needs

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all measurements, statistics, and assessments
   - Show **measurement uncertainty** and confidence levels
   - Include **grid coordinates** for all specific measurements
   - Use proper markdown table syntax with aligned columns
   - Thickness: 6.2 mm format
   - Percentages: 38% format
   - Densities: 32/m² format

7. **Critical Requirements**  
   - ✓ Lead with detailed corrosion map image analysis
   - ✓ Reference specific images and grid locations for all data
   - ✓ Calculate comprehensive thickness statistics from visual data
   - ✓ Identify and measure all significant pits with locations
   - ✓ Generate heatmap description with pattern analysis
   - ✓ Assess risk and prioritize critical areas
   - ✓ Validate against applicable corrosion assessment standards

8. **Corrosion Analysis Rules**  
   - Use color scale legends for accurate thickness readings
   - Apply grid coordinates for precise location referencing
   - Calculate statistics using complete dataset from map
   - Identify corrosion patterns and mechanisms
   - Account for measurement uncertainty and data density
   - Validate findings against expected corrosion behavior

9. **Tone & Output Style**  
   - Technical and analytical
   - Statistics-based assessment
   - Risk-focused prioritization
   - Data-driven recommendations
   - Standards-compliant evaluation

---

## Output Format

Generate the complete corrosion map analysis report following the structure above. Lead with your detailed image-based analysis and integrate statistical calculations throughout the assessment.
`
};
