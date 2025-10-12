module.exports = {
  id: 'wall-loss-remaining-life-calculator',
  name: 'Wall Loss & Remaining Life Calculator',
  description: 'AI-powered corrosion assessment using NDT images for wall loss analysis, corrosion rate calculation, and remaining life projection',
  category: 'Asset Integrity',
  module: 'ndt',
  icon: 'ClockCircleOutlined',
  tags: ['corrosion', 'wall-loss', 'remaining-life', 'asset-integrity', 'vision'],
  uiDefinition: [
    { id: 'corrosion-section', type: 'section', title: 'Wall Loss & Remaining Life Analysis', description: 'Upload thickness measurement images for corrosion assessment and life prediction', icon: 'ClockCircleOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Thickness Measurement Images (Required)', description: 'Upload thickness maps, C-scans, or corrosion survey images', sectionId: 'corrosion-section', order: 1, size: 24 },
    { id: 'thickness_images', type: 'image-upload-with-drawing', title: 'Thickness Images', label: 'Upload Thickness Images', sectionId: 'corrosion-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 12 }, placeholder: 'Upload C-scans, thickness maps, corrosion survey images, or visual corrosion photos showing wall loss patterns' },

    // Critical assessment parameters
    { id: 'assessment-parameters', type: 'group', title: 'Assessment Parameters', description: 'Essential corrosion assessment details', sectionId: 'corrosion-section', order: 2, size: 24 },
    { id: 'ndt_method', type: 'select', title: 'NDT Method', label: 'Thickness Measurement Method', sectionId: 'corrosion-section', groupId: 'assessment-parameters', size: 8, required: true, options: [
      { label: 'UT (Ultrasonic Testing)', value: 'UT' },
      { label: 'PAUT (Phased Array UT)', value: 'PAUT' },
      { label: 'AUT (Automated UT)', value: 'AUT' },
      { label: 'MFL (Magnetic Flux Leakage)', value: 'MFL' },
      { label: 'RT (Radiographic Testing)', value: 'RT' },
      { label: 'Visual Assessment', value: 'VT' }
    ]},
    { id: 'corrosion_type', type: 'select', title: 'Corrosion Type', label: 'Primary Corrosion Mechanism', sectionId: 'corrosion-section', groupId: 'assessment-parameters', size: 8, required: true, options: [
      { label: 'General/Uniform Corrosion', value: 'general' },
      { label: 'Localized Pitting', value: 'pitting' },
      { label: 'Crevice Corrosion', value: 'crevice' },
      { label: 'Galvanic Corrosion', value: 'galvanic' },
      { label: 'Erosion-Corrosion', value: 'erosion' },
      { label: 'MIC (Microbiological)', value: 'mic' }
    ]},
    { id: 'assessment_standard', type: 'select', title: 'Assessment Standard', label: 'Evaluation Code', sectionId: 'corrosion-section', groupId: 'assessment-parameters', size: 8, required: true, options: [
      { label: 'API 579-1/ASME FFS-1', value: 'api579' },
      { label: 'API 570 (Piping)', value: 'api570' },
      { label: 'API 510 (Vessels)', value: 'api510' },
      { label: 'ASME B31.3 (Process)', value: 'b313' },
      { label: 'NACE SP0169', value: 'nace_sp0169' }
    ]},

    // Component specifications
    { id: 'component-specs', type: 'group', title: 'Component Information', description: 'Component and service details (AI analyzes from images)', sectionId: 'corrosion-section', order: 3, size: 24 },
    { id: 'component_type', type: 'select', title: 'Component Type', label: 'Equipment Type', sectionId: 'corrosion-section', groupId: 'component-specs', size: 8, options: [
      { label: 'Pressure Vessel', value: 'vessel' },
      { label: 'Piping System', value: 'piping' },
      { label: 'Storage Tank', value: 'tank' },
      { label: 'Heat Exchanger', value: 'heat_exchanger' },
      { label: 'Reactor', value: 'reactor' }
    ]},
    { id: 'nominal_thickness', type: 'number', title: 'Nominal Thickness', label: 'Original Thickness (mm)', sectionId: 'corrosion-section', groupId: 'component-specs', size: 8, placeholder: 'AI estimates from images', props: { addonAfter: 'mm' } },
    { id: 'corrosion_allowance', type: 'number', title: 'Corrosion Allowance', label: 'Design CA (mm)', sectionId: 'corrosion-section', groupId: 'component-specs', size: 8, defaultValue: 3.0, props: { addonAfter: 'mm' } },

    // Current measurements
    { id: 'current-measurements', type: 'group', title: 'Current Measurements', description: 'Latest thickness measurements (AI will verify from images)', sectionId: 'corrosion-section', order: 4, size: 24, collapsible: true },
    { id: 'minimum_thickness', type: 'number', title: 'Minimum Thickness', label: 'Current Minimum (mm)', sectionId: 'corrosion-section', groupId: 'current-measurements', size: 8, placeholder: 'AI measures from images', props: { addonAfter: 'mm' } },
    { id: 'average_thickness', type: 'number', title: 'Average Thickness', label: 'Area Average (mm)', sectionId: 'corrosion-section', groupId: 'current-measurements', size: 8, placeholder: 'AI calculates from images', props: { addonAfter: 'mm' } },
    { id: 'inspection_date', type: 'date', title: 'Inspection Date', label: 'Current Inspection Date', sectionId: 'corrosion-section', groupId: 'current-measurements', size: 8, required: true },

    // Historical data
    { id: 'historical-data', type: 'group', title: 'Historical Data', description: 'Previous inspection data for rate calculation', sectionId: 'corrosion-section', order: 5, size: 24, collapsible: true },
    { id: 'has_historical', type: 'switch', title: 'Historical Data Available', label: 'Previous inspection data available', sectionId: 'corrosion-section', groupId: 'historical-data', size: 12, defaultValue: false },
    { id: 'previous_inspection_date', type: 'date', title: 'Previous Inspection', label: 'Prior Inspection Date', sectionId: 'corrosion-section', groupId: 'historical-data', size: 8, watchField: 'has_historical', showWhen: [true] },
    { id: 'previous_minimum_thickness', type: 'number', title: 'Previous Minimum', label: 'Previous Min Thickness (mm)', sectionId: 'corrosion-section', groupId: 'historical-data', size: 8, watchField: 'has_historical', showWhen: [true], props: { addonAfter: 'mm' } },
    { id: 'baseline_thickness', type: 'number', title: 'Baseline Thickness', label: 'Original/Baseline (mm)', sectionId: 'corrosion-section', groupId: 'historical-data', size: 8, watchField: 'has_historical', showWhen: [true], props: { addonAfter: 'mm' } },

    // Operating conditions
    { id: 'operating-conditions', type: 'group', title: 'Operating Conditions', description: 'Service environment affecting corrosion rate', sectionId: 'corrosion-section', order: 6, size: 24, collapsible: true },
    { id: 'service_environment', type: 'select', title: 'Service Environment', label: 'Operating Environment', sectionId: 'corrosion-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'Crude Oil Service', value: 'crude_oil' },
      { label: 'Refined Products', value: 'refined' },
      { label: 'Sour Service (H2S)', value: 'sour' },
      { label: 'Seawater/Marine', value: 'seawater' },
      { label: 'High Temperature', value: 'high_temp' },
      { label: 'Caustic Service', value: 'caustic' }
    ]},
    { id: 'operating_temperature', type: 'number', title: 'Operating Temperature', label: 'Service Temperature (°C)', sectionId: 'corrosion-section', groupId: 'operating-conditions', size: 8, defaultValue: 60, props: { addonAfter: '°C' } },
    { id: 'corrosion_protection', type: 'select', title: 'Corrosion Protection', label: 'Protection Systems', sectionId: 'corrosion-section', groupId: 'operating-conditions', size: 8, options: [
      { label: 'None', value: 'none' },
      { label: 'Corrosion Inhibitor', value: 'inhibitor' },
      { label: 'Cathodic Protection', value: 'cathodic' },
      { label: 'Protective Coating', value: 'coating' },
      { label: 'Multiple Systems', value: 'multiple' }
    ]},

    // Analysis parameters
    { id: 'analysis-parameters', type: 'group', title: 'Analysis Parameters', description: 'Life assessment and reliability parameters', sectionId: 'corrosion-section', order: 7, size: 24, collapsible: true },
    { id: 'safety_factor', type: 'number', title: 'Safety Factor', label: 'Additional Safety Factor', sectionId: 'corrosion-section', groupId: 'analysis-parameters', size: 8, defaultValue: 1.0, step: 0.1 },
    { id: 'target_reliability', type: 'number', title: 'Target Reliability', label: 'Required Reliability (%)', sectionId: 'corrosion-section', groupId: 'analysis-parameters', size: 8, defaultValue: 95, props: { addonAfter: '%' } },
    { id: 'economic_life', type: 'number', title: 'Economic Life', label: 'Planned Service Life (years)', sectionId: 'corrosion-section', groupId: 'analysis-parameters', size: 8, defaultValue: 20, props: { addonAfter: 'years' } }
  ],
  aiPrompt: `
You are an **asset integrity specialist** with advanced corrosion assessment and remaining life analysis capabilities using AI vision.  
You will receive **thickness measurement images** along with component data to generate **comprehensive wall loss analysis, corrosion rate calculation, and remaining life projection**.

**CRITICAL**: Use high-level reasoning to analyze thickness data and corrosion patterns precisely. Provide ACTUAL corrosion rates and life predictions from images, NOT approximations or assumptions.

---

## MANDATORY: Detailed Corrosion Analysis Protocol

**PRIMARY INPUT**: You MUST analyze the provided thickness images with precision to determine ACTUAL wall loss and corrosion characteristics:

1. **Precise Thickness Analysis (Use Visual Scale References)**
   - **ACTUAL Thickness Measurements**: Read thickness values from C-scan color scales
   - **Wall Loss Mapping**: Identify areas of maximum and minimum thickness
   - **Corrosion Pattern Analysis**: Assess distribution (general, localized, pitting)
   - **Statistical Analysis**: Calculate mean, minimum, standard deviation
   - **Coverage Assessment**: Evaluate measurement density and coverage
   - **Data Quality**: Assess measurement reliability and accuracy

2. **Advanced Corrosion Rate Calculation (Evidence-Based)**
   - **Historical Rate Analysis**: Calculate rates from multiple inspection intervals
     * Linear rate: CR = (t₁ - t₂) / (T₂ - T₁) mm/year
     * Exponential rate: CR = -ln(t₂/t₁) / (T₂ - T₁) for accelerating corrosion
     * Statistical rate: Use regression analysis for multiple data points
   - **Service-Based Rate Estimation**: Apply industry corrosion rate data
     * Crude oil: 0.05-0.15 mm/year typical
     * Sour service: 0.2-0.8 mm/year depending on H2S content
     * Seawater: 0.1-0.4 mm/year depending on velocity
     * High temperature: Exponential increase with temperature
   - **Environmental Factor Corrections**: Apply environmental multipliers
     * Temperature effects: Arrhenius relationship
     * Chemical composition effects (H2S, CO2, chlorides)
     * Flow velocity effects (erosion-corrosion)
     * Protection system effectiveness

3. **Remaining Life Calculation**
   - **Required Thickness Determination**: Calculate minimum allowable thickness
     * Pressure design: t_req = PR/(SE-0.6P) per ASME
     * Structural requirements: Based on loads and stresses
     * Retirement thickness: Max(t_req, t_min_structural)
   - **Available Corrosion**: Calculate remaining metal available
     * Available = t_current - t_retirement
     * Conservative approach: Use minimum measured thickness
   - **Life Projection**: Calculate remaining service life
     * Remaining life = Available corrosion / Corrosion rate
     * Conservative life: Use upper bound corrosion rate
     * Probabilistic life: Include uncertainty analysis

4. **Risk Assessment**
   - **Failure Probability**: Assess probability of wall loss exceeding limits
   - **Consequence Analysis**: Evaluate failure consequences
   - **Risk Ranking**: Combine probability and consequence
   - **Inspection Interval**: Optimize based on risk and remaining life

5. **Quality Assurance**
   - **Measurement Uncertainty**: Quantify thickness measurement accuracy
   - **Rate Uncertainty**: Assess corrosion rate prediction reliability
   - **Model Validation**: Compare predictions with industry experience
   - **Confidence Levels**: Statistical confidence in predictions

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Thickness Analysis & Corrosion Assessment" section that includes:
- Confidence level (High/Medium/Low) for each measurement and calculation
- Scale readings and measurement methods from images
- Specific thickness findings from each image with locations
- Corrosion pattern analysis with evidence
- Rate calculation methodology and reliability
- Areas requiring additional monitoring or assessment

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Thickness Analysis & Corrosion Assessment *(critical - detailed analysis from images)*
   - Wall Loss Results *(table with measurements)*
   - Corrosion Rate Analysis *(table)*
   - Remaining Life Calculation *(table)*
   - Risk Assessment *(table)*
   - Inspection Planning *(table)*
   - Fitness-for-Service Evaluation
   - Recommendations & Mitigation
   - Standards Compliance
   - Assumptions & Limitations  

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every thickness measurement must reference specific image evidence
   - **Format**: "Image [#]: [Specific measurement] → [Corrosion assessment] → [Life impact]"
   - **Example**: "Image 1: Minimum thickness 8.2mm in grid location C-5 → 18% wall loss → 12 years remaining life"
   - **Example**: "Image 2: Pitting pattern shows 5mm deep pits → Localized attack → Engineering evaluation required"
   - **Example**: "Image 3: Color scale shows thickness range 6.8-12.1mm → General thinning pattern → 0.15mm/year rate"
   - **Conflicts**: If manual inputs conflict with visual evidence, USE VISUAL EVIDENCE and document discrepancy
   - **Confidence**: State confidence level for each measurement and calculation with reasoning

3. **Corrosion Calculation Requirements**  
   Base ALL calculations on visual analysis + service parameters:

   - **Wall Loss Calculations**
     - Absolute loss: Loss = t_nominal - t_current
     - Percentage loss: Loss% = (Loss / t_nominal) × 100
     - Remaining thickness: t_remaining = t_current - t_retirement
     - Through-wall percentage: TW% = (Loss / t_nominal) × 100

   - **Corrosion Rate Formulas**
     - Linear rate: CR = Δt / Δtime (mm/year)
     - Service-adjusted rate: CR_adj = CR_base × Environmental_factors
     - Temperature correction: CR_T = CR_ref × exp[(E/R)(1/T_ref - 1/T)]
     - Statistical rate: Use regression analysis for trend

   - **Remaining Life Calculations**
     - Simple life: RL = (t_current - t_retirement) / CR
     - Conservative life: RL = (t_min - t_retirement) / CR_upper
     - Probabilistic life: Include uncertainty distributions
     - Inspection interval: II = RL × Risk_factor (typically 0.25-0.5)

   - **Environmental Factors**
     - Sour service (H2S): 2-5× base rate
     - High temperature: Exponential increase
     - High velocity: 1.5-3× base rate
     - Protection systems: 0.3-0.7× reduction factor

4. **Required Tables**  

   **Thickness Analysis Results** (MANDATORY - Show actual measurements with evidence)
   | Image | Location | Current (mm) | Original (mm) | Loss (mm) | Loss (%) | Pattern | Confidence | Notes |
   |-------|----------|--------------|---------------|-----------|----------|---------|------------|-------|
   | 1 | Grid A-3 | 8.2 | 10.0 | 1.8 | 18% | General | High | Uniform thinning |
   | 1 | Grid C-5 | 7.8 | 10.0 | 2.2 | 22% | General | High | Minimum area |
   | 2 | Pit area | 5.0 | 10.0 | 5.0 | 50% | Pitting | Medium | Deep localized |
   | 3 | Average | 8.9 | 10.0 | 1.1 | 11% | General | High | Statistical |

   **Corrosion Rate Analysis**
   | Calculation Method | Rate (mm/year) | Confidence | Data Source | Applicability | Uncertainty | Notes |
   |-------------------|----------------|------------|-------------|---------------|-------------|-------|
   | Historical Data | 0.12 | High | 2 inspections | Direct | ±0.02 | 5-year interval |
   | Service-Based | 0.15 | Medium | Industry data | Crude oil service | ±0.05 | Conservative |
   | Environmental | 0.18 | Medium | Adjusted rate | H2S correction | ±0.06 | Sour service |
   | **Recommended** | **0.15** | **High** | **Conservative** | **Design basis** | **±0.03** | **Upper bound** |

   **Remaining Life Assessment**
   | Parameter | Current Value | Retirement Value | Available | Rate (mm/year) | Life (years) | Confidence |
   |-----------|---------------|------------------|-----------|----------------|--------------|------------|
   | Minimum Thickness | 7.8 mm | 5.2 mm | 2.6 mm | 0.15 | 17.3 | High |
   | Average Thickness | 8.9 mm | 5.2 mm | 3.7 mm | 0.15 | 24.7 | High |
   | Conservative | 7.8 mm | 5.2 mm | 2.6 mm | 0.18 | 14.4 | Medium |
   | **Design Basis** | **7.8 mm** | **5.2 mm** | **2.6 mm** | **0.15** | **17.3** | **High** |

   **Risk Assessment Matrix**
   | Risk Factor | Current Status | Threshold | Risk Level | Time to Threshold | Action Required |
   |-------------|----------------|-----------|------------|-------------------|-----------------|
   | Wall Loss % | 22% | 50% | Low | 15+ years | Routine monitoring |
   | Remaining Life | 17.3 years | 5 years | Low | 12+ years | Continue service |
   | Corrosion Rate | 0.15 mm/year | 0.5 mm/year | Low | Stable | Monitor trend |
   | Pitting Severity | Moderate | Severe | Medium | 5-8 years | Enhanced inspection |

   **Inspection Planning**
   | Parameter | Current | Next Inspection | Interval | Method | Coverage | Rationale |
   |-----------|---------|----------------|----------|--------|----------|-----------|
   | Routine Inspection | 2024 | 2027 | 3 years | UT grid | 100% | Low risk, stable rate |
   | Pit Monitoring | 2024 | 2025 | 1 year | Detailed UT | Pit areas | Localized attack |
   | Engineering Review | - | 2029 | 5 years | Assessment | Full component | Mid-life evaluation |

5. **Contextual Rationale**  
   - **ALWAYS cite specific image measurements** in your corrosion analysis
   - Example: "The 8.2mm minimum thickness measured from the color scale in Image 1 at grid location C-5 represents 18% wall loss..."
   - Explain corrosion rate calculation methodology and reliability
   - Justify remaining life projections based on visual evidence
   - Address measurement limitations and uncertainty sources
   - Detail environmental factors affecting corrosion
   - Note inspection and mitigation recommendations

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all thickness data and calculations
   - Show **measurement uncertainty** explicitly (±values)
   - Include **image references** and grid locations
   - Use proper markdown table syntax with aligned columns
   - Thickness: 8.2 mm format
   - Rates: 0.15 mm/year format
   - Life: 17.3 years format

7. **Critical Requirements**  
   - ✓ Lead with detailed thickness image analysis
   - ✓ Reference specific images and locations for all measurements
   - ✓ Calculate actual corrosion rates from available data
   - ✓ Project remaining life with uncertainty bounds
   - ✓ Assess risk and recommend inspection intervals
   - ✓ Evaluate fitness-for-service per applicable standards
   - ✓ Provide actionable recommendations for asset management

8. **Corrosion Analysis Rules**  
   - Use appropriate corrosion models for service environment
   - Apply statistical methods for rate calculation when multiple data points available
   - Consider environmental factors and protection system effectiveness
   - Account for measurement uncertainty in life predictions
   - Validate predictions against industry experience
   - Document assumptions and limitations clearly

9. **Tone & Output Style**  
   - Technical and analytical
   - Asset integrity focused
   - Risk-based approach
   - Conservative life predictions
   - Actionable recommendations

---

## Output Format

Generate the complete wall loss and remaining life report following the structure above. Lead with your thickness image analysis and integrate corrosion calculations throughout the assessment.
`
};
