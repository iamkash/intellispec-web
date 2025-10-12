module.exports = {
  id: 'flaw-sizing-calculator',
  name: 'Flaw Sizing Calculator (UT/PAUT/AUT/RT)',
  description: 'AI-powered comprehensive flaw sizing using NDT images for crack depth, length, orientation, and defect area analysis',
  category: 'Critical Analysis',
  module: 'ndt',
  icon: 'ExpandAltOutlined',
  tags: ['flaw', 'sizing', 'crack', 'defect', 'measurement', 'vision'],
  uiDefinition: [
    { id: 'sizing-section', type: 'section', title: 'Flaw Sizing & Measurement Analysis', description: 'Upload NDT images for AI-powered flaw sizing and dimensional analysis', icon: 'ExpandAltOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'NDT Images for Sizing (Required)', description: 'Upload NDT images showing flaws for dimensional analysis', sectionId: 'sizing-section', order: 1, size: 24 },
    { id: 'flaw_images', type: 'image-upload-with-drawing', title: 'Flaw Images', label: 'Upload Flaw Images', sectionId: 'sizing-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 10 }, placeholder: 'Upload A-scans, B-scans, C-scans, radiographs, or other NDT images clearly showing flaws with measurement scales or references' },

    // Critical sizing parameters
    { id: 'sizing-parameters', type: 'group', title: 'Sizing Parameters', description: 'Essential NDT method and measurement details', sectionId: 'sizing-section', order: 2, size: 24 },
    { id: 'ndt_method', type: 'select', title: 'NDT Method', label: 'Primary Sizing Method', sectionId: 'sizing-section', groupId: 'sizing-parameters', size: 8, required: true, options: [
      { label: 'UT (Ultrasonic Testing)', value: 'UT' },
      { label: 'PAUT (Phased Array UT)', value: 'PAUT' },
      { label: 'AUT (Automated UT)', value: 'AUT' },
      { label: 'RT (Radiographic Testing)', value: 'RT' },
      { label: 'TOFD (Time of Flight)', value: 'TOFD' },
      { label: 'Combined Methods', value: 'combined' }
    ]},
    { id: 'sizing_technique', type: 'select', title: 'Sizing Technique', label: 'Measurement Technique', sectionId: 'sizing-section', groupId: 'sizing-parameters', size: 8, required: true, options: [
      { label: '6dB Drop Method', value: '6db_drop' },
      { label: '20dB Drop Method', value: '20db_drop' },
      { label: 'Tip Diffraction (TOFD)', value: 'tip_diffraction' },
      { label: 'Maximum Amplitude', value: 'max_amplitude' },
      { label: 'Crack Tip Echo', value: 'crack_tip' },
      { label: 'Film Density (RT)', value: 'film_density' },
      { label: 'Digital Analysis', value: 'digital_analysis' }
    ]},
    { id: 'flaw_type', type: 'select', title: 'Flaw Type', label: 'Primary Flaw Type', sectionId: 'sizing-section', groupId: 'sizing-parameters', size: 8, required: true, options: [
      { label: 'Surface Breaking Crack', value: 'surface_crack' },
      { label: 'Embedded Crack', value: 'embedded_crack' },
      { label: 'Through-Wall Crack', value: 'through_crack' },
      { label: 'Corrosion/Wall Loss', value: 'corrosion' },
      { label: 'Weld Defect', value: 'weld_defect' },
      { label: 'Inclusion/Slag', value: 'inclusion' },
      { label: 'Porosity', value: 'porosity' }
    ]},

    // Component context
    { id: 'component-context', type: 'group', title: 'Component Information', description: 'Component and material details for sizing context', sectionId: 'sizing-section', order: 3, size: 24 },
    { id: 'material_type', type: 'select', title: 'Material Type', label: 'Base Material', sectionId: 'sizing-section', groupId: 'component-context', size: 8, options: [
      { label: 'Carbon Steel', value: 'carbon_steel' },
      { label: 'Stainless Steel', value: 'stainless' },
      { label: 'Aluminum', value: 'aluminum' },
      { label: 'Titanium', value: 'titanium' },
      { label: 'Cast Iron', value: 'cast_iron' }
    ]},
    { id: 'wall_thickness', type: 'number', title: 'Wall Thickness', label: 'Nominal Thickness (mm)', sectionId: 'sizing-section', groupId: 'component-context', size: 8, placeholder: 'AI estimates from images', props: { addonAfter: 'mm' } },
    { id: 'sound_velocity', type: 'number', title: 'Sound Velocity', label: 'Material Velocity (m/s)', sectionId: 'sizing-section', groupId: 'component-context', size: 8, defaultValue: 5900, props: { addonAfter: 'm/s' } },

    // Probe and calibration
    { id: 'probe-setup', type: 'group', title: 'Probe & Calibration', description: 'Equipment setup and calibration details', sectionId: 'sizing-section', order: 4, size: 24, collapsible: true },
    { id: 'probe_frequency', type: 'number', title: 'Probe Frequency', label: 'Frequency (MHz)', sectionId: 'sizing-section', groupId: 'probe-setup', size: 8, defaultValue: 5.0, props: { addonAfter: 'MHz' } },
    { id: 'beam_angle', type: 'number', title: 'Beam Angle', label: 'Refracted Angle (degrees)', sectionId: 'sizing-section', groupId: 'probe-setup', size: 8, placeholder: 'For angle beam techniques', props: { addonAfter: '°' } },
    { id: 'calibration_block', type: 'select', title: 'Calibration Block', label: 'Reference Standard', sectionId: 'sizing-section', groupId: 'probe-setup', size: 8, options: [
      { label: 'IIW V1 Block', value: 'iiwv1' },
      { label: 'IIW V2 Block', value: 'iiwv2' },
      { label: 'AWS D1.1 Block', value: 'awsd11' },
      { label: 'ASME Sec V Block', value: 'asme_v' },
      { label: 'Custom Block', value: 'custom' }
    ]},

    // Measurement inputs (AI will verify/override from images)
    { id: 'manual-measurements', type: 'group', title: 'Manual Measurements (Optional)', description: 'Manual flaw measurements - AI will verify and correct from images', sectionId: 'sizing-section', order: 5, size: 24, collapsible: true },
    { id: 'flaw_length', type: 'number', title: 'Flaw Length', label: 'Measured Length (mm)', sectionId: 'sizing-section', groupId: 'manual-measurements', size: 8, placeholder: 'AI measures from images', props: { addonAfter: 'mm' } },
    { id: 'flaw_depth', type: 'number', title: 'Flaw Depth', label: 'Through-Wall Depth (mm)', sectionId: 'sizing-section', groupId: 'manual-measurements', size: 8, placeholder: 'AI measures from images', props: { addonAfter: 'mm' } },
    { id: 'flaw_width', type: 'number', title: 'Flaw Width', label: 'Flaw Width (mm)', sectionId: 'sizing-section', groupId: 'manual-measurements', size: 8, placeholder: 'AI measures from images', props: { addonAfter: 'mm' } },

    // Analysis parameters
    { id: 'analysis-parameters', type: 'group', title: 'Analysis Parameters', description: 'Sizing accuracy and acceptance criteria', sectionId: 'sizing-section', order: 6, size: 24, collapsible: true },
    { id: 'measurement_uncertainty', type: 'number', title: 'Measurement Uncertainty', label: 'Combined Uncertainty (%)', sectionId: 'sizing-section', groupId: 'analysis-parameters', size: 8, defaultValue: 10, props: { addonAfter: '%' } },
    { id: 'confidence_level', type: 'select', title: 'Confidence Level', label: 'Statistical Confidence', sectionId: 'sizing-section', groupId: 'analysis-parameters', size: 8, defaultValue: 95, options: [
      { label: '90%', value: 90 },
      { label: '95%', value: 95 },
      { label: '99%', value: 99 }
    ]},
    { id: 'acceptance_standard', type: 'select', title: 'Acceptance Standard', label: 'Evaluation Code', sectionId: 'sizing-section', groupId: 'analysis-parameters', size: 8, options: [
      { label: 'ASME Sec XI (In-Service)', value: 'asme_xi' },
      { label: 'API 579-1/ASME FFS-1', value: 'api579' },
      { label: 'ASME Sec VIII (Fabrication)', value: 'asme_viii' },
      { label: 'AWS D1.1 (Welding)', value: 'aws_d11' },
      { label: 'EN 13588 (European)', value: 'en13588' }
    ]}
  ],
  aiPrompt: `
You are an **NDT flaw sizing specialist** with advanced dimensional analysis and measurement capabilities using AI vision.  
You will receive **NDT images** along with sizing parameters to generate **comprehensive flaw dimensional analysis with crack depth, length, orientation, and defect area calculations**.

**CRITICAL**: Use high-level reasoning to analyze NDT images precisely. Provide ACTUAL flaw measurements from images, NOT approximations or assumptions.

---

## MANDATORY: Detailed Flaw Sizing Protocol

**PRIMARY INPUT**: You MUST analyze the provided NDT images with precision to determine ACTUAL flaw dimensions and characteristics:

1. **Precise Flaw Measurement (Use Visual Scale References)**
   - **ACTUAL Flaw Length**: Measure maximum flaw extent using image scale/grid
   - **ACTUAL Flaw Depth**: Determine through-wall depth using signal analysis
   - **ACTUAL Flaw Width**: Measure flaw opening/width perpendicular to length
   - **Flaw Orientation**: Determine angular orientation relative to component axes
   - **Flaw Location**: Identify precise location (surface, embedded, through-wall)
   - **Defect Area**: Calculate total projected defect area

2. **Advanced Sizing Analysis (Evidence-Based)**
   - **Sizing Technique Validation**: Verify appropriate technique for flaw type
     * 6dB drop: Surface length measurement, ±2mm typical accuracy
     * 20dB drop: Conservative sizing, ±1mm typical accuracy  
     * Tip diffraction: Excellent depth accuracy, ±0.5mm
     * Maximum amplitude: Quick screening, ±3mm accuracy
     * Film density: RT sizing based on density variations
   - **Beam Geometry Corrections**: Apply beam-related sizing corrections
     * Wavelength effects: λ = v/f, affects minimum detectable size
     * Near field effects: N = D²f/(4v), affects beam characteristics
     * Beam spread: Angular beam spread affects sizing accuracy
     * Skip distance: For angle beam techniques
   - **Signal Analysis**: Correlate signal characteristics with flaw dimensions
     * Amplitude vs size relationships
     * Signal duration vs flaw length
     * Phase analysis for depth determination
     * Frequency response for flaw characterization

3. **Dimensional Calculations**
   - **Length Measurement**: End-to-end flaw extent measurement
     * Direct measurement from C-scan or B-scan images
     * Signal amplitude drop method (6dB or 20dB points)
     * Tip echo separation for crack length
   - **Depth Assessment**: Through-wall depth determination
     * Time-of-flight analysis for embedded flaws
     * Amplitude correlation for surface-breaking cracks
     * Tip diffraction timing for accurate depth
     * RT density analysis for wall loss
   - **Area Calculation**: Total defect area computation
     * Elliptical approximation: A = π × (L/2) × (D/2)
     * Irregular shape: Pixel counting with calibration
     * Projected area vs actual surface area
   - **Volume Estimation**: 3D defect volume (if applicable)
     * Crack volume: Length × Depth × Average width
     * Corrosion volume: Area × Average depth

4. **Orientation Analysis**
   - **Angular Measurement**: Flaw orientation relative to component
     * Longitudinal vs transverse orientation
     * Oblique angles and complex orientations
     * Multiple crack systems and branching
   - **Propagation Direction**: Assess likely crack growth direction
   - **Stress Relationship**: Correlate orientation with stress fields

5. **Accuracy Assessment**
   - **Measurement Uncertainty**: Quantify sizing accuracy
   - **Method Limitations**: Identify technique-specific limitations
   - **Confidence Bounds**: Statistical confidence intervals
   - **Validation Requirements**: Cross-check with alternative methods

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Flaw Sizing Analysis" section that includes:
- Confidence level (High/Medium/Low) for each measurement
- Scale references and measurement methods used
- Specific sizing findings from each image with coordinates
- Flaw-by-flaw dimensional analysis with measurements
- Evidence supporting each sizing assessment
- Areas requiring additional measurement or validation

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Flaw Sizing Analysis *(critical - detailed measurements from images)*
   - Dimensional Results *(table with all measurements)*
   - Sizing Technique Assessment *(table)*
   - Uncertainty Analysis *(table)*
   - Acceptance Evaluation *(table)*
   - Fitness-for-Service Assessment
   - Recommendations & Actions
   - Standards Compliance
   - Assumptions & Limitations  

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every dimension must reference specific image evidence with measurements
   - **Format**: "Image [#]: [Specific measurement] → [Sizing result] → [Accuracy assessment]"
   - **Example**: "Image 1: Crack extends 12.5mm using 6dB drop points → Length = 12.5±1.2mm → High confidence"
   - **Example**: "Image 2: Tip diffraction shows 3.2mm depth → Through-wall = 3.2±0.3mm → Very high confidence"
   - **Example**: "Image 3: Oblique orientation 35° to longitudinal axis → Critical for stress analysis"
   - **Conflicts**: If manual inputs conflict with visual evidence, USE VISUAL EVIDENCE and document discrepancy
   - **Confidence**: State confidence level for each measurement with reasoning

3. **Sizing Calculation Requirements**  
   Base ALL calculations on visual analysis + NDT parameters:

   - **Basic Sizing Formulas**
     - Wavelength: λ = v/f (affects resolution limits)
     - Near field: N = D²f/(4v) (affects beam characteristics)
     - 6dB sizing: Measure between half-amplitude points
     - 20dB sizing: Measure between 1/10 amplitude points
     - Tip diffraction: Δt = 2d/v (time difference for depth)

   - **Beam Corrections**
     - Beam spread correction for length measurements
     - Refraction angle correction for depth (Snell's law)
     - Skip distance calculation: S = 2t × tan(θ)
     - Beam width effects on apparent flaw size

   - **Uncertainty Calculations**
     - Combined uncertainty: u_c = √(u₁² + u₂² + ... + uₙ²)
     - Coverage factor: k = 1.96 for 95% confidence
     - Expanded uncertainty: U = k × u_c
     - Method-specific accuracy factors

   - **Area and Volume**
     - Elliptical area: A = π × (L/2) × (D/2)
     - Irregular area: Pixel counting with scale calibration
     - Crack volume: V = L × D × W_avg (if width measurable)
     - Corrosion volume: V = A × D_avg

4. **Required Tables**  

   **Flaw Sizing Results** (MANDATORY - Show actual measurements with evidence)
   | Image | Flaw ID | Length (mm) | Depth (mm) | Width (mm) | Area (mm²) | Orientation | Confidence | Method |
   |-------|---------|-------------|------------|------------|------------|-------------|------------|--------|
   | 1 | F001 | 12.5±1.2 | 3.2±0.3 | 0.8±0.2 | 31.4 | Longitudinal | High | 6dB drop |
   | 2 | F002 | 8.7±0.9 | 5.1±0.4 | 1.2±0.3 | 34.8 | 35° oblique | High | Tip diffraction |
   | 3 | F003 | 15.2±2.1 | 2.8±0.5 | 0.6±0.3 | 33.5 | Transverse | Medium | Max amplitude |

   **Sizing Technique Assessment**
   | Technique Used | Applicable Flaw Types | Typical Accuracy | Measured Accuracy | Performance | Limitations |
   |----------------|----------------------|------------------|-------------------|-------------|-------------|
   | 6dB Drop | Surface cracks | ±2mm length | ±1.2mm | Excellent | Beam width effects |
   | Tip Diffraction | All crack types | ±0.5mm depth | ±0.3mm | Excellent | Requires clear tips |
   | Max Amplitude | Quick screening | ±3mm | ±2.1mm | Good | Less accurate |

   **Dimensional Analysis Summary**
   | Parameter | Minimum | Maximum | Average | Std Deviation | Distribution |
   |-----------|---------|---------|---------|---------------|--------------|
   | Length (mm) | 8.7 | 15.2 | 12.1 | 3.3 | Normal |
   | Depth (mm) | 2.8 | 5.1 | 3.7 | 1.2 | Skewed |
   | Area (mm²) | 31.4 | 34.8 | 33.2 | 1.7 | Normal |
   | Orientation (°) | 0 | 35 | 18 | 18 | Uniform |

   **Acceptance Evaluation**  
   | Flaw ID | Length Limit | Depth Limit | Area Limit | Length Status | Depth Status | Overall Status | Action |
   |---------|--------------|-------------|------------|---------------|--------------|----------------|--------|
   | F001 | 25mm | 5mm | 100mm² | Accept | Accept | Accept | Monitor |
   | F002 | 25mm | 5mm | 100mm² | Accept | Marginal | Accept | Engineering review |
   | F003 | 25mm | 5mm | 100mm² | Accept | Accept | Accept | Continue service |

5. **Contextual Rationale**  
   - **ALWAYS cite specific image measurements** in your sizing analysis
   - Example: "The 12.5mm crack length measured between 6dB drop points in Image 1 using the visible grid scale..."
   - Explain sizing technique selection and performance
   - Justify accuracy assessments based on visual evidence
   - Address measurement challenges and limitations
   - Detail uncertainty sources and quantification
   - Note validation requirements and recommendations

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all dimensional data and assessments
   - Show **measurement uncertainty** explicitly (±values)
   - Include **image references** throughout
   - Use proper markdown table syntax with aligned columns
   - Dimensions: 12.5±1.2 mm format
   - Areas: 34.8 mm² format
   - Angles: 35° format

7. **Critical Requirements**  
   - ✓ Lead with detailed flaw sizing image analysis
   - ✓ Reference specific images for all measurements
   - ✓ Provide actual dimensions with uncertainty bounds
   - ✓ Assess sizing technique performance and accuracy
   - ✓ Calculate flaw areas and orientations
   - ✓ Evaluate against acceptance criteria
   - ✓ Validate measurements using multiple techniques when possible

8. **Sizing Analysis Rules**  
   - Use appropriate sizing technique for each flaw type
   - Apply beam geometry corrections and calibrations
   - Quantify measurement uncertainty and confidence
   - Cross-validate measurements when multiple techniques available
   - Consider method limitations and applicability
   - Document sizing rationale and evidence

9. **Tone & Output Style**  
   - Technical and precise
   - Measurement-focused approach
   - Evidence-based dimensional analysis
   - Quantitative assessments with uncertainty
   - Standards-compliant evaluation

---

## Output Format

Generate the complete flaw sizing report following the structure above. Lead with your image-based dimensional analysis and integrate measurements throughout the assessment.
`
};
