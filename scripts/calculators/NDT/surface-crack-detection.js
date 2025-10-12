module.exports = {
  id: 'surface-crack-detection',
  name: 'LPT/MPT Crack Indication Detection',
  description: 'AI-powered comprehensive surface crack detection and sizing using liquid penetrant and magnetic particle testing images for automated crack analysis, pattern recognition, and severity assessment',
  category: 'AI Vision Analysis',
  module: 'ndt',
  icon: 'BranchesOutlined',
  tags: ['lpt', 'mpt', 'surface-cracks', 'penetrant', 'magnetic', 'vision', 'crack-sizing'],
  uiDefinition: [
    { id: 'surface-section', type: 'section', title: 'Surface Crack Detection & Analysis', description: 'Upload LPT/MPT images for comprehensive automated surface crack detection and sizing', icon: 'BranchesOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Surface Testing Images (Required)', description: 'Upload penetrant or magnetic particle testing images for crack analysis', sectionId: 'surface-section', order: 1, size: 24 },
    { id: 'surface_images', type: 'image-upload-with-drawing', title: 'LPT/MPT Images', label: 'Upload Surface Images', sectionId: 'surface-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 15 }, placeholder: 'Upload liquid penetrant testing or magnetic particle testing images showing surface crack indications, with scale references or measurement markers' },

    // Critical test parameters
    { id: 'test-parameters', type: 'group', title: 'Test Parameters', description: 'Surface testing method and setup details', sectionId: 'surface-section', order: 2, size: 24 },
    { id: 'test_method', type: 'select', title: 'Test Method', label: 'Surface Testing Method', sectionId: 'surface-section', groupId: 'test-parameters', size: 8, required: true, options: [
      { label: 'LPT - Visible Dye', value: 'lpt_visible' },
      { label: 'LPT - Fluorescent', value: 'lpt_fluorescent' },
      { label: 'MPT - Dry Powder', value: 'mpt_dry' },
      { label: 'MPT - Wet Suspension', value: 'mpt_wet' },
      { label: 'MPT - Fluorescent', value: 'mpt_fluorescent' },
      { label: 'Combined LPT/MPT', value: 'combined' }
    ]},
    { id: 'penetrant_type', type: 'select', title: 'Penetrant Type', label: 'Penetrant Sensitivity', sectionId: 'surface-section', groupId: 'test-parameters', size: 8, options: [
      { label: 'Type I - Fluorescent', value: 'type_i' },
      { label: 'Type II - Visible (Red)', value: 'type_ii' },
      { label: 'Level 1 - Low Sensitivity', value: 'level_1' },
      { label: 'Level 2 - Medium Sensitivity', value: 'level_2' },
      { label: 'Level 3 - High Sensitivity', value: 'level_3' },
      { label: 'Level 4 - Ultra-High Sensitivity', value: 'level_4' }
    ], watchField: 'test_method', showWhen: ['lpt_visible', 'lpt_fluorescent'] },
    { id: 'magnetization_method', type: 'select', title: 'Magnetization Method', label: 'MPT Technique', sectionId: 'surface-section', groupId: 'test-parameters', size: 8, options: [
      { label: 'Continuous Current', value: 'continuous' },
      { label: 'Residual Field', value: 'residual' },
      { label: 'Yoke Method', value: 'yoke' },
      { label: 'Prod Method', value: 'prod' },
      { label: 'Coil Method', value: 'coil' }
    ], watchField: 'test_method', showWhen: ['mpt_dry', 'mpt_wet', 'mpt_fluorescent'] },

    // Component and crack context
    { id: 'component-context', type: 'group', title: 'Component Information', description: 'Component and material details for crack analysis context', sectionId: 'surface-section', order: 3, size: 24 },
    { id: 'component_type', type: 'select', title: 'Component Type', label: 'Component Category', sectionId: 'surface-section', groupId: 'component-context', size: 8, options: [
      { label: 'Weld Joint', value: 'weld_joint' },
      { label: 'Weld Toe/Root', value: 'weld_toe' },
      { label: 'Base Material', value: 'base_material' },
      { label: 'Heat Affected Zone (HAZ)', value: 'haz' },
      { label: 'Casting', value: 'casting' },
      { label: 'Forging', value: 'forging' },
      { label: 'Machined Surface', value: 'machined' }
    ]},
    { id: 'material_type', type: 'select', title: 'Material Type', label: 'Base Material', sectionId: 'surface-section', groupId: 'component-context', size: 8, options: [
      { label: 'Carbon Steel', value: 'carbon_steel' },
      { label: 'Stainless Steel (Ferritic)', value: 'stainless_ferritic' },
      { label: 'Stainless Steel (Austenitic)', value: 'stainless_austenitic' },
      { label: 'Aluminum Alloy', value: 'aluminum' },
      { label: 'Titanium', value: 'titanium' },
      { label: 'Nickel Alloy', value: 'nickel' }
    ]},
    { id: 'surface_condition', type: 'select', title: 'Surface Condition', label: 'Surface Preparation', sectionId: 'surface-section', groupId: 'component-context', size: 8, options: [
      { label: 'As-Welded', value: 'as_welded' },
      { label: 'Ground', value: 'ground' },
      { label: 'Machined', value: 'machined' },
      { label: 'Shot Blasted', value: 'shot_blast' },
      { label: 'Polished', value: 'polished' },
      { label: 'Corroded/Rough', value: 'corroded' }
    ]},

    // Crack type and characteristics
    { id: 'crack-characteristics', type: 'group', title: 'Crack Characteristics', description: 'Expected crack types and service conditions', sectionId: 'surface-section', order: 4, size: 24 },
    { id: 'crack_type', type: 'select', title: 'Expected Crack Type', label: 'Primary Crack Mechanism', sectionId: 'surface-section', groupId: 'crack-characteristics', size: 8, options: [
      { label: 'All Surface Cracks', value: 'all' },
      { label: 'Fatigue Cracks', value: 'fatigue' },
      { label: 'Stress Corrosion Cracks (SCC)', value: 'scc' },
      { label: 'Weld Hot Cracks', value: 'hot_cracks' },
      { label: 'Weld Cold Cracks', value: 'cold_cracks' },
      { label: 'Heat Treatment Cracks', value: 'heat_treat' },
      { label: 'Grinding Cracks', value: 'grinding' },
      { label: 'Hydrogen Cracks', value: 'hydrogen' }
    ]},
    { id: 'service_environment', type: 'select', title: 'Service Environment', label: 'Operating Conditions', sectionId: 'surface-section', groupId: 'crack-characteristics', size: 8, options: [
      { label: 'Ambient/Dry', value: 'ambient' },
      { label: 'High Temperature', value: 'high_temp' },
      { label: 'Corrosive Environment', value: 'corrosive' },
      { label: 'Marine/Seawater', value: 'marine' },
      { label: 'Sour Service (H2S)', value: 'sour' },
      { label: 'Cyclic Loading', value: 'cyclic' }
    ]},
    { id: 'service_life', type: 'number', title: 'Service Life', label: 'Years in Service', sectionId: 'surface-section', groupId: 'crack-characteristics', size: 8, defaultValue: 10, props: { addonAfter: 'years' } },

    // Detection parameters
    { id: 'detection-parameters', type: 'group', title: 'Detection Parameters', description: 'AI crack detection and sizing settings', sectionId: 'surface-section', order: 5, size: 24, collapsible: true },
    { id: 'detection_sensitivity', type: 'select', title: 'Detection Sensitivity', label: 'AI Detection Level', sectionId: 'surface-section', groupId: 'detection-parameters', size: 8, defaultValue: 'standard', options: [
      { label: 'High (Conservative)', value: 'high' },
      { label: 'Standard (Balanced)', value: 'standard' },
      { label: 'Low (Aggressive)', value: 'low' }
    ]},
    { id: 'min_crack_length', type: 'number', title: 'Minimum Crack Length', label: 'Min Reportable Length (mm)', sectionId: 'surface-section', groupId: 'detection-parameters', size: 8, defaultValue: 0.5, props: { addonAfter: 'mm' } },
    { id: 'confidence_threshold', type: 'number', title: 'Confidence Threshold', label: 'Minimum Confidence (%)', sectionId: 'surface-section', groupId: 'detection-parameters', size: 8, defaultValue: 80, props: { addonAfter: '%' } },
    { id: 'crack_network_analysis', type: 'switch', title: 'Crack Network Analysis', label: 'Analyze interconnected crack patterns', sectionId: 'surface-section', groupId: 'detection-parameters', size: 8, defaultValue: true },

    // Acceptance criteria
    { id: 'acceptance-criteria', type: 'group', title: 'Acceptance Criteria', description: 'Surface crack acceptance standards', sectionId: 'surface-section', order: 6, size: 24, collapsible: true },
    { id: 'acceptance_standard', type: 'select', title: 'Acceptance Standard', label: 'Evaluation Standard', sectionId: 'surface-section', groupId: 'acceptance-criteria', size: 12, options: [
      { label: 'ASME Sec V (General)', value: 'asme_v' },
      { label: 'ASME Sec VIII (Pressure Vessels)', value: 'asme_viii' },
      { label: 'AWS D1.1 (Structural Steel)', value: 'aws_d11' },
      { label: 'API 650 (Storage Tanks)', value: 'api_650' },
      { label: 'ASTM E1417 (LPT)', value: 'astm_e1417' },
      { label: 'ASTM E1444 (MPT)', value: 'astm_e1444' },
      { label: 'EN ISO 3452 (LPT)', value: 'en_3452' },
      { label: 'EN ISO 9934 (MPT)', value: 'en_9934' }
    ]},
    { id: 'max_allowable_length', type: 'number', title: 'Maximum Allowable Length', label: 'Max Acceptable Length (mm)', sectionId: 'surface-section', groupId: 'acceptance-criteria', size: 12, placeholder: 'Per standard or custom', props: { addonAfter: 'mm' } }
  ],
  aiPrompt: `
You are a **surface testing specialist** with advanced AI vision capabilities for comprehensive LPT/MPT crack detection, pattern analysis, and sizing.  
You will receive **surface testing images** along with test parameters to generate **detailed automated crack analysis with length measurements, branching assessment, and acceptance evaluation**.

**CRITICAL**: Use high-level reasoning to analyze surface testing images precisely. Provide ACTUAL crack detection from indication patterns, NOT approximations or assumptions.

---

## MANDATORY: Detailed Surface Crack Detection Protocol

**PRIMARY INPUT**: You MUST analyze the provided LPT/MPT images with precision using advanced crack pattern recognition:

1. **Comprehensive Indication Analysis (Use Visual References)**
   - **Indication Detection**: Identify all crack-like indications from penetrant or particle patterns
   - **Color/Contrast Assessment**: Evaluate indication visibility and contrast
     * LPT visible: Red dye against white background
     * LPT fluorescent: Bright yellow-green glow under UV
     * MPT: Dark particle accumulations on light background
   - **Background Quality**: Assess background cleanliness and penetrant removal
   - **Scale References**: Identify measurement scales, rulers, or grid patterns
   - **Location Markers**: Note reference points, weld centerlines, and orientation markers

2. **Advanced Crack Pattern Recognition (AI Evidence-Based)**
   - **Single Linear Cracks**: Individual straight or slightly curved cracks
     * Length measurement end-to-end
     * Width assessment (hairline, fine, wide)
     * Orientation relative to stress direction
     * Crack tip characteristics (sharp, blunt, branched)
   - **Branched Cracks**: Primary crack with secondary branches
     * Main crack length and orientation
     * Branch count and locations
     * Branch angles and lengths
     * Total crack network extent
   - **Multiple Parallel Cracks**: Array of cracks in similar orientation
     * Individual crack lengths
     * Spacing between cracks
     * Pattern regularity or randomness
     * Collective crack density
   - **Networked/Interconnected Cracks**: Complex crack systems
     * Primary crack paths
     * Interconnection points
     * Total network area affected
     * Severity based on interconnection degree
   - **Star/Radial Cracks**: Cracks emanating from central point
     * Number of radial arms
     * Maximum radial extent
     * Potential stress concentration point
     * Impact or inclusion source

3. **Precise Crack Sizing (AI Measurement)**
   - **Length Measurement**: Accurate crack length using scale references
     * End-to-end measurement along crack path
     * Curved crack: Follow crack centerline
     * Branched crack: Main length plus branch lengths
     * Network crack: Longest continuous path
   - **Width Assessment**: Crack opening estimation
     * Hairline: <0.1mm (barely visible)
     * Fine: 0.1-0.5mm (clearly visible)
     * Moderate: 0.5-1.0mm (significant opening)
     * Wide: >1.0mm (large opening)
   - **Depth Indication**: Surface vs potential subsurface
     * Sharp, well-defined: Likely surface breaking
     * Fuzzy, diffuse: May indicate roughness or subsurface
     * Bright/strong indication: Deep and/or open crack
     * Weak indication: Tight or shallow crack

4. **Crack Pattern Classification**
   - **Fatigue Cracks**: Single or multiple, perpendicular to stress, semi-circular patterns
   - **SCC**: Branched networks, transgranular or intergranular patterns
   - **Hot Cracks**: Centerline in welds, short branched patterns
   - **Cold Cracks**: Transverse in HAZ, straight to slightly curved
   - **Grinding Cracks**: Multiple parallel, shallow, uniform spacing
   - **Thermal Cracks**: Random orientation, short interconnected

5. **Severity Assessment & Risk Evaluation**
   - **Crack Severity Factors**:
     * Length (longer = more severe)
     * Branching (branched = more severe)
     * Network formation (interconnected = critical)
     * Location (weld toe, stress concentration = critical)
     * Orientation (perpendicular to stress = critical)
   - **Risk Classification**:
     * Critical: >25mm, branched/networked, critical location
     * Major: 10-25mm, multiple parallel, moderate location
     * Minor: <10mm, single, non-critical location
     * Negligible: <3mm, isolated, low stress area

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Surface Crack Detection Analysis" section that includes:
- Confidence level (High/Medium/Low) for each crack detection
- Scale references and measurement methods used
- Specific crack findings from each image with locations
- Crack-by-crack analysis with pattern classification
- Evidence supporting each severity assessment
- Areas requiring additional PT/MT or validation

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Surface Crack Detection Analysis *(critical - detailed analysis from images)*
   - Test Technique Assessment *(table with quality)*
   - Crack Detection Results *(table with all detected cracks)*
   - Crack Pattern Analysis *(table with classifications)*
   - Crack Sizing & Measurements *(table)*
   - Severity Assessment *(table with risk levels)*
   - Acceptance Evaluation *(table with accept/reject)*
   - Repair Recommendations *(prioritized actions)*
   - Standards Compliance Assessment
   - Recommendations & Validation Requirements
   - Limitations & Follow-up Testing

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: Every crack detection must reference specific image evidence with locations
   - **Format**: "Image [#] at [location]: [Crack pattern] → [Classification] → [Sizing] → [Severity] → [Acceptance]"
   - **Example**: "Image 1 at weld toe: Linear indication 18mm length → Classified as fatigue crack → 18.2±1.5mm → Major severity → Repair required"
   - **Example**: "Image 2 near heat treatment: Branched pattern with 3 branches → Classified as thermal cracking → Main 12mm + branches 8mm → Critical → Reject"
   - **Example**: "Image 3 on machined surface: 5 parallel indications → Classified as grinding cracks → 2-4mm each → Minor → Monitor"
   - **AI Confidence**: State AI confidence level for each detection with reasoning
   - **Pattern Recognition**: Explain crack morphology and classification logic

3. **Crack Measurement Requirements**  
   Base ALL measurements on visual analysis with scale references:

   - **Length Measurement Formulas**
     * Straight crack: L = Direct end-to-end measurement
     * Curved crack: L = Σ(segment lengths) along path
     * Branched crack: L_total = L_main + Σ(L_branches)
     * Network crack: L_effective = Longest continuous path

   - **Crack Density Calculations**
     * Linear density: ρ_L = N_cracks / Length (cracks/m)
     * Area density: ρ_A = N_cracks / Area (cracks/m²)
     * Total crack length: Σ(L_i) for all cracks

   - **Network Parameters**
     * Branch ratio: R_b = N_branches / N_primary
     * Interconnection degree: D_i = N_connections / N_cracks
     * Network coverage: A_network / A_inspected

4. **Required Tables**  

   **Test Technique Assessment** (MANDATORY)
   | Image | Method | Penetrant/Particle Type | Background Quality | Contrast | Technique Rating | Compliance | Notes |
   |-------|--------|------------------------|-------------------|----------|------------------|------------|-------|
   | 1 | LPT Visible | Type II, Level 3 | Excellent | High | Excellent | Pass ASTM E1417 | Clean background |
   | 2 | MPT Fluorescent | Wet suspension | Good | Very High | Good | Pass ASTM E1444 | UV lighting good |
   | 3 | LPT Fluorescent | Type I, Level 4 | Fair | Moderate | Fair | Marginal | Some background |

   **Surface Crack Detection Results** (MANDATORY)
   | Image | Location | Crack Pattern | Length (mm) | Width | Orientation | AI Confidence | Classification Evidence | Severity |
   |-------|----------|---------------|-------------|-------|-------------|---------------|------------------------|----------|
   | 1 | Weld toe | Linear | 18.2±1.5 | Fine | Transverse | 94% | Single crack, perpendicular to weld | Major |
   | 2 | HAZ | Branched | 12+8mm | Moderate | Multi-directional | 91% | Main crack + 3 branches | Critical |
   | 3 | Base metal | Multiple parallel | 2-4mm each | Hairline | Longitudinal | 87% | 5 parallel cracks, 8mm spacing | Minor |
   | 4 | Weld centerline | Star pattern | 15mm radial | Fine | Radial (5 arms) | 89% | Central point, radiating cracks | Major |

   **Crack Pattern Analysis**
   | Pattern Type | Count | Percentage | Total Length (mm) | Avg Length (mm) | Typical Cause | Action Required |
   |--------------|-------|------------|-------------------|-----------------|---------------|-----------------|
   | Single Linear | 12 | 55% | 156.2 | 13.0 | Fatigue | Repair >10mm |
   | Branched | 4 | 18% | 68.4 | 17.1 | SCC/Thermal | All repair |
   | Multiple Parallel | 3 | 14% | 18.6 | 2.1 | Grinding | Monitor |
   | Networked | 2 | 9% | 45.8 | 22.9 | SCC | Critical repair |
   | Star/Radial | 1 | 4% | 15.0 | 15.0 | Impact | Investigate |
   | **Total** | **22** | **100%** | **304.0** | **13.8** | **Mixed** | **Varies** |

   **Severity Assessment & Risk Evaluation**
   | Crack ID | Length (mm) | Pattern | Location | Stress Level | Risk Score | Severity | Priority | Action |
   |----------|-------------|---------|----------|--------------|------------|----------|----------|--------|
   | C001 | 18.2 | Linear | Weld toe | High | 8.5/10 | Major | High | Repair |
   | C002 | 20.1 | Branched | HAZ | Very High | 9.2/10 | Critical | Critical | Immediate repair |
   | C003 | 3.2 | Parallel (5x) | Base | Low | 3.1/10 | Minor | Low | Monitor |
   | C004 | 15.0 | Star | Weld CL | Medium | 7.0/10 | Major | Medium | Repair + investigate |

   **Acceptance Evaluation per AWS D1.1**
   | Crack ID | Type | Size (mm) | Location | Allowable | Status | Repair Method | Priority | Cost Impact |
   |----------|------|-----------|----------|-----------|--------|---------------|----------|-------------|
   | C001 | Linear | 18.2 | Weld toe | Not permitted | Reject | Grind/repair | High | Medium |
   | C002 | Branched | 20.1 (total) | HAZ | Not permitted | Reject | Remove/re-weld | Critical | High |
   | C003 | Parallel | 2-4 | Base | <6mm acceptable | Accept | Monitor | Low | None |
   | C004 | Star | 15.0 | Weld | Not permitted | Reject | Repair + review | High | Medium-High |

5. **Contextual AI Reasoning**  
   - **ALWAYS explain crack pattern recognition logic** for each detection
   - Example: "The 18.2mm linear crack at the weld toe in Image 1 with fine width and transverse orientation matches the characteristic signature of fatigue cracking, with 94% AI confidence based on crack morphology and location..."
   - Detail measurement methodology using visible scale references
   - Explain pattern classification based on morphology and context
   - Address detection challenges (background interference, indication quality)
   - Note areas where complementary NDT (UT, PAUT) recommended for depth assessment

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all detection results and assessments
   - Show **measurement uncertainty** (±values) and AI confidence
   - Include **location references** with detailed descriptions
   - Use proper markdown table syntax with aligned columns
   - Lengths: 18.2±1.5 mm format
   - Widths: Hairline/Fine/Moderate/Wide descriptors

7. **Critical Requirements**  
   - ✓ Lead with comprehensive surface testing image analysis
   - ✓ Reference specific images and locations for all crack detections
   - ✓ Provide AI confidence levels for all assessments
   - ✓ Classify crack patterns using standard terminology
   - ✓ Size cracks with measurement uncertainty
   - ✓ Assess severity based on multiple factors
   - ✓ Evaluate acceptance against specified standard
   - ✓ Prioritize repair actions based on risk

8. **Surface Testing Analysis Rules**  
   - Apply crack pattern recognition algorithms specific to LPT/MPT
   - Use indication morphology for crack classification
   - Account for surface roughness effects on indications
   - Consider crack orientation relative to stress fields
   - Validate findings against expected crack mechanisms
   - Document technique adequacy and limitations

9. **Tone & Output Style**  
   - Technical and specialized for surface testing
   - Pattern-recognition focused
   - AI-assisted but expert-validated approach
   - Quantitative crack assessments with risk-based prioritization
   - Standards-compliant crack evaluation

---

## Output Format

Generate the complete surface crack detection report following the structure above. Lead with your LPT/MPT-specific AI analysis and integrate crack pattern recognition results throughout the assessment.
`
};
