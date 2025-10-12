module.exports = {
  id: 'snr-calculator',
  name: 'Signal-to-Noise Ratio Calculator',
  description: 'AI-powered SNR analysis using NDT images for data quality assurance and acceptance criteria validation',
  category: 'Data Quality',
  module: 'ndt',
  icon: 'SignalFilled',
  tags: ['snr', 'signal', 'noise', 'quality', 'acceptance', 'vision'],
  uiDefinition: [
    { id: 'snr-section', type: 'section', title: 'SNR Analysis & Data Quality Assessment', description: 'Upload NDT images for signal-to-noise ratio analysis and quality validation', icon: 'SignalFilled', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'NDT Signal Images (Required)', description: 'Upload A-scans, waveforms, or signal displays for SNR analysis', sectionId: 'snr-section', order: 1, size: 24 },
    { id: 'signal_images', type: 'image-upload-with-drawing', title: 'Signal Images', label: 'Upload Signal Images', sectionId: 'snr-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 8 }, placeholder: 'Upload A-scan displays, waveforms, oscilloscope traces, or signal analysis screens showing signal and noise levels' },

    // Critical measurement parameters
    { id: 'measurement-info', type: 'group', title: 'Measurement Parameters', description: 'Essential signal measurement details', sectionId: 'snr-section', order: 2, size: 24 },
    { id: 'ndt_method', type: 'select', title: 'NDT Method', label: 'Inspection Method', sectionId: 'snr-section', groupId: 'measurement-info', size: 8, required: true, options: [
      { label: 'UT (Ultrasonic)', value: 'UT' },
      { label: 'PAUT (Phased Array)', value: 'PAUT' },
      { label: 'AUT (Automated UT)', value: 'AUT' },
      { label: 'TOFD (Time of Flight)', value: 'TOFD' },
      { label: 'ET (Eddy Current)', value: 'ET' },
      { label: 'RT (Digital Radiography)', value: 'RT' },
      { label: 'Acoustic Emission', value: 'AE' }
    ]},
    { id: 'signal_type', type: 'select', title: 'Signal Type', label: 'Type of Signal Being Analyzed', sectionId: 'snr-section', groupId: 'measurement-info', size: 8, required: true, options: [
      { label: 'Flaw Echo', value: 'flaw_echo' },
      { label: 'Backwall Echo', value: 'backwall' },
      { label: 'Reference Reflector', value: 'reference' },
      { label: 'Calibration Signal', value: 'calibration' },
      { label: 'Interface Echo', value: 'interface' },
      { label: 'Noise Floor', value: 'noise_floor' }
    ]},
    { id: 'measurement_standard', type: 'select', title: 'Acceptance Standard', label: 'Quality Standard', sectionId: 'snr-section', groupId: 'measurement-info', size: 8, required: true, options: [
      { label: 'ASME Sec V (SNR ≥ 6dB)', value: 'asme_v' },
      { label: 'ASME Sec XI (SNR ≥ 10dB)', value: 'asme_xi' },
      { label: 'API 510/570 (SNR ≥ 6dB)', value: 'api_510' },
      { label: 'AWS D1.1 (SNR ≥ 6dB)', value: 'aws_d11' },
      { label: 'EN Standards (SNR ≥ 6dB)', value: 'en_standards' },
      { label: 'Custom Criteria', value: 'custom' }
    ]},

    // Equipment setup
    { id: 'equipment-group', type: 'group', title: 'Equipment Setup', description: 'Instrument and probe configuration', sectionId: 'snr-section', order: 3, size: 24 },
    { id: 'instrument_model', type: 'text', title: 'Instrument Model', label: 'UT Instrument Model', sectionId: 'snr-section', groupId: 'equipment-group', size: 8, placeholder: 'e.g., Olympus EPOCH 650, GE USM Go+' },
    { id: 'probe_frequency', type: 'number', title: 'Probe Frequency', label: 'Frequency (MHz)', sectionId: 'snr-section', groupId: 'equipment-group', size: 8, defaultValue: 5.0, props: { addonAfter: 'MHz' } },
    { id: 'gain_setting', type: 'number', title: 'Gain Setting', label: 'Instrument Gain (dB)', sectionId: 'snr-section', groupId: 'equipment-group', size: 8, defaultValue: 40, props: { addonAfter: 'dB' } },

    // Signal measurements
    { id: 'signal-measurements', type: 'group', title: 'Signal Measurements', description: 'Manual signal and noise level inputs (AI will verify from images)', sectionId: 'snr-section', order: 4, size: 24, collapsible: true },
    { id: 'signal_amplitude_db', type: 'number', title: 'Signal Amplitude', label: 'Peak Signal Level (dB)', sectionId: 'snr-section', groupId: 'signal-measurements', size: 8, placeholder: 'AI will measure from images', props: { addonAfter: 'dB' } },
    { id: 'noise_amplitude_db', type: 'number', title: 'Noise Level', label: 'Background Noise (dB)', sectionId: 'snr-section', groupId: 'signal-measurements', size: 8, placeholder: 'AI will measure from images', props: { addonAfter: 'dB' } },
    { id: 'reference_amplitude_db', type: 'number', title: 'Reference Level', label: 'Calibration Reference (dB)', sectionId: 'snr-section', groupId: 'signal-measurements', size: 8, placeholder: 'DAC/TCG reference level', props: { addonAfter: 'dB' } },

    // Analysis parameters
    { id: 'analysis-parameters', type: 'group', title: 'Analysis Parameters', description: 'SNR calculation and acceptance criteria', sectionId: 'snr-section', order: 5, size: 24, collapsible: true },
    { id: 'required_snr_db', type: 'number', title: 'Required SNR', label: 'Minimum Required SNR (dB)', sectionId: 'snr-section', groupId: 'analysis-parameters', size: 8, defaultValue: 6, props: { addonAfter: 'dB' } },
    { id: 'measurement_bandwidth', type: 'select', title: 'Measurement Bandwidth', label: 'Signal Bandwidth', sectionId: 'snr-section', groupId: 'analysis-parameters', size: 8, options: [
      { label: 'Broadband (Full)', value: 'broadband' },
      { label: 'Narrowband (Filtered)', value: 'narrowband' },
      { label: 'Peak Detection', value: 'peak' },
      { label: 'RMS Average', value: 'rms' }
    ]},
    { id: 'averaging_method', type: 'select', title: 'Averaging Method', label: 'Signal Averaging', sectionId: 'snr-section', groupId: 'analysis-parameters', size: 8, options: [
      { label: 'No Averaging', value: 'none' },
      { label: '4x Average', value: '4x' },
      { label: '8x Average', value: '8x' },
      { label: '16x Average', value: '16x' }
    ]},

    // Environmental factors
    { id: 'environment-group', type: 'group', title: 'Environmental Factors', description: 'Factors affecting signal quality', sectionId: 'snr-section', order: 6, size: 24, collapsible: true },
    { id: 'coupling_quality', type: 'select', title: 'Coupling Quality', label: 'Couplant Coupling', sectionId: 'snr-section', groupId: 'environment-group', size: 8, options: [
      { label: 'Excellent', value: 'excellent' },
      { label: 'Good', value: 'good' },
      { label: 'Fair', value: 'fair' },
      { label: 'Poor', value: 'poor' }
    ]},
    { id: 'surface_roughness', type: 'select', title: 'Surface Roughness', label: 'Surface Condition', sectionId: 'snr-section', groupId: 'environment-group', size: 8, options: [
      { label: 'Smooth (Ra < 3.2μm)', value: 'smooth' },
      { label: 'Medium (Ra 3.2-12.5μm)', value: 'medium' },
      { label: 'Rough (Ra > 12.5μm)', value: 'rough' }
    ]},
    { id: 'temperature_c', type: 'number', title: 'Temperature', label: 'Test Temperature (°C)', sectionId: 'snr-section', groupId: 'environment-group', size: 8, defaultValue: 20, props: { addonAfter: '°C' } }
  ],
  aiPrompt: `
You are an **NDT signal analysis expert** with advanced signal-to-noise ratio (SNR) measurement and quality assessment capabilities.  
You will receive **NDT signal images** along with measurement parameters to generate a **comprehensive SNR analysis and data quality assessment**.

**CRITICAL**: Use high-level reasoning to analyze signal displays precisely. Provide ACTUAL SNR measurements from images, NOT approximations or assumptions.

---

## MANDATORY: Detailed Signal Analysis Protocol

**PRIMARY INPUT**: You MUST analyze the provided signal images with precision to determine ACTUAL SNR and signal quality:

1. **Precise Signal Measurements (Use Visual Scale)**
   - **ACTUAL Signal Amplitude**: Measure peak signal level from display scale
   - **ACTUAL Noise Level**: Measure background noise floor from baseline
   - **Signal Peak Width**: Measure signal duration/bandwidth
   - **Noise Characteristics**: Analyze noise pattern (random, coherent, interference)
   - **Display Settings**: Read gain, scale, and filter settings from images
   - **Reference Levels**: Identify DAC, TCG, or calibration reference lines

2. **Detailed SNR Calculation (Evidence-Based)**
   - **SNR Formula**: SNR(dB) = 20 × log₁₀(Signal_Amplitude / Noise_Amplitude)
   - **Peak-to-Peak SNR**: Maximum signal vs peak noise
   - **RMS SNR**: RMS signal vs RMS noise (more stable)
   - **Bandwidth Correction**: Account for measurement bandwidth
   - **Averaging Effect**: Correct for signal averaging if used
   - **Multiple Measurements**: Calculate SNR for multiple signals if present

3. **Signal Quality Assessment**
   - **Signal Characteristics**: Assess signal shape, clarity, and stability
   - **Noise Analysis**: Identify noise sources (electronic, structural, environmental)
   - **Interference Detection**: Detect coherent noise or interference patterns
   - **Coupling Effects**: Assess impact of coupling quality on SNR
   - **Frequency Response**: Analyze signal vs noise across frequency spectrum
   - **Stability Check**: Evaluate signal consistency and repeatability

4. **Acceptance Criteria Evaluation**
   - Compare measured SNR against standard requirements
   - Assess margin above minimum acceptable SNR
   - Evaluate signal quality factors beyond just SNR
   - Check for signal distortion or artifacts
   - Validate measurement technique and setup

5. **Quality Metrics**
   - Signal clarity and definition
   - Noise floor stability
   - Dynamic range utilization
   - Measurement repeatability
   - Calibration verification

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Signal Analysis & SNR Assessment" section that includes:
- Confidence level (High/Medium/Low) for each SNR measurement
- Display scale readings and measurement methods used
- Specific signal findings from each image with image numbers
- Signal-by-signal SNR analysis with amplitude measurements
- Evidence supporting quality assessments
- Areas of concern or measurement limitations

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Signal Analysis & SNR Assessment *(critical - detailed analysis from images)*
   - SNR Calculations & Results *(table with measurements)*
   - Signal Quality Evaluation *(table)*
   - Acceptance Criteria Assessment *(table)*
   - Noise Analysis *(table)*
   - Equipment Performance *(table)*
   - Quality Assurance Results  
   - Recommendations for Improvement
   - Standards Compliance
   - Assumptions & Limitations  

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every SNR calculation must reference specific image evidence with image numbers
   - **Format**: "Image [#]: [Specific measurement] → [SNR calculation] → [Quality assessment]"
   - **Example**: "Image 1: Signal peak at +42dB, noise floor at +18dB → SNR = 24dB → Exceeds ASME Sec V requirement"
   - **Example**: "Image 2: Visible interference pattern in noise floor → Coherent noise detected → SNR measurement affected"
   - **Example**: "Image 3: Signal averaging 8x applied → Noise reduced by 9dB → Effective SNR improved to 18dB"
   - **Conflicts**: If manual inputs conflict with visual evidence, USE VISUAL EVIDENCE and document discrepancy
   - **Confidence**: State confidence level for each SNR measurement with reasoning

3. **SNR Calculation Requirements**  
   Base ALL calculations on visual analysis + measurement parameters:

   - **Basic SNR Calculation**  
     - SNR(dB) = 20 × log₁₀(A_signal / A_noise)
     - Peak SNR: Use maximum signal vs maximum noise
     - RMS SNR: Use RMS values for better stability
     - Average SNR: Multiple measurements averaged

   - **Bandwidth Corrections**
     - Broadband: No correction
     - Narrowband: +3dB correction typical
     - Peak detection: Variable correction based on filter
     - RMS averaging: Noise reduction = 10×log₁₀(N) where N = averages

   - **Environmental Corrections**
     - Poor coupling: -3 to -6dB SNR penalty
     - Rough surface: -2 to -4dB SNR penalty
     - Temperature effects: ±1dB per 50°C deviation
     - Interference: Variable penalty based on severity

   - **Quality Factors**
     - Excellent SNR: >20dB (High confidence measurements)
     - Good SNR: 15-20dB (Reliable measurements)
     - Acceptable SNR: 6-15dB (Meets minimum standards)
     - Poor SNR: <6dB (Unreliable, reject)

   - **Acceptance Assessment**
     - Compare to standard requirements (ASME, API, AWS, etc.)
     - Calculate margin above minimum requirement
     - Assess overall measurement reliability
     - Determine accept/reject status

4. **Required Tables**  

   **Signal Analysis Summary** (MANDATORY - Show actual measurements with evidence)
   | Image | Signal Type | Signal Level (dB) | Noise Level (dB) | Calculated SNR (dB) | Quality Rating | Acceptance Status | Notes |
   |-------|-------------|-------------------|------------------|---------------------|----------------|-------------------|-------|
   | 1 | Flaw Echo | +42 | +18 | 24.0 | Excellent | Accept | Clear signal |
   | 2 | Backwall | +38 | +20 | 18.1 | Good | Accept | Stable baseline |
   | 3 | Reference | +45 | +19 | 26.2 | Excellent | Accept | Calibration OK |
   | 4 | Noise Floor | N/A | +16 | N/A | Good | N/A | Low noise floor |

   **SNR Calculations Detail**
   | Measurement | Method | Raw SNR (dB) | Corrections Applied | Final SNR (dB) | Standard Requirement | Margin (dB) | Status |
   |-------------|--------|--------------|---------------------|----------------|---------------------|-------------|--------|
   | Peak Signal | Peak detection | 24.0 | None | 24.0 | 6.0 (ASME V) | +18.0 | Pass |
   | RMS Signal | RMS averaging | 21.5 | +3dB (8x avg) | 24.5 | 6.0 (ASME V) | +18.5 | Pass |
   | Filtered | Narrowband | 26.2 | +3dB (filter) | 29.2 | 6.0 (ASME V) | +23.2 | Pass |

   **Signal Quality Evaluation**  
   | Parameter | Measured Value | Target Value | Assessment | Impact on SNR | Improvement Needed |
   |-----------|----------------|--------------|------------|---------------|-------------------|
   | Signal Amplitude | +42dB | >+30dB | Good | None | None |
   | Noise Floor | +18dB | <+25dB | Excellent | +6dB benefit | None |
   | Signal Stability | ±0.5dB | <±2dB | Excellent | None | None |
   | Coupling Quality | Good | Good+ | Acceptable | -1dB penalty | Surface prep |

   **Acceptance Criteria Assessment**  
   | Standard | Required SNR | Measured SNR | Margin | Status | Additional Requirements |
   |----------|--------------|--------------|--------|--------|-----------------------|
   | ASME Sec V | ≥6dB | 24.0dB | +18dB | Pass | Signal stability |
   | ASME Sec XI | ≥10dB | 24.0dB | +14dB | Pass | Calibration verified |
   | API 510 | ≥6dB | 24.0dB | +18dB | Pass | Documentation |
   | AWS D1.1 | ≥6dB | 24.0dB | +18dB | Pass | Reference level |

   **Noise Analysis**  
   | Noise Source | Contribution (dB) | Type | Impact | Mitigation |
   |--------------|-------------------|------|--------|------------|
   | Electronic | +16dB | Random | Low | None needed |
   | Structural | +12dB | Coherent | Medium | Averaging |
   | Coupling | +8dB | Random | Low | Better couplant |
   | Environmental | +6dB | Variable | Low | Stable conditions |
   | **Total Noise** | **+18dB** | **Mixed** | **Low** | **Current setup OK** |

5. **Contextual Rationale**  
   - **ALWAYS cite specific image measurements** in your SNR calculations
   - Example: "The signal peak at +42dB visible in Image 1 compared to the +18dB noise floor yields SNR = 20×log₁₀(42/18) = 24.0dB..."
   - Explain measurement methodology and accuracy
   - Justify quality assessments based on visual evidence
   - Address measurement challenges observed in images
   - Detail factors affecting SNR and signal quality
   - Note equipment performance and calibration status

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all SNR calculations and assessments
   - Show **formulas explicitly** with measured values
   - Include **image references** throughout
   - Use proper markdown table syntax with aligned columns
   - dB values: 24.0 dB format
   - Percentages: 95.5% format

7. **Critical Requirements**  
   - ✓ Lead with detailed signal image analysis
   - ✓ Reference specific images in SNR calculations
   - ✓ Calculate actual SNR from measured amplitudes
   - ✓ Assess signal quality beyond just SNR
   - ✓ Provide confidence levels based on image quality
   - ✓ Highlight quality issues and improvements needed
   - ✓ Validate against applicable NDT standards

8. **SNR Analysis Rules**  
   - Use appropriate SNR calculation method for signal type
   - Account for bandwidth, averaging, and environmental factors
   - Assess both signal and noise characteristics
   - Consider measurement uncertainty and repeatability
   - Validate calibration and reference levels
   - Document any non-standard conditions

9. **Tone & Output Style**  
   - Technical and precise
   - Quality-focused approach
   - Data-driven based on visual evidence
   - Quantitative SNR assessments
   - Standards-compliant presentation

---

## Output Format

Generate the complete SNR analysis report following the structure above. Lead with your signal image analysis and integrate SNR calculations throughout the quality assessment.
`
};
