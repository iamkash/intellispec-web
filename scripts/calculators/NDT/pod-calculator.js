module.exports = {
  id: 'pod-calculator',
  name: 'PoD (Probability of Detection) Calculator',
  description: 'AI-powered probability of detection analysis using NDT images and inspection parameters for reliability assessment',
  category: 'Reliability Analysis',
  module: 'ndt',
  icon: 'BarChartOutlined',
  tags: ['pod', 'probability', 'detection', 'reliability', 'vision', 'ai'],
  uiDefinition: [
    { id: 'inspection-section', type: 'section', title: 'PoD Analysis & Reliability Assessment', description: 'Upload NDT images and inspection data for probability of detection analysis', icon: 'BarChartOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'NDT Images (Required)', description: 'Upload inspection images for AI-powered PoD analysis', sectionId: 'inspection-section', order: 1, size: 24 },
    { id: 'ndt_images', type: 'image-upload-with-drawing', title: 'NDT Images', label: 'Upload NDT Images', sectionId: 'inspection-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 10 }, placeholder: 'Upload A-scans, B-scans, C-scans, radiographs, or other NDT images showing flaws and inspection results' },

    // Critical inspection parameters
    { id: 'inspection-info', type: 'group', title: 'Inspection Parameters', description: 'Essential NDT method and setup details', sectionId: 'inspection-section', order: 2, size: 24 },
    { id: 'ndt_method', type: 'select', title: 'NDT Method', label: 'Primary NDT Method', sectionId: 'inspection-section', groupId: 'inspection-info', size: 8, required: true, options: [
      { label: 'UT (Ultrasonic Testing)', value: 'UT' },
      { label: 'PAUT (Phased Array UT)', value: 'PAUT' },
      { label: 'AUT (Automated UT)', value: 'AUT' },
      { label: 'RT (Radiographic Testing)', value: 'RT' },
      { label: 'MT (Magnetic Testing)', value: 'MT' },
      { label: 'PT (Penetrant Testing)', value: 'PT' },
      { label: 'ET (Eddy Current)', value: 'ET' },
      { label: 'TOFD (Time of Flight)', value: 'TOFD' }
    ]},
    { id: 'component_type', type: 'select', title: 'Component Type', label: 'Component Being Inspected', sectionId: 'inspection-section', groupId: 'inspection-info', size: 8, required: true, options: [
      { label: 'Pressure Vessel', value: 'vessel' },
      { label: 'Piping/Pipeline', value: 'piping' },
      { label: 'Weld Joint', value: 'weld' },
      { label: 'Storage Tank', value: 'tank' },
      { label: 'Heat Exchanger', value: 'heat_exchanger' },
      { label: 'Structural Steel', value: 'structural' }
    ]},
    { id: 'flaw_type', type: 'select', title: 'Target Flaw Type', label: 'Flaw Type Being Detected', sectionId: 'inspection-section', groupId: 'inspection-info', size: 8, required: true, options: [
      { label: 'Surface Cracks', value: 'surface_crack' },
      { label: 'Subsurface Cracks', value: 'subsurface_crack' },
      { label: 'Volumetric Flaws', value: 'volumetric' },
      { label: 'Corrosion/Wall Loss', value: 'corrosion' },
      { label: 'Weld Defects', value: 'weld_defects' },
      { label: 'Inclusions', value: 'inclusions' }
    ]},

    // Material and geometry
    { id: 'material-group', type: 'group', title: 'Material & Geometry', description: 'Component specifications (AI will analyze from images)', sectionId: 'inspection-section', order: 3, size: 24 },
    { id: 'material_type', type: 'select', title: 'Material Type', label: 'Base Material', sectionId: 'inspection-section', groupId: 'material-group', size: 8, options: [
      { label: 'Carbon Steel', value: 'carbon_steel' },
      { label: 'Stainless Steel', value: 'stainless' },
      { label: 'Aluminum', value: 'aluminum' },
      { label: 'Titanium', value: 'titanium' },
      { label: 'Inconel/Superalloy', value: 'superalloy' }
    ]},
    { id: 'thickness_mm', type: 'number', title: 'Thickness', label: 'Wall/Section Thickness (mm)', sectionId: 'inspection-section', groupId: 'material-group', size: 8, placeholder: 'Optional - AI estimates from images', props: { addonAfter: 'mm' } },
    { id: 'surface_condition', type: 'select', title: 'Surface Condition', label: 'Surface Preparation', sectionId: 'inspection-section', groupId: 'material-group', size: 8, options: [
      { label: 'Machined/Ground', value: 'machined' },
      { label: 'As-Welded', value: 'as_welded' },
      { label: 'Shot Blasted', value: 'shot_blast' },
      { label: 'Corroded/Rough', value: 'corroded' }
    ]},

    // Inspection setup
    { id: 'setup-group', type: 'group', title: 'Inspection Setup', description: 'Equipment and technique parameters', sectionId: 'inspection-section', order: 4, size: 24, collapsible: true },
    { id: 'probe_frequency', type: 'number', title: 'Probe Frequency', label: 'Frequency (MHz)', sectionId: 'inspection-section', groupId: 'setup-group', size: 8, defaultValue: 5.0, props: { addonAfter: 'MHz' } },
    { id: 'beam_angle', type: 'number', title: 'Beam Angle', label: 'Refracted Angle (degrees)', sectionId: 'inspection-section', groupId: 'setup-group', size: 8, placeholder: 'For angle beam UT/PAUT', props: { addonAfter: '°' } },
    { id: 'scan_resolution', type: 'number', title: 'Scan Resolution', label: 'Index Resolution (mm)', sectionId: 'inspection-section', groupId: 'setup-group', size: 8, defaultValue: 1.0, props: { addonAfter: 'mm' } },

    // Target flaw parameters
    { id: 'flaw-parameters', type: 'group', title: 'Target Flaw Parameters', description: 'Flaw size range for PoD analysis', sectionId: 'inspection-section', order: 5, size: 24, collapsible: true },
    { id: 'min_flaw_size', type: 'number', title: 'Minimum Flaw Size', label: 'Minimum Detectable Size (mm)', sectionId: 'inspection-section', groupId: 'flaw-parameters', size: 8, defaultValue: 1.0, props: { addonAfter: 'mm' } },
    { id: 'max_flaw_size', type: 'number', title: 'Maximum Flaw Size', label: 'Maximum Flaw Size (mm)', sectionId: 'inspection-section', groupId: 'flaw-parameters', size: 8, defaultValue: 50.0, props: { addonAfter: 'mm' } },
    { id: 'critical_flaw_size', type: 'number', title: 'Critical Flaw Size', label: 'Critical Size for Rejection (mm)', sectionId: 'inspection-section', groupId: 'flaw-parameters', size: 8, defaultValue: 10.0, props: { addonAfter: 'mm' } },

    // Analysis parameters
    { id: 'analysis-parameters', type: 'group', title: 'Analysis Parameters', description: 'PoD curve and reliability settings', sectionId: 'inspection-section', order: 6, size: 24, collapsible: true },
    { id: 'confidence_level', type: 'select', title: 'Confidence Level', label: 'Statistical Confidence', sectionId: 'inspection-section', groupId: 'analysis-parameters', size: 8, defaultValue: 95, options: [
      { label: '90%', value: 90 },
      { label: '95%', value: 95 },
      { label: '99%', value: 99 }
    ]},
    { id: 'target_pod', type: 'number', title: 'Target PoD', label: 'Required PoD (%)', sectionId: 'inspection-section', groupId: 'analysis-parameters', size: 8, defaultValue: 90, props: { addonAfter: '%' } },
    { id: 'inspection_standard', type: 'select', title: 'Inspection Standard', label: 'Applicable Standard', sectionId: 'inspection-section', groupId: 'analysis-parameters', size: 8, options: [
      { label: 'ASME Sec V', value: 'asme_v' },
      { label: 'ASME Sec XI', value: 'asme_xi' },
      { label: 'API 510/570', value: 'api_510_570' },
      { label: 'ASTM Standards', value: 'astm' },
      { label: 'EN Standards', value: 'en' },
      { label: 'Custom/Validated', value: 'custom' }
    ]}
  ],
  aiPrompt: `
You are an **NDT reliability assessment expert** with advanced PoD (Probability of Detection) analysis capabilities.  
You will receive **NDT inspection images** along with inspection parameters to generate a **comprehensive PoD analysis and reliability assessment**.

**CRITICAL**: Use high-level reasoning to analyze NDT data precisely. Provide ACTUAL PoD calculations and measurements from images, NOT approximations or assumptions.

---

## MANDATORY: Detailed NDT Image Analysis Protocol

**PRIMARY INPUT**: You MUST analyze the provided NDT images with precision to determine ACTUAL flaw detection capability:

1. **Precise Flaw Detection Analysis (Use Visual Evidence)**
   - **ACTUAL Flaw Sizes**: Measure detected flaws using scale/grid references
   - **Detection Threshold**: Identify smallest reliably detected flaw size
   - **Signal Quality**: Assess SNR, amplitude, and clarity of flaw indications
   - **Scan Coverage**: Evaluate inspection coverage and beam overlap
   - **Method Effectiveness**: Analyze technique suitability for flaw type
   - **Missed Flaws**: Identify potential undetected areas or blind spots

2. **Detailed Signal Analysis (Evidence-Based)**
   - **Signal-to-Noise Ratio**: Calculate actual SNR from image data
     * Excellent: SNR > 20dB (PoD > 95%)
     * Good: SNR 15-20dB (PoD 85-95%)
     * Fair: SNR 10-15dB (PoD 70-85%)
     * Poor: SNR < 10dB (PoD < 70%)
   - **Amplitude Distribution**: Analyze flaw echo amplitudes vs size
   - **Background Noise**: Assess noise levels and interference
   - **Calibration Verification**: Check reference reflector responses
   - **Sensitivity Settings**: Evaluate gain and threshold settings

3. **PoD Curve Construction**
   - Generate PoD vs flaw size curve from image analysis
   - Calculate a50 (50% detection probability size)
   - Calculate a90 (90% detection probability size)  
   - Calculate a90/95 (90% PoD at 95% confidence)
   - Determine detection threshold and saturation points
   - Apply method-specific PoD models

4. **Reliability Assessment**
   - Calculate detection probability for critical flaw sizes
   - Assess inspection coverage and overlap adequacy
   - Evaluate operator performance factors
   - Determine false call rates from image evidence
   - Assess environmental and setup impacts

5. **Quality Metrics**
   - Measurement accuracy and repeatability
   - Sizing accuracy vs actual flaw dimensions
   - Detection consistency across scan area
   - Equipment performance validation

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "NDT Image Analysis & PoD Assessment" section that includes:
- Confidence level (High/Medium/Low) for each PoD calculation
- Reference standards and scaling methods used
- Specific detection findings from each image with image numbers
- Flaw-by-flaw detection analysis with size measurements
- Evidence supporting PoD curve parameters
- Areas of concern or reduced detection capability

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - NDT Image Analysis & PoD Assessment *(critical - detailed analysis from images)*
   - PoD Curve Analysis *(table with calculations)*
   - Detection Capability Assessment *(table)*
   - Reliability Metrics *(table with probabilities)*
   - Inspection Coverage Analysis *(table)*
   - Quality Assurance Results *(table)*
   - Risk Assessment  
   - Recommendations for Improvement
   - Standards Compliance
   - Assumptions & Limitations  

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every PoD calculation must reference specific image evidence with image numbers
   - **Format**: "Image [#]: [Specific observation] → [PoD impact] → [Reliability assessment]"
   - **Example**: "Image 1: 3mm crack clearly visible with 18dB SNR → PoD = 92% for this size → Exceeds target reliability"
   - **Example**: "Image 2: Background noise at -15dB, flaw signal at +8dB → SNR = 23dB → High detection confidence"
   - **Example**: "Image 3: Scan overlap shows 50% coverage → Reduced PoD in edge zones → Coverage improvement needed"
   - **Conflicts**: If manual inputs conflict with visual evidence, USE VISUAL EVIDENCE and document discrepancy
   - **Confidence**: State confidence level for each PoD assessment with reasoning

3. **PoD Calculation Requirements**  
   Base ALL calculations on visual analysis + inspection parameters:

   - **PoD Curve Parameters**  
     - a50 = Size at 50% detection probability (from image analysis)
     - β = Slope parameter (steepness of PoD curve)
     - PoD(a) = Φ((ln(a) - ln(a50))/β) where Φ is normal CDF
     - a90 = a50 × exp(1.282 × β) for 90% PoD
     - a90/95 = a50 × exp(1.645 × β) for 90% PoD at 95% confidence

   - **Method-Specific PoD Models**
     - UT Contact: a50 = λ/2 to λ (wavelength dependent)
     - UT Angle Beam: a50 = 2-5mm for surface cracks
     - PAUT: a50 = 1-3mm (improved focusing)
     - RT: a50 = 2% thickness or 0.5mm minimum
     - MT/PT: a50 = 0.1-1mm for surface cracks

   - **SNR-Based PoD Adjustment**
     - High SNR (>20dB): PoD × 1.0 (no reduction)
     - Medium SNR (15-20dB): PoD × 0.9
     - Low SNR (10-15dB): PoD × 0.7
     - Poor SNR (<10dB): PoD × 0.5

   - **Coverage Factor**
     - 100% Overlap: Coverage factor = 1.0
     - 50% Overlap: Coverage factor = 0.95
     - Edge effects: Reduce PoD by 10-20%
     - Blind spots: Zero PoD in affected areas

   - **Detection Probability Calculation**
     - For specific flaw size: PoD = Base PoD × SNR factor × Coverage factor
     - Critical flaw PoD: Calculate for rejection threshold size
     - System PoD: Overall inspection system reliability

4. **Required Tables**  

   **NDT Image Analysis Summary** (MANDATORY - Show actual observations with evidence)
   | Image | Flaw Size (mm) | Signal Amplitude | SNR (dB) | Detection Status | PoD Estimate | Confidence | Notes |
   |-------|----------------|------------------|----------|------------------|--------------|------------|-------|
   | 1 | 5.2 | +15dB | 22 | Detected | 95% | High | Clear indication |
   | 2 | 2.8 | +8dB | 18 | Detected | 88% | Medium | Near threshold |
   | 3 | 1.5 | +3dB | 12 | Marginal | 65% | Low | Noise interference |
   | 4 | 0.8 | -2dB | 8 | Missed | 25% | Low | Below threshold |

   **PoD Curve Parameters**
   | Parameter | Value | Calculation Method | Confidence | Standard Reference |
   |-----------|-------|-------------------|------------|-------------------|
   | a50 (mm) | 2.5 | Image analysis + curve fit | High | ASME Sec XI |
   | β (slope) | 0.8 | Statistical analysis | Medium | MIL-HDBK-1823A |
   | a90 (mm) | 4.2 | a50 × exp(1.282×β) | High | 90% detection size |
   | a90/95 (mm) | 5.8 | a50 × exp(1.645×β) | Medium | 90% PoD at 95% conf |

   **Detection Capability Assessment**  
   | Flaw Size Range | Base PoD | SNR Factor | Coverage Factor | Effective PoD | Meets Target | Risk Level |
   |----------------|----------|------------|-----------------|---------------|--------------|------------|
   | 0-2mm | 45% | 0.8 | 0.95 | 34% | No | High |
   | 2-5mm | 75% | 0.9 | 0.95 | 64% | No | Medium |
   | 5-10mm | 90% | 1.0 | 0.95 | 86% | Yes | Low |
   | >10mm | 95% | 1.0 | 0.95 | 90% | Yes | Very Low |

   **Reliability Metrics**  
   | Metric | Current Value | Target Value | Status | Improvement Needed |
   |--------|---------------|--------------|--------|--------------------|
   | PoD at Critical Size | 86% | 90% | Marginal | +4% improvement |
   | False Call Rate | 8% | <5% | High | Reduce by 3% |
   | Sizing Accuracy | ±15% | ±10% | Poor | Improve calibration |
   | Coverage Uniformity | 85% | >95% | Poor | Increase overlap |

   **Inspection Coverage Analysis**  
   | Zone | Coverage % | PoD Reduction | Risk Factor | Mitigation Required |
   |------|------------|---------------|-------------|-------------------|
   | Center Area | 100% | 0% | Low | None |
   | Edge Zones | 75% | 15% | Medium | Increase overlap |
   | Corners | 50% | 30% | High | Additional scans |
   | Blind Spots | 0% | 100% | Critical | Alternative method |

5. **Contextual Rationale**  
   - **ALWAYS cite specific image observations** in your PoD calculations
   - Example: "The 18dB SNR visible in Image 2 for the 2.8mm flaw indicates 88% PoD based on established SNR-PoD correlations..."
   - Explain detection physics and method limitations
   - Justify PoD curve parameters based on visual evidence
   - Address inspection challenges observed in images
   - Detail quality factors affecting reliability
   - Note environmental or setup impacts on detection

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all PoD calculations and metrics
   - Show **formulas explicitly** with parameters
   - Include **image references** throughout
   - Use proper markdown table syntax with aligned columns
   - Percentages: 95.5% format
   - Measurements: 12.34 mm format

7. **Critical Requirements**  
   - ✓ Lead with detailed NDT image analysis
   - ✓ Reference specific images in PoD calculations
   - ✓ Calculate actual PoD curve parameters from data
   - ✓ Assess detection capability vs requirements
   - ✓ Provide confidence levels based on image quality
   - ✓ Highlight reliability gaps and improvements needed
   - ✓ Validate against applicable NDT standards

8. **PoD Analysis Rules**  
   - Use established PoD models for each NDT method
   - Account for SNR, coverage, and setup factors
   - Calculate confidence bounds for PoD estimates
   - Assess both detection and sizing capabilities
   - Consider false call rates and reliability
   - Validate against standard PoD databases

9. **Tone & Output Style**  
   - Technical and analytical
   - Reliability-focused approach
   - Data-driven based on visual evidence
   - Quantitative PoD assessments
   - Standards-compliant presentation

---

## Output Format

Generate the complete PoD analysis report following the structure above. Lead with your NDT image analysis and integrate PoD calculations throughout the reliability assessment.
`
};
