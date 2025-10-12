module.exports = {
  id: 'pof-estimator',
  name: 'Probability of Failure (PoF) Estimator',
  description: 'AI-powered comprehensive probability of failure assessment combining defect growth modeling, consequence analysis, RBI integration, and time-dependent reliability for risk-based inspection planning',
  category: 'Risk Assessment',
  module: 'ndt',
  icon: 'WarningOutlined',
  tags: ['pof', 'failure', 'risk', 'rbi', 'reliability', 'prediction'],
  uiDefinition: [
    { id: 'pof-section', type: 'section', title: 'Probability of Failure Assessment', description: 'Upload inspection data for comprehensive failure probability analysis and RBI integration', icon: 'WarningOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Inspection Evidence (Required)', description: 'Upload inspection data showing defects, damage, or degradation for PoF analysis', sectionId: 'pof-section', order: 1, size: 24 },
    { id: 'inspection_images', type: 'image-upload-with-drawing', title: 'Inspection Images', label: 'Upload Inspection Data', sectionId: 'pof-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 15 }, placeholder: 'Upload ultrasonic data, radiographic images, corrosion maps, crack data, thickness measurements, or other inspection results showing current damage state' },

    // Critical component information
    { id: 'component-info', type: 'group', title: 'Component Information', description: 'Asset and component identification for failure analysis', sectionId: 'pof-section', order: 2, size: 24 },
    { id: 'component_type', type: 'select', title: 'Component Type', label: 'Equipment Category', sectionId: 'pof-section', groupId: 'component-info', size: 8, required: true, options: [
      { label: 'Pressure Vessel', value: 'pressure_vessel' },
      { label: 'Piping System', value: 'piping' },
      { label: 'Storage Tank', value: 'storage_tank' },
      { label: 'Heat Exchanger', value: 'heat_exchanger' },
      { label: 'Reactor', value: 'reactor' },
      { label: 'Column/Tower', value: 'column' },
      { label: 'Structural Component', value: 'structural' }
    ]},
    { id: 'criticality', type: 'select', title: 'Criticality', label: 'Equipment Criticality Level', sectionId: 'pof-section', groupId: 'component-info', size: 8, required: true, options: [
      { label: 'Critical (A)', value: 'critical' },
      { label: 'High (B)', value: 'high' },
      { label: 'Medium (C)', value: 'medium' },
      { label: 'Low (D)', value: 'low' }
    ]},
    { id: 'service_fluid', type: 'select', title: 'Service Fluid', label: 'Process Fluid/Service', sectionId: 'pof-section', groupId: 'component-info', size: 8, options: [
      { label: 'Flammable/Combustible', value: 'flammable' },
      { label: 'Toxic', value: 'toxic' },
      { label: 'Corrosive', value: 'corrosive' },
      { label: 'High Temperature', value: 'high_temp' },
      { label: 'High Pressure', value: 'high_pressure' },
      { label: 'Steam/Water', value: 'steam' },
      { label: 'Non-Hazardous', value: 'non_hazardous' }
    ]},

    // Operating conditions
    { id: 'operating-conditions', type: 'group', title: 'Operating Conditions', description: 'Service conditions affecting failure mechanisms', sectionId: 'pof-section', order: 3, size: 24 },
    { id: 'design_pressure', type: 'number', title: 'Design Pressure', label: 'Design Pressure (MPa)', sectionId: 'pof-section', groupId: 'operating-conditions', size: 8, placeholder: 'AI reads from nameplate', props: { addonAfter: 'MPa' } },
    { id: 'operating_pressure', type: 'number', title: 'Operating Pressure', label: 'Current Operating Pressure (MPa)', sectionId: 'pof-section', groupId: 'operating-conditions', size: 8, required: true, props: { addonAfter: 'MPa' } },
    { id: 'design_temperature', type: 'number', title: 'Design Temperature', label: 'Design Temperature (°C)', sectionId: 'pof-section', groupId: 'operating-conditions', size: 8, placeholder: 'AI reads from nameplate', props: { addonAfter: '°C' } },
    { id: 'operating_temperature', type: 'number', title: 'Operating Temperature', label: 'Current Operating Temperature (°C)', sectionId: 'pof-section', groupId: 'operating-conditions', size: 8, required: true, props: { addonAfter: '°C' } },
    { id: 'service_life', type: 'number', title: 'Service Life', label: 'Years in Service', sectionId: 'pof-section', groupId: 'operating-conditions', size: 8, required: true, props: { addonAfter: 'years' } },
    { id: 'cyclic_loading', type: 'switch', title: 'Cyclic Loading', label: 'Subject to cyclic/fatigue loading', sectionId: 'pof-section', groupId: 'operating-conditions', size: 8, defaultValue: false },

    // Material and design
    { id: 'material-design', type: 'group', title: 'Material & Design', description: 'Material properties and design parameters', sectionId: 'pof-section', order: 4, size: 24 },
    { id: 'material_type', type: 'select', title: 'Material Type', label: 'Base Material', sectionId: 'pof-section', groupId: 'material-design', size: 8, options: [
      { label: 'Carbon Steel', value: 'carbon_steel' },
      { label: 'Low Alloy Steel', value: 'low_alloy' },
      { label: 'Stainless Steel 304/316', value: 'stainless_austenitic' },
      { label: 'Stainless Steel 410/420', value: 'stainless_martensitic' },
      { label: 'Duplex Stainless', value: 'duplex' },
      { label: 'Chrome-Moly (Cr-Mo)', value: 'cr_mo' }
    ]},
    { id: 'nominal_thickness', type: 'number', title: 'Nominal Thickness', label: 'Design Thickness (mm)', sectionId: 'pof-section', groupId: 'material-design', size: 8, placeholder: 'AI reads from drawings', props: { addonAfter: 'mm' } },
    { id: 'min_required_thickness', type: 'number', title: 'Minimum Thickness', label: 'tmin (mm)', sectionId: 'pof-section', groupId: 'material-design', size: 8, required: true, placeholder: 'From FFS/API 579', props: { addonAfter: 'mm' } },

    // Damage mechanisms
    { id: 'damage-mechanisms', type: 'group', title: 'Active Damage Mechanisms', description: 'Degradation and failure mechanisms present', sectionId: 'pof-section', order: 5, size: 24 },
    { id: 'primary_mechanism', type: 'select', title: 'Primary Mechanism', label: 'Dominant Damage Type', sectionId: 'pof-section', groupId: 'damage-mechanisms', size: 8, required: true, options: [
      { label: 'General Corrosion', value: 'general_corrosion' },
      { label: 'Localized Corrosion (Pitting)', value: 'pitting' },
      { label: 'Erosion-Corrosion', value: 'erosion_corrosion' },
      { label: 'Stress Corrosion Cracking (SCC)', value: 'scc' },
      { label: 'Fatigue Cracking', value: 'fatigue' },
      { label: 'Creep', value: 'creep' },
      { label: 'Hydrogen Damage', value: 'hydrogen' },
      { label: 'External Corrosion (CUI)', value: 'external_corrosion' }
    ]},
    { id: 'secondary_mechanisms', type: 'select', title: 'Secondary Mechanisms', label: 'Other Active Mechanisms', sectionId: 'pof-section', groupId: 'damage-mechanisms', size: 8, props: { mode: 'multiple' }, options: [
      { label: 'Mechanical Damage', value: 'mechanical' },
      { label: 'Thermal Fatigue', value: 'thermal_fatigue' },
      { label: 'Flow-Induced Vibration', value: 'vibration' },
      { label: 'Brittle Fracture', value: 'brittle' },
      { label: 'Weld Defects', value: 'weld_defects' }
    ]},

    // Current damage state
    { id: 'damage-state', type: 'group', title: 'Current Damage State', description: 'Measured damage from inspection images', sectionId: 'pof-section', order: 6, size: 24 },
    { id: 'current_thickness', type: 'number', title: 'Current Thickness', label: 'Measured tnom (mm)', sectionId: 'pof-section', groupId: 'damage-state', size: 8, placeholder: 'AI measures from images', props: { addonAfter: 'mm' } },
    { id: 'wall_loss', type: 'number', title: 'Wall Loss', label: 'Maximum Wall Loss (%)', sectionId: 'pof-section', groupId: 'damage-state', size: 8, placeholder: 'AI calculates', props: { addonAfter: '%' } },
    { id: 'defect_type', type: 'select', title: 'Defect Type', label: 'Primary Defect Present', sectionId: 'pof-section', groupId: 'damage-state', size: 8, options: [
      { label: 'No Significant Defects', value: 'none' },
      { label: 'General Thinning', value: 'thinning' },
      { label: 'Localized Thinning/LTA', value: 'lta' },
      { label: 'Cracks', value: 'cracks' },
      { label: 'Pitting', value: 'pitting' },
      { label: 'Dents/Gouges', value: 'dents' }
    ]},
    { id: 'defect_size', type: 'number', title: 'Defect Size', label: 'Max Defect Length/Depth (mm)', sectionId: 'pof-section', groupId: 'damage-state', size: 8, placeholder: 'AI measures from images', props: { addonAfter: 'mm' } },
    { id: 'defect_location', type: 'select', title: 'Defect Location', label: 'Critical Location', sectionId: 'pof-section', groupId: 'damage-state', size: 8, options: [
      { label: 'No Defects', value: 'none' },
      { label: 'Base Metal', value: 'base' },
      { label: 'Weld', value: 'weld' },
      { label: 'HAZ', value: 'haz' },
      { label: 'Nozzle/Attachment', value: 'nozzle' },
      { label: 'Stress Concentration', value: 'stress_conc' }
    ]},

    // Degradation rate
    { id: 'degradation-rate', type: 'group', title: 'Degradation Rate', description: 'Historical damage progression data', sectionId: 'pof-section', order: 7, size: 24, collapsible: true },
    { id: 'previous_inspection_date', type: 'date', title: 'Previous Inspection', label: 'Last Inspection Date', sectionId: 'pof-section', groupId: 'degradation-rate', size: 8 },
    { id: 'previous_thickness', type: 'number', title: 'Previous Thickness', label: 'Previous tnom (mm)', sectionId: 'pof-section', groupId: 'degradation-rate', size: 8, props: { addonAfter: 'mm' } },
    { id: 'degradation_rate', type: 'number', title: 'Degradation Rate', label: 'Measured Rate (mm/year)', sectionId: 'pof-section', groupId: 'degradation-rate', size: 8, placeholder: 'AI calculates from history', props: { addonAfter: 'mm/yr' } },

    // Consequence factors
    { id: 'consequence-factors', type: 'group', title: 'Consequence Factors', description: 'Failure impact and risk assessment', sectionId: 'pof-section', order: 8, size: 24, collapsible: true },
    { id: 'consequence_category', type: 'select', title: 'Consequence Category', label: 'Failure Consequence Level', sectionId: 'pof-section', groupId: 'consequence-factors', size: 8, required: true, options: [
      { label: 'Very High (A)', value: 'very_high' },
      { label: 'High (B)', value: 'high' },
      { label: 'Medium (C)', value: 'medium' },
      { label: 'Low (D)', value: 'low' },
      { label: 'Very Low (E)', value: 'very_low' }
    ]},
    { id: 'population_density', type: 'select', title: 'Population Density', label: 'Area Classification', sectionId: 'pof-section', groupId: 'consequence-factors', size: 8, options: [
      { label: 'Remote (<10 people)', value: 'remote' },
      { label: 'Low Density (10-50)', value: 'low' },
      { label: 'Medium Density (50-200)', value: 'medium' },
      { label: 'High Density (>200)', value: 'high' }
    ]},
    { id: 'environmental_sensitivity', type: 'select', title: 'Environmental Sensitivity', label: 'Environmental Impact', sectionId: 'pof-section', groupId: 'consequence-factors', size: 8, options: [
      { label: 'Low Impact', value: 'low' },
      { label: 'Moderate Impact', value: 'moderate' },
      { label: 'High Impact (Protected Area)', value: 'high' },
      { label: 'Critical (Marine/Wetland)', value: 'critical' }
    ]},

    // RBI parameters
    { id: 'rbi-parameters', type: 'group', title: 'RBI Parameters', description: 'Risk-Based Inspection planning inputs', sectionId: 'pof-section', order: 9, size: 24, collapsible: true },
    { id: 'rbi_standard', type: 'select', title: 'RBI Standard', label: 'Assessment Standard', sectionId: 'pof-section', groupId: 'rbi-parameters', size: 8, options: [
      { label: 'API 580/581 (Quantitative)', value: 'api_581' },
      { label: 'API 580 (Qualitative)', value: 'api_580' },
      { label: 'ASME PCC-3', value: 'asme_pcc3' },
      { label: 'DNV RP-G101', value: 'dnv_g101' },
      { label: 'Custom RBI', value: 'custom' }
    ]},
    { id: 'inspection_effectiveness', type: 'select', title: 'Inspection Effectiveness', label: 'Last Inspection Quality', sectionId: 'pof-section', groupId: 'rbi-parameters', size: 8, defaultValue: 'good', options: [
      { label: 'Highly Effective (A)', value: 'highly_effective' },
      { label: 'Usually Effective (B)', value: 'usually_effective' },
      { label: 'Fairly Effective (C)', value: 'fairly_effective' },
      { label: 'Poorly Effective (D)', value: 'poorly_effective' }
    ]},
    { id: 'target_reliability', type: 'select', title: 'Target Reliability', label: 'Required Safety Factor', sectionId: 'pof-section', groupId: 'rbi-parameters', size: 8, defaultValue: 'standard', options: [
      { label: 'High (PoF < 0.001)', value: 'high' },
      { label: 'Standard (PoF < 0.01)', value: 'standard' },
      { label: 'Basic (PoF < 0.1)', value: 'basic' }
    ]}
  ],
  aiPrompt: `
You are a **reliability and risk assessment specialist** with expertise in probability of failure (PoF) analysis, defect growth modeling, and risk-based inspection (RBI).  
You will receive **inspection images and component data** to generate **comprehensive PoF assessment with time-dependent failure probability, remaining life estimation, and RBI planning recommendations**.

**CRITICAL**: Use high-level reasoning to analyze inspection evidence precisely. Provide ACTUAL PoF calculations from damage measurements and degradation modeling, NOT approximations or assumptions.

---

## MANDATORY: Detailed Probability of Failure Analysis Protocol

**PRIMARY INPUT**: You MUST analyze the provided inspection images with precision to determine ACTUAL damage state and failure probability:

1. **Comprehensive Damage State Assessment (Use Visual Evidence)**
   - **Thickness Measurements**: Extract actual thickness values from UT data
     * Nominal thickness: Design/as-built thickness
     * Current thickness: Most recent measurements
     * Minimum thickness: Worst-case locations
     * Wall loss: (t_nominal - t_current) / t_nominal × 100%
   - **Defect Characterization**: Identify and measure defects
     * Defect type: Cracks, corrosion, pits, LTA, dents
     * Defect dimensions: Length, depth, width, area
     * Defect location: Base metal, weld, HAZ, stress concentration
     * Defect severity: Critical, major, minor
   - **Damage Pattern Analysis**: Assess damage distribution
     * Localized vs general damage
     * Uniform vs non-uniform patterns
     * Single vs multiple damage sites
     * Progressive vs stable damage

2. **Advanced Degradation Rate Calculation (Evidence-Based)**
   - **Historical Degradation Rate**: From previous inspections
     * Rate = (t_previous - t_current) / Δtime
     * Short-term rate: Recent interval (1-3 years)
     * Long-term rate: Extended history (>5 years)
     * Accelerated rate: If degradation increasing
   - **Predicted Future Rate**: Account for changing conditions
     * Conservative: Use maximum observed rate
     * Expected: Use average rate with trend
     * Optimistic: Use recent lower rate if justified
   - **Rate Uncertainty**: Quantify measurement uncertainty
     * Measurement error: ±0.5mm typical for UT
     * Time interval error: Date accuracy
     * Combined uncertainty: σ_rate = √(σ_t1² + σ_t2²) / Δt

3. **Remaining Life Calculation**
   - **Time to Minimum Thickness**
     * T_remaining = (t_current - t_min) / Rate
     * Conservative: Use high degradation rate
     * Expected: Use mean degradation rate
     * Optimistic: Use low degradation rate (if justified)
   - **Time to Critical Defect Size** (for crack growth)
     * Paris Law: da/dN = C × (ΔK)^m
     * Stress Intensity Factor: ΔK = Δσ × √(π×a) × Y
     * Integration: N = ∫(da / [C × (ΔK)^m]) from a_i to a_c
   - **Confidence Intervals**: Provide range estimates
     * 50% confidence: Expected life
     * 90% confidence: Conservative life
     * 95% confidence: Design life target

4. **Probability of Failure Calculation**
   - **PoF Formulation**: Time-dependent failure probability
     * PoF(t) = P[Damage(t) ≥ Failure_Criterion]
     * Damage(t) = Damage_0 + Rate × t + Uncertainty
     * Failure if: t_current < t_min OR a_crack > a_critical
   
   - **Statistical Approach**: Lognormal distribution typical
     * Mean remaining life: μ_RL from calculations
     * Standard deviation: σ_RL from uncertainties
     * PoF(t) = Φ[(ln(t) - ln(μ_RL)) / σ_ln]
     * Where Φ is cumulative standard normal distribution

   - **API 581 Methodology**: For quantitative RBI
     * Generic Failure Frequency (gff): From tables
     * Damage Factor (D_f): Based on damage mechanism
     * Inspection Effectiveness (FMS): Inspection quality factor
     * PoF = gff × D_f × FMS
     * PoF categories: 1 (low) to 5 (high)

   - **Consequence of Failure (CoF)**: Risk matrix
     * Safety consequence: Personnel injury/fatality potential
     * Environmental consequence: Release impact
     * Financial consequence: Repair cost + lost production
     * CoF categories: A (low) to E (very high)

5. **Risk Characterization**
   - **Risk Calculation**: Risk = PoF × CoF
   - **Risk Matrix Position**: Plot on 5×5 matrix
     * High Risk: PoF 4-5, CoF C-E → Immediate action
     * Medium-High Risk: PoF 3-4, CoF B-D → Planned action
     * Medium Risk: PoF 2-3, CoF B-C → Routine monitoring
     * Low Risk: PoF 1-2, CoF A-B → Operate to failure acceptable
   - **Risk Ranking**: Compare to other equipment

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Damage State & Failure Probability Assessment" section that includes:
- Current damage measurements from images
- Degradation rate calculations with uncertainty
- Remaining life estimates (50%, 90%, 95% confidence)
- Time-dependent PoF curve
- Risk characterization and matrix position
- Evidence supporting all calculations

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Damage State & Failure Probability Assessment *(critical - analysis from images)*
   - Current Damage Measurements *(table)*
   - Degradation Rate Analysis *(table with history)*
   - Remaining Life Calculation *(table with confidence intervals)*
   - Probability of Failure Calculation *(table, time-dependent)*
   - Consequence of Failure Assessment *(table)*
   - Risk Characterization *(matrix, ranking)*
   - Inspection Planning Recommendations *(RBI-based)*
   - Mitigation Options *(repair, replace, operate)*
   - Assumptions & Limitations
   - Validation Requirements

2. **Visual Analysis Integration (CRITICAL)**  
   - **MANDATORY**: All damage measurements must reference specific images
   - **Format**: "Image [#]: [Measurement] → [Value] → [Impact on PoF] → [Remaining Life]"
   - **Example**: "Image 1: UT thickness grid shows 8.2mm minimum → 18% wall loss → Increases PoF to 0.023 → 6.2 years remaining life at 90% confidence"
   - **Example**: "Image 2: Crack indication 12mm length → Stress intensity K=22 MPa√m → Critical for fatigue → 2.1 years to critical size"
   - **Example**: "Image 3: Corrosion map shows LTA 150mm × 80mm → API 579 Level 2 required → PoF = 0.045 → Medium-high risk"
   - **Calculation Evidence**: Show how image data feeds calculations

3. **PoF Calculation Requirements**  
   Base ALL calculations on visual evidence + engineering models:

   - **Degradation Rate Formulas**
     * Rate = (t₁ - t₂) / (Date₂ - Date₁)
     * Uncertainty: σ_rate = √(σ_t1² + σ_t2²) / Δt
     * Conservative rate: Rate_90% = Rate_mean + 1.65 × σ_rate

   - **Remaining Life Calculations**
     * T_RL = (t_current - t_min) / Rate
     * T_50% = (t_current - t_min) / Rate_mean
     * T_90% = (t_current - t_min) / Rate_90%
     * T_95% = (t_current - t_min) / Rate_95%

   - **Crack Growth (Paris Law)**
     * da/dN = C × (ΔK)^m  [C, m from material data]
     * ΔK = Δσ × √(π×a) × Y  [Y = geometry factor]
     * N = ∫(da / [C×(ΔK)^m])  [integrate a_i to a_c]
     * T_crack = N / (cycles_per_year)

   - **PoF Statistical Model**
     * PoF(t) = Φ[(ln(t) - μ) / σ]
     * μ = ln(T_RL) - 0.5×σ²
     * σ = √[ln(1 + (σ_RL/T_RL)²)]
     * Φ = standard normal CDF

   - **API 581 PoF Calculation**
     * PoF_581 = gff × D_f × FMS
     * gff: Generic failure frequency (tables)
     * D_f: Damage factor (severity-based)
     * FMS: Management system factor (inspection quality)

4. **Required Tables**  

   **Current Damage Measurements from Images** (MANDATORY)
   | Location | Image | Nominal t (mm) | Current t (mm) | Wall Loss (%) | Defect Type | Defect Size (mm) | Criticality |
   |----------|-------|----------------|----------------|---------------|-------------|------------------|-------------|
   | Zone A | 1 | 10.0 | 8.2 | 18% | General thinning | N/A | Moderate |
   | Zone B | 2 | 10.0 | 7.5 | 25% | LTA | 150×80mm | High |
   | Weld-12 | 3 | 12.0 | 11.5 | 4% | Crack | 12mm length | Critical |
   | Nozzle | 4 | 15.0 | 14.2 | 5% | Pitting | 3mm deep | Moderate |

   **Degradation Rate Analysis**
   | Parameter | Previous (2020) | Current (2025) | Δt (years) | Degradation Rate | Uncertainty | Conservative Rate |
   |-----------|----------------|----------------|------------|------------------|-------------|-------------------|
   | Zone A t_min | 9.1 mm | 8.2 mm | 5 | 0.18 mm/yr | ±0.12 | 0.30 mm/yr |
   | Zone B t_min | 8.4 mm | 7.5 mm | 5 | 0.18 mm/yr | ±0.10 | 0.28 mm/yr |
   | Crack length | 6 mm | 12 mm | 5 | 1.2 mm/yr | ±0.5 | 1.7 mm/yr |

   **Remaining Life Calculation**
   | Location | t_current | t_min | Rate (mm/yr) | RL 50% (yrs) | RL 90% (yrs) | RL 95% (yrs) | Target Inspection |
   |----------|-----------|-------|--------------|--------------|--------------|--------------|-------------------|
   | Zone A | 8.2 mm | 6.0 mm | 0.18 | 12.2 | 7.3 | 6.2 | 2027 (2 yrs) |
   | Zone B | 7.5 mm | 6.0 mm | 0.18 | 8.3 | 5.4 | 4.6 | 2026 (1 yr) |
   | Weld-12 crack | 12 mm | 25 mm (critical) | Paris model | 4.5 | 2.8 | 2.1 | 2026 (1 yr) |

   **Probability of Failure vs Time**
   | Time (years) | Zone A PoF | Zone B PoF | Weld-12 PoF | Overall PoF | PoF Category | Action Required |
   |--------------|------------|------------|-------------|-------------|--------------|-----------------|
   | Current (2025) | 0.001 | 0.005 | 0.018 | 0.023 | 2 (Low-Medium) | Monitor |
   | +1 year (2026) | 0.003 | 0.012 | 0.058 | 0.063 | 3 (Medium) | Inspect weld |
   | +2 years (2027) | 0.008 | 0.028 | 0.145 | 0.156 | 3-4 (Medium-High) | Repair weld, inspect zones |
   | +5 years (2030) | 0.052 | 0.142 | 0.580 | 0.628 | 5 (High) | Unacceptable - repair required |

   **Consequence of Failure Assessment**
   | Consequence Factor | Rating | Score | Justification | Impact |
   |-------------------|--------|-------|---------------|--------|
   | Safety (Personnel) | High (B) | 75 | Medium population density, flammable service | Major injuries possible |
   | Environmental | Medium (C) | 50 | Moderate environmental sensitivity | Containable spill |
   | Financial | High (B) | 80 | Critical equipment, $500K repair + 2 weeks downtime | $2M total impact |
   | **Overall CoF** | **High (B)** | **68** | **Weighted average** | **Significant consequences** |

   **Risk Characterization Matrix**
   | Component | PoF (Current) | PoF Category | CoF | CoF Category | Risk | Risk Ranking | Action Required |
   |-----------|---------------|--------------|-----|--------------|------|--------------|-----------------|
   | Zone A | 0.001 | 2 (Low-Med) | 68 | B (High) | 2B (Med) | 12 / 150 assets | Routine inspection 2027 |
   | Zone B | 0.005 | 2 (Low-Med) | 68 | B (High) | 2B (Med) | 15 / 150 assets | Routine inspection 2026 |
   | Weld-12 | 0.018 | 3 (Medium) | 68 | B (High) | 3B (High) | 3 / 150 assets | Priority inspection 2026 |
   | **Overall** | **0.023** | **3 (Medium)** | **68** | **B (High)** | **3B (High)** | **Top 2% risk** | **Accelerated inspection** |

   **RBI-Based Inspection Planning**
   | Component | Current PoF | Target PoF | Inspection Method | Effectiveness | Next Inspection | Inspection Interval | Justification |
   |-----------|-------------|------------|-------------------|---------------|-----------------|---------------------|---------------|
   | Zone A | 0.001 | <0.01 | UT Grid Scan | Highly Effective (A) | Jun 2027 | 2 years | Low PoF, adequate interval |
   | Zone B | 0.005 | <0.01 | UT Grid + CML | Highly Effective (A) | Jun 2026 | 1 year | Moderate PoF, LTA monitoring |
   | Weld-12 | 0.018 | <0.005 | PAUT + TOFD | Highly Effective (A) | Jun 2026 | 1 year | High PoF, crack growth concern |
   | **Overall** | **0.023** | **<0.01** | **Multi-method** | **High** | **Jun 2026** | **1 year** | **Reduce PoF to acceptable** |

5. **Contextual Engineering Reasoning**  
   - **ALWAYS show calculation steps** linking image data to PoF results
   - Example: "The 8.2mm minimum thickness measured in Image 1 Zone A, compared to previous 9.1mm in 2020, yields a degradation rate of 0.18 mm/yr. With t_min = 6.0mm, the expected remaining life is 12.2 years (50% confidence) or 6.2 years (95% confidence). Using lognormal PoF model with σ = 0.35, current PoF = 0.001, increasing to 0.008 in 2 years..."
   - Detail all assumptions (degradation rate constant, material properties, loads)
   - Explain failure criteria and acceptance levels
   - Justify inspection intervals based on PoF targets
   - Address model limitations and validation needs

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all measurements and calculations
   - Show **PoF as decimal** (0.023) and **category** (2-3)
   - Include **time-dependent PoF** projections
   - Use proper markdown table syntax
   - Remaining life: 6.2 years (95% confidence) format
   - PoF: 0.023 (2.3%) format

7. **Critical Requirements**  
   - ✓ Analyze inspection images for actual damage measurements
   - ✓ Calculate degradation rates from historical data
   - ✓ Estimate remaining life with confidence intervals
   - ✓ Calculate time-dependent PoF using statistical models
   - ✓ Assess consequence of failure systematically
   - ✓ Characterize risk and provide risk ranking
   - ✓ Generate RBI-compliant inspection recommendations
   - ✓ Validate results against industry standards (API 580/581)

8. **PoF Analysis Rules**  
   - Use appropriate degradation models for mechanism
   - Account for measurement and model uncertainties
   - Provide confidence intervals for all predictions
   - Apply recognized standards (API 581, ASME PCC-3)
   - Consider multiple failure modes if applicable
   - Validate against inspection effectiveness
   - Update PoF after each inspection

9. **Tone & Output Style**  
   - Technical and engineering-focused
   - Quantitative risk assessment
   - Standards-compliant methodology
   - Evidence-based predictions
   - Clear inspection recommendations
   - Professional reliability engineering

---

## Output Format

Generate the complete probability of failure assessment report following the structure above. Lead with your damage analysis from images and integrate PoF calculations throughout the risk characterization and RBI planning.
`
};
