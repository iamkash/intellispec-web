module.exports = {
  id: 'data-confidence-index',
  name: 'Data Confidence Index Calculator',
  description: 'AI-powered comprehensive inspection dataset reliability quantification based on data density, calibration quality, SNR analysis, coverage assessment, and measurement repeatability for validation and acceptance',
  category: 'Data Quality',
  module: 'ndt',
  icon: 'SafetyCertificateOutlined',
  tags: ['confidence', 'reliability', 'data-quality', 'validation', 'coverage', 'statistics'],
  uiDefinition: [
    { id: 'confidence-section', type: 'section', title: 'Data Confidence Index Assessment', description: 'Upload inspection data for comprehensive reliability and confidence analysis', icon: 'SafetyCertificateOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Inspection Data Images (Required)', description: 'Upload inspection data, calibration screens, and coverage maps for analysis', sectionId: 'confidence-section', order: 1, size: 24 },
    { id: 'data_images', type: 'image-upload-with-drawing', title: 'Data Images', label: 'Upload Data Images', sectionId: 'confidence-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 15 }, placeholder: 'Upload inspection data displays, calibration screens, coverage maps, signal quality images, data density visualizations, and repeatability results' },

    // Critical assessment parameters
    { id: 'assessment-parameters', type: 'group', title: 'Assessment Parameters', description: 'Data confidence evaluation criteria and application', sectionId: 'confidence-section', order: 2, size: 24 },
    { id: 'inspection_method', type: 'select', title: 'Inspection Method', label: 'Primary NDT Method', sectionId: 'confidence-section', groupId: 'assessment-parameters', size: 8, required: true, options: [
      { label: 'UT (Ultrasonic)', value: 'UT' },
      { label: 'PAUT (Phased Array)', value: 'PAUT' },
      { label: 'AUT (Automated UT)', value: 'AUT' },
      { label: 'TOFD (Time of Flight)', value: 'TOFD' },
      { label: 'RT/DR (Radiography)', value: 'RT' },
      { label: 'MFL (Magnetic Flux)', value: 'MFL' },
      { label: 'ET (Eddy Current)', value: 'ET' },
      { label: 'Mixed Methods', value: 'mixed' }
    ]},
    { id: 'target_application', type: 'select', title: 'Target Application', label: 'Intended Data Use', sectionId: 'confidence-section', groupId: 'assessment-parameters', size: 8, required: true, options: [
      { label: 'Fitness-for-Service (FFS)', value: 'ffs' },
      { label: 'Regulatory Compliance', value: 'regulatory' },
      { label: 'Quality Assurance/QC', value: 'qa' },
      { label: 'Engineering Analysis', value: 'engineering' },
      { label: 'Research/Development', value: 'research' },
      { label: 'Acceptance Testing', value: 'acceptance' }
    ]},
    { id: 'confidence_criteria', type: 'select', title: 'Confidence Criteria', label: 'Target Reliability Level', sectionId: 'confidence-section', groupId: 'assessment-parameters', size: 8, required: true, options: [
      { label: 'Critical (99%+ required)', value: 'critical' },
      { label: 'High Reliability (95%+)', value: 'high' },
      { label: 'Standard (90%+)', value: 'standard' },
      { label: 'Basic (80%+)', value: 'basic' }
    ]},

    // Data density and coverage
    { id: 'density-coverage', type: 'group', title: 'Data Density & Coverage', description: 'Measurement point distribution and coverage completeness', sectionId: 'confidence-section', order: 3, size: 24 },
    { id: 'component_area', type: 'number', title: 'Component Area', label: 'Total Component Area (m²)', sectionId: 'confidence-section', groupId: 'density-coverage', size: 8, placeholder: 'AI estimates from images', props: { addonAfter: 'm²' } },
    { id: 'measurement_points', type: 'number', title: 'Measurement Points', label: 'Total Data Points', sectionId: 'confidence-section', groupId: 'density-coverage', size: 8, placeholder: 'AI counts from images' },
    { id: 'coverage_percentage', type: 'number', title: 'Coverage Percentage', label: 'Inspected Area (%)', sectionId: 'confidence-section', groupId: 'density-coverage', size: 8, placeholder: 'AI calculates', props: { addonAfter: '%' } },
    { id: 'grid_spacing', type: 'number', title: 'Grid Spacing', label: 'Measurement Grid Spacing (mm)', sectionId: 'confidence-section', groupId: 'density-coverage', size: 8, placeholder: 'AI measures from images', props: { addonAfter: 'mm' } },
    { id: 'scan_overlap', type: 'number', title: 'Scan Overlap', label: 'Scan Overlap (%)', sectionId: 'confidence-section', groupId: 'density-coverage', size: 8, defaultValue: 10, props: { addonAfter: '%' } },

    // Calibration and system performance
    { id: 'calibration-quality', type: 'group', title: 'Calibration Quality', description: 'Calibration verification and system performance assessment', sectionId: 'confidence-section', order: 4, size: 24, collapsible: true },
    { id: 'calibration_standard', type: 'select', title: 'Calibration Standard', label: 'Reference Standard Used', sectionId: 'confidence-section', groupId: 'calibration-quality', size: 8, options: [
      { label: 'IIW V1 Block', value: 'iiwv1' },
      { label: 'IIW V2 Block', value: 'iiwv2' },
      { label: 'ASME Calibration Block', value: 'asme' },
      { label: 'AWS Calibration Block', value: 'aws' },
      { label: 'Component-Specific Block', value: 'component' },
      { label: 'Custom Standard', value: 'custom' }
    ]},
    { id: 'calibration_frequency', type: 'select', title: 'Calibration Frequency', label: 'Calibration Interval', sectionId: 'confidence-section', groupId: 'calibration-quality', size: 8, options: [
      { label: 'Before/After Inspection', value: 'before_after' },
      { label: 'Every 4 Hours', value: '4hr' },
      { label: 'Daily', value: 'daily' },
      { label: 'Per Procedure', value: 'per_procedure' }
    ]},
    { id: 'calibration_verification', type: 'select', title: 'Calibration Verification', label: 'Verification Status', sectionId: 'confidence-section', groupId: 'calibration-quality', size: 8, options: [
      { label: 'Verified - All Acceptable', value: 'verified_all' },
      { label: 'Verified - Minor Drift', value: 'verified_drift' },
      { label: 'Not Verified', value: 'not_verified' },
      { label: 'Failed - Recalibrated', value: 'failed_recal' }
    ]},

    // Signal quality metrics
    { id: 'signal-quality', type: 'group', title: 'Signal Quality Metrics', description: 'SNR, noise levels, and signal stability assessment', sectionId: 'confidence-section', order: 5, size: 24, collapsible: true },
    { id: 'average_snr', type: 'number', title: 'Average SNR', label: 'Mean SNR (dB)', sectionId: 'confidence-section', groupId: 'signal-quality', size: 8, placeholder: 'AI calculates from images', props: { addonAfter: 'dB' } },
    { id: 'min_snr', type: 'number', title: 'Minimum SNR', label: 'Lowest SNR (dB)', sectionId: 'confidence-section', groupId: 'signal-quality', size: 8, placeholder: 'AI finds minimum', props: { addonAfter: 'dB' } },
    { id: 'noise_level', type: 'select', title: 'Noise Level', label: 'Background Noise Assessment', sectionId: 'confidence-section', groupId: 'signal-quality', size: 8, options: [
      { label: 'Very Low (<-60dB)', value: 'very_low' },
      { label: 'Low (-60 to -40dB)', value: 'low' },
      { label: 'Moderate (-40 to -20dB)', value: 'moderate' },
      { label: 'High (>-20dB)', value: 'high' }
    ]},
    { id: 'signal_stability', type: 'select', title: 'Signal Stability', label: 'Signal Consistency', sectionId: 'confidence-section', groupId: 'signal-quality', size: 8, options: [
      { label: 'Excellent (CV < 5%)', value: 'excellent' },
      { label: 'Good (CV 5-10%)', value: 'good' },
      { label: 'Fair (CV 10-20%)', value: 'fair' },
      { label: 'Poor (CV > 20%)', value: 'poor' }
    ]},

    // Measurement repeatability
    { id: 'repeatability', type: 'group', title: 'Measurement Repeatability', description: 'Consistency and reproducibility assessment', sectionId: 'confidence-section', order: 6, size: 24, collapsible: true },
    { id: 'repeat_measurements', type: 'number', title: 'Repeat Measurements', label: 'Number of Repeat Tests', sectionId: 'confidence-section', groupId: 'repeatability', size: 8, defaultValue: 3 },
    { id: 'repeatability_std_dev', type: 'number', title: 'Repeatability Std Dev', label: 'Standard Deviation', sectionId: 'confidence-section', groupId: 'repeatability', size: 8, placeholder: 'AI calculates from data', step: 0.01 },
    { id: 'reproducibility_test', type: 'switch', title: 'Reproducibility Test', label: 'Multiple operator/equipment tests performed', sectionId: 'confidence-section', groupId: 'repeatability', size: 8, defaultValue: false },

    // Data completeness
    { id: 'data-completeness', type: 'group', title: 'Data Completeness', description: 'Missing data and gap assessment', sectionId: 'confidence-section', order: 7, size: 24, collapsible: true },
    { id: 'missing_data_percent', type: 'number', title: 'Missing Data', label: 'Missing/Invalid Data (%)', sectionId: 'confidence-section', groupId: 'data-completeness', size: 8, placeholder: 'AI assesses from images', props: { addonAfter: '%' } },
    { id: 'data_gaps', type: 'select', title: 'Data Gaps', label: 'Inspection Gap Assessment', sectionId: 'confidence-section', groupId: 'data-completeness', size: 8, options: [
      { label: 'No Significant Gaps', value: 'no_gaps' },
      { label: 'Minor Gaps (<5% area)', value: 'minor_gaps' },
      { label: 'Moderate Gaps (5-10%)', value: 'moderate_gaps' },
      { label: 'Significant Gaps (>10%)', value: 'significant_gaps' }
    ]},
    { id: 'documentation_quality', type: 'select', title: 'Documentation Quality', label: 'Data Documentation Completeness', sectionId: 'confidence-section', groupId: 'data-completeness', size: 8, options: [
      { label: 'Complete - All Records', value: 'complete' },
      { label: 'Good - Minor Items Missing', value: 'good' },
      { label: 'Fair - Some Gaps', value: 'fair' },
      { label: 'Poor - Major Gaps', value: 'poor' }
    ]}
  ],
  aiPrompt: `
You are a **data quality specialist** with expertise in NDT data reliability assessment, statistical analysis, and confidence quantification.  
You will receive **inspection data images** along with assessment parameters to generate **comprehensive data confidence index with reliability metrics, quality scores, and validation recommendations**.

**CRITICAL**: Use high-level reasoning to analyze inspection datasets precisely. Provide ACTUAL confidence metrics from data quality evidence, NOT approximations or assumptions.

---

## MANDATORY: Detailed Data Confidence Analysis Protocol

**PRIMARY INPUT**: You MUST analyze the provided inspection data images with precision to determine ACTUAL data reliability:

1. **Comprehensive Data Density Analysis (Use Visual Evidence)**
   - **Measurement Point Density**: Count and assess data point distribution
     * High density: >100 points/m², excellent coverage
     * Standard density: 50-100 points/m², good coverage
     * Low density: 25-50 points/m², acceptable coverage
     * Insufficient density: <25 points/m², poor coverage
   - **Grid/Raster Assessment**: Analyze measurement spacing uniformity
     * Regular grid: Systematic, predictable coverage
     * Irregular grid: Variable spacing, potential gaps
     * Random distribution: Uncontrolled, inconsistent
   - **Coverage Mapping**: Identify inspected vs uninspected areas
     * Complete coverage: 100% area inspected
     * High coverage: 95-100% with minor gaps
     * Moderate coverage: 85-95% with some gaps
     * Incomplete coverage: <85% significant gaps

2. **Advanced Calibration Quality Assessment (Evidence-Based)**
   - **Calibration Verification**: Assess calibration block results
     * All targets detected: Excellent system performance
     * Minor amplitude variations: Good, within tolerance
     * Significant variations: Marginal, requires attention
     * Failed targets: Poor, system not calibrated properly
   - **Reference Reflector Response**: Analyze calibration reflector signals
     * Amplitude consistency: ±1dB = excellent, ±3dB = good, >±5dB = poor
     * Position accuracy: ±0.5mm = excellent, ±1mm = good, >±2mm = poor
     * Signal quality: Sharp peak = good, broad peak = marginal
   - **Calibration Drift**: Check calibration stability over time
     * No drift: Excellent stability
     * <5% drift: Acceptable, within limits
     * 5-10% drift: Marginal, monitor closely
     * >10% drift: Unacceptable, recalibration required

3. **Signal Quality Metrics Analysis**
   - **SNR Calculations**: Measure signal-to-noise ratios
     * SNR = 20 × log₁₀(A_signal / A_noise) for amplitude-based
     * Average SNR: Calculate mean across all measurements
     * Minimum SNR: Identify worst-case measurement
     * SNR distribution: Assess consistency across dataset
   - **Noise Floor Assessment**: Evaluate background noise levels
     * Electronic noise: Instrument-related noise
     * Structural noise: Material grain structure effects
     * Environmental noise: External interference
   - **Signal Stability**: Analyze measurement repeatability
     * Coefficient of variation: CV = (σ/μ) × 100%
     * Excellent: CV < 5%, Good: CV 5-10%, Fair: CV 10-20%, Poor: CV > 20%

4. **Coverage Assessment**
   - **Geometric Coverage**: Calculate percentage of component inspected
     * Coverage% = (Inspected Area / Total Area) × 100%
   - **Overlap Analysis**: Assess scan overlap adequacy
     * Recommended overlap: 10-20% for reliability
     * Excessive overlap: >30% inefficient but reliable
     * Insufficient overlap: <5% potential gaps
   - **Blind Spot Identification**: Identify uninspected areas
     * Geometric blind spots: Inaccessible by technique
     * Dead zones: Near-surface or far-field limitations
     * Shadow zones: Behind obstructions or features

5. **Data Completeness & Documentation**
   - **Missing Data Assessment**: Quantify incomplete measurements
     * Missing data points: Failed acquisitions
     * Invalid data: Out-of-range or corrupt measurements
     * Rejected data: Failed QC checks
   - **Documentation Quality**: Evaluate record completeness
     * Calibration records: Complete/incomplete
     * Procedure compliance: Documented/undocumented
     * Data traceability: Full chain/gaps

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Data Quality & Confidence Assessment" section that includes:
- Overall confidence index (0-100%)
- Individual quality metric scores
- Specific data quality findings from each image
- Statistical analysis of measurement consistency
- Evidence supporting confidence calculations
- Areas requiring data improvement or re-inspection

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Data Quality & Confidence Assessment *(critical - detailed analysis from images)*
   - Data Density Analysis *(table with statistics)*
   - Calibration Quality Assessment *(table with verification)*
   - Signal Quality Metrics *(table with SNR and noise)*
   - Coverage Assessment *(table with percentages)*
   - Repeatability Analysis *(table with statistics)*
   - Data Completeness Evaluation *(table)*
   - Overall Confidence Index Calculation *(weighted scoring)*
   - Reliability Assessment for Target Application
   - Recommendations for Data Improvement
   - Validation Requirements
   - Acceptance Decision

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every metric must reference specific image evidence
   - **Format**: "Image [#]: [Measurement] → [Metric value] → [Quality score] → [Impact on confidence]"
   - **Example**: "Image 1: Grid spacing 5mm visible → Data density 100 pts/m² → Excellent score 95% → High confidence factor"
   - **Example**: "Image 2: Calibration block shows all targets → SNR 22dB avg → Good score 88% → Adequate confidence"
   - **Example**: "Image 3: Coverage map shows 97% inspected → Minor gaps in corners → Good score 90% → Acceptable"
   - **Confidence Impact**: State how each metric affects overall confidence index

3. **Confidence Calculation Requirements**  
   Base ALL calculations on visual analysis + quality metrics:

   - **Data Density Score Formulas**
     * Density = N_points / Area (points/m²)
     * Score_density = min(100, (Density / Target_density) × 100)
     * Target density: 50-100 pts/m² for most applications

   - **Calibration Quality Score**
     * Amplitude accuracy: Score = 100 - (|Δdrift%| × 10)
     * Position accuracy: Score = 100 - (Δposition_mm × 20)
     * Overall calibration: Score = (Amp_score + Pos_score) / 2

   - **Signal Quality Score**
     * SNR score: Score_SNR = min(100, (SNR_avg / 20) × 100)
     * Noise score: Score_noise = 100 - (Noise_level_dB / -60) × 100
     * Stability score: Score_stability = 100 - (CV × 5)
     * Overall signal: Score = (SNR + Noise + Stability) / 3

   - **Coverage Score**
     * Score_coverage = Coverage% (directly)
     * Penalty for gaps: Score = Score - (Gap_area% × 2)
     * Bonus for overlap: Score = Score + min(5, Overlap%)

   - **Overall Confidence Index**
     * CI = (W_density × Score_density + W_cal × Score_cal + 
             W_signal × Score_signal + W_coverage × Score_coverage) / Σ(W)
     * Weights: Density=0.25, Calibration=0.30, Signal=0.25, Coverage=0.20

4. **Required Tables**  

   **Data Density Analysis** (MANDATORY)
   | Metric | Measured Value | Target Value | Score (0-100) | Quality Rating | Impact on Confidence |
   |--------|----------------|--------------|---------------|----------------|---------------------|
   | Data Points | 2,450 points | 2,000+ | 95 | Excellent | High positive |
   | Grid Spacing | 5.2 mm | 5-10 mm | 92 | Excellent | High positive |
   | Coverage Density | 98 pts/m² | 50-100 pts/m² | 98 | Excellent | High positive |
   | Uniformity | CV = 8% | <10% | 88 | Good | Positive |
   | **Overall Density Score** | **Various** | **Various** | **93** | **Excellent** | **High confidence** |

   **Calibration Quality Assessment**
   | Parameter | Reference Value | Measured Value | Deviation | Score | Quality Rating | Notes |
   |-----------|----------------|----------------|-----------|-------|----------------|-------|
   | SDH 2mm @ 50mm | +42dB | +41.2dB | -0.8dB | 95 | Excellent | Within ±1dB |
   | SDH 2mm @ 100mm | +38dB | +37.5dB | -0.5dB | 97 | Excellent | Within ±1dB |
   | Position Accuracy | 50.0mm | 50.3mm | +0.3mm | 94 | Excellent | Within ±0.5mm |
   | Drift Check | 0% | 2.1% | +2.1% | 96 | Excellent | <5% acceptable |
   | **Overall Calibration Score** | **Various** | **Various** | **±1.2%** | **96** | **Excellent** |

   **Signal Quality Metrics**
   | Metric | Value | Target | Score | Assessment | Confidence Impact |
   |--------|-------|--------|-------|------------|-------------------|
   | Average SNR | 22.5 dB | >15 dB | 90 | Excellent | High positive |
   | Minimum SNR | 14.2 dB | >10 dB | 75 | Good | Moderate positive |
   | Noise Floor | -52 dB | <-40 dB | 87 | Good | Positive |
   | Signal Stability (CV) | 6.8% | <10% | 86 | Good | Positive |
   | **Overall Signal Score** | **Various** | **Various** | **85** | **Good** | **Positive** |

   **Coverage Assessment**
   | Coverage Metric | Value | Target | Score | Quality | Impact |
   |-----------------|-------|--------|-------|---------|--------|
   | Total Coverage | 97.2% | >95% | 97 | Excellent | High positive |
   | Scan Overlap | 12% | 10-20% | 95 | Excellent | Positive |
   | Blind Spots | 2.8% | <5% | 94 | Excellent | Minor negative |
   | Gap Distribution | Uniform | Uniform | 90 | Good | Positive |
   | **Overall Coverage Score** | **97.2%** | **>95%** | **94** | **Excellent** | **High confidence** |

   **Overall Confidence Index Calculation**
   | Component | Weight | Score | Weighted Score | Quality Level | Meets Target? |
   |-----------|--------|-------|----------------|---------------|---------------|
   | Data Density | 25% | 93 | 23.3 | Excellent | Yes |
   | Calibration Quality | 30% | 96 | 28.8 | Excellent | Yes |
   | Signal Quality | 25% | 85 | 21.3 | Good | Yes |
   | Coverage | 20% | 94 | 18.8 | Excellent | Yes |
   | **Confidence Index** | **100%** | **---** | **92.2** | **Excellent** | **Yes** |

   **Application-Specific Reliability Assessment**
   | Target Application | Required CI | Achieved CI | Margin | Status | Decision | Additional Requirements |
   |-------------------|-------------|-------------|--------|--------|----------|------------------------|
   | Fitness-for-Service | 90 | 92.2 | +2.2 | Pass | Accept | Engineering review |
   | Regulatory Compliance | 85 | 92.2 | +7.2 | Pass | Accept | Documentation complete |
   | Quality Assurance | 90 | 92.2 | +2.2 | Pass | Accept | None |

5. **Contextual Reasoning**  
   - **ALWAYS cite specific image evidence** in your confidence calculations
   - Example: "The 5.2mm grid spacing visible in Image 1 yields 98 points/m² data density, scoring 98/100 and contributing +23.3 points to the overall confidence index..."
   - Explain weighting rationale for each metric
   - Justify confidence scores based on visual evidence
   - Address data quality limitations and impacts
   - Detail validation recommendations for application

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all metrics and scores
   - Show **confidence index calculation** explicitly
   - Include **weighted scoring** breakdown
   - Use proper markdown table syntax
   - Scores: 92.2/100 format
   - Percentages: 97.2% format

7. **Critical Requirements**  
   - ✓ Lead with comprehensive data quality assessment
   - ✓ Calculate actual confidence index from metrics
   - ✓ Provide weighted scoring with rationale
   - ✓ Assess reliability for target application
   - ✓ Identify data gaps and improvement areas
   - ✓ Make clear accept/reject decision
   - ✓ Provide validation recommendations

8. **Data Quality Analysis Rules**  
   - Use statistical methods for metric calculations
   - Apply appropriate weighting for application
   - Account for measurement uncertainty
   - Consider data completeness and traceability
   - Validate metrics against industry standards
   - Document assumptions and limitations

9. **Tone & Output Style**  
   - Technical and analytical
   - Statistics-focused assessment
   - Quantitative confidence metrics
   - Evidence-based decision making
   - Professional validation reporting

---

## Output Format

Generate the complete data confidence index report following the structure above. Lead with your data quality analysis and integrate confidence calculations throughout the assessment.
`
};
