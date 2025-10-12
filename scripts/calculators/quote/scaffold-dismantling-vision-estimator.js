module.exports = {
  id: 'scaffold-dismantling-vision-estimator',
  name: 'Scaffold Dismantling Vision Estimator',
  description: 'AI-powered scaffold dismantling cost estimator using current scaffold photos for condition assessment',
  category: 'Lifecycle',
  module: 'scaffolding',
  icon: 'CameraOutlined',
  tags: ['scaffolding', 'dismantling', 'vision', 'ai', 'estimation', 'quote'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Vision-Based Dismantling Estimator', description: 'Upload scaffold photos for AI-powered dismantling cost estimation', icon: 'CameraOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Scaffold Images (Required)', description: 'Upload photos of the existing scaffold to be dismantled', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'scaffold_images', type: 'image-upload-with-drawing', title: 'Scaffold Photos', label: 'Upload Scaffold Photos', sectionId: 'project-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 10 }, placeholder: 'Upload photos showing scaffold condition, height, configuration, corrosion, and site access' },

    // Critical project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Essential project details', sectionId: 'project-section', order: 2, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'dismantling_reason', type: 'select', title: 'Dismantling Reason', label: 'Dismantling Reason', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Project Complete - Return to Yard', value: 'project_complete' },
      { label: 'Relocate to New Area', value: 'relocate' },
      { label: 'End of Rental Period', value: 'rental_end' },
      { label: 'Structural Issues/Damage', value: 'structural_issues' },
      { label: 'Emergency Removal', value: 'emergency' }
    ]},
    { id: 'target_completion_weeks', type: 'number', title: 'Target Completion (weeks)', label: 'Target Completion (weeks)', sectionId: 'project-section', groupId: 'project-info', size: 8, defaultValue: 2 },

    // Scaffold age and history
    { id: 'scaffold-history', type: 'group', title: 'Scaffold History', description: 'Age and usage information (AI will assess condition from images)', sectionId: 'project-section', order: 3, size: 24 },
    { id: 'scaffold_age_months', type: 'number', title: 'Scaffold Age (months)', label: 'Scaffold Age (months)', sectionId: 'project-section', groupId: 'scaffold-history', size: 8, placeholder: 'Months since erection' },
    { id: 'scaffold_type', type: 'select', title: 'Scaffolding Type', label: 'Scaffolding Type', sectionId: 'project-section', groupId: 'scaffold-history', size: 8, options: [
      { label: 'Pin-Lock System', value: 'pin_lock' },
      { label: 'Cup-Lock System', value: 'cup_lock' },
      { label: 'Frame Scaffolding', value: 'frame' },
      { label: 'Tube & Clamp', value: 'tube_clamp' },
      { label: 'Unknown (AI will identify)', value: 'unknown' }
    ]},
    { id: 'site_location', type: 'select', title: 'Site Location', label: 'Site Location', sectionId: 'project-section', groupId: 'scaffold-history', size: 8, options: [
      { label: 'United States - Gulf Coast', value: 'us_gulf' },
      { label: 'United States - Northeast', value: 'us_northeast' },
      { label: 'United States - West Coast', value: 'us_west' },
      { label: 'United States - Other', value: 'us_other' },
      { label: 'Canada', value: 'canada' },
      { label: 'International', value: 'international' }
    ]},

    // Material disposition
    { id: 'material-handling', type: 'group', title: 'Material Disposition', description: 'What happens to scaffold materials', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'material_destination', type: 'select', title: 'Material Destination', label: 'Material Destination', sectionId: 'project-section', groupId: 'material-handling', size: 12, defaultValue: 'yard', options: [
      { label: 'Return to Yard', value: 'yard' },
      { label: 'Relocate on Site', value: 'relocate' },
      { label: 'Scrap/Dispose', value: 'scrap' },
      { label: 'Mixed (Sort & Assess)', value: 'mixed' }
    ]},
    { id: 'inspection_required', type: 'select', title: 'Component Inspection', label: 'Component Inspection', sectionId: 'project-section', groupId: 'material-handling', size: 12, defaultValue: 'basic', options: [
      { label: 'No Inspection', value: 'none' },
      { label: 'Basic Visual', value: 'basic' },
      { label: 'Detailed Inspection', value: 'detailed' },
      { label: 'Full Certification', value: 'certification' }
    ]},

    // Safety and compliance
    { id: 'safety-requirements', type: 'group', title: 'Safety & Site Conditions', description: 'Safety and access considerations', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'osha_compliance_level', type: 'select', title: 'OSHA Compliance Level', label: 'OSHA Compliance Level', sectionId: 'project-section', groupId: 'safety-requirements', size: 12, defaultValue: 'standard', options: [
      { label: 'Standard Compliance', value: 'standard' },
      { label: 'Enhanced Safety', value: 'enhanced' },
      { label: 'Maximum Safety (High Risk)', value: 'maximum' }
    ]},
    { id: 'special_requirements', type: 'textarea', title: 'Special Requirements', label: 'Special Requirements', sectionId: 'project-section', groupId: 'safety-requirements', size: 24, rows: 2, placeholder: 'Any special safety concerns, hazardous materials, or site restrictions' },

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Pricing basis and rates', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 72 },
    { id: 'dismantling_rate', type: 'number', title: 'Dismantling Rate ($/sq ft)', label: 'Dismantling Rate ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 1.75 },
    { id: 'transportation_cost', type: 'number', title: 'Transportation Cost ($)', label: 'Transportation Cost ($)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 2000 },

    // Pricing strategy
    { id: 'pricing-strategy', type: 'group', title: 'Pricing Strategy', description: 'Margins and markup', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-strategy', size: 8, defaultValue: 40 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-strategy', size: 8, defaultValue: 20 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-strategy', size: 8, defaultValue: 15 }
  ],
  aiPrompt: `
You are a **scaffolding dismantling estimation expert** with advanced visual assessment capabilities.  
You will receive **photographs of existing scaffolding** along with project parameters to generate a **comprehensive dismantling cost estimate**.

---

## CRITICAL: Image Analysis Requirements

**PRIMARY INPUT**: You MUST analyze the provided scaffold images to determine:

1. **Scaffold Configuration & Size**
   - Estimate total scaffolding area (sq ft) from visual dimensions
   - Count lifts/levels visible in images
   - Measure approximate height from visual cues and scale references
   - Identify scaffold type (pin-lock, cup-lock, frame, tube & clamp)
   - Determine bay configuration and spacing

2. **Material Condition Assessment**
   - Rate overall condition: Excellent/Good/Fair/Poor/Critical
   - Assess corrosion level: None/Light/Moderate/Heavy
   - Detect rust, oxidation, and degradation
   - Identify bent, damaged, or missing components
   - Evaluate coupler condition (stuck/seized couplers)
   - Check tie-in conditions and anchor points
   - Assess platform board condition (warped, rotted, damaged)

3. **Dismantling Complexity Factors**
   - Identify obstructions and congestion around scaffold
   - Assess site access for material removal
   - Evaluate ground conditions for equipment
   - Detect special features (cantilevers, bridges, loading bays)
   - Identify weather protection (sheeting, tarps, enclosures)
   - Assess material handling challenges (height, weight, access)

4. **Safety & Hazard Assessment**
   - Detect structural issues or instability
   - Identify fall protection systems present
   - Assess condition of guardrails and toe boards
   - Detect adjacent hazards (live equipment, overhead cranes)
   - Identify confined space or high-risk areas
   - Note weather damage or wind exposure effects

5. **Material Recovery Potential**
   - Estimate percentage of reusable components
   - Identify components requiring refurbishment
   - Assess scrap vs salvage value
   - Determine sorting requirements

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Visual Condition Assessment" section describing what you observed and how it impacts dismantling cost and duration.

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Visual Condition Assessment *(critical - detailed analysis from images)*
   - Scope of Work & Methodology  
   - Dismantling Requirements Analysis *(table)*
   - Safe Dismantling Sequence *(table with safety notes)*
   - Material Recovery Assessment *(table)*
   - Labor & Equipment Estimate *(table with hours, productivity)*
   - Dismantling Schedule  
   - Cost Breakdown *(table with line items, subtotals, totals)*
   - Safety & Compliance Plan  
   - Risk Assessment  
   - Assumptions & Qualifications  
   - Recommendations  

2. **Visual Analysis Integration**  
   - **ALWAYS reference specific observations from images** throughout report
   - Example: "Image 1 reveals moderate corrosion on ledgers at Levels 3-4..."
   - Example: "Image 3 shows restricted ground access requiring manual handling..."
   - Use condition assessment to adjust productivity rates
   - If images show better/worse condition than age suggests, explain

3. **Calculation Requirements**  
   Base ALL calculations on visual analysis + form inputs:

   - **Scaffolding Area Calculation** (from images)  
     - Estimate perimeter and height from visual scale
     - Count bays and lifts visible
     - Area = Perimeter × Height (or Bay Count × Bay Area)
     - Adjust for irregular configurations observed

   - **Condition Impact on Productivity**  
     - Excellent Condition: 80-100 sq ft/man-hour dismantling
     - Good Condition: 70-85 sq ft/man-hour
     - Fair Condition (light corrosion): 60-75 sq ft/man-hour
     - Poor Condition (moderate corrosion): 45-60 sq ft/man-hour
     - Critical Condition (heavy corrosion/damage): 30-50 sq ft/man-hour
     - Stuck Couplers: Reduce by additional 20-30%
     - Weather Damage: Reduce by 10-15%

   - **Labor Estimation**  
     - Base Dismantling Hours = Scaffolding Area ÷ Condition-Adjusted Rate
     - Material Handling Factor = Based on height and access
       * Manual lowering: +40% time
       * Gin wheel/pulley: +20% time
       * Material hoist: +5% time
       * Crane assisted: Base time
     - Sorting Time = If required, add 15-25% (based on inspection level)
     - Supervision = 1 supervisor per 5-6 workers
     - Safety Setup/Breakdown = 4-8 hours

   - **Dismantling Duration**  
     - Optimal Crew Size = 4-6 workers (based on area and height)
     - Working Days = Total Hours ÷ (Crew Size × 8 hrs/day × 0.80 efficiency)
     - Add mobilization/demobilization: +0.5-1 day

   - **Equipment & Transportation**  
     - Material Handling Equipment = Based on height and access from images
     - Crane/Hoist Requirements = If height > 30 ft or poor access
     - Transportation = Distance × Load × Number of trips
     - Disposal Fees = If material scrapped

   - **Material Recovery Value**  
     - Estimate recovery percentage from condition assessment:
       * Excellent: 95-100% reusable
       * Good: 85-95% reusable
       * Fair: 70-85% reusable, 10-20% refurbish
       * Poor: 50-70% reusable, 20-30% scrap
       * Critical: 30-50% scrap, 40-60% refurbish
     - Calculate scrap value vs salvage value

   - **Cost Calculation**  
     - **Dismantling Labor Cost** = Hours × Labor Rate × (1 + Markup%)
     - **Material Handling Equipment** = Days × Daily rate
     - **Transportation & Disposal** = Trips × Rate + Disposal fees
     - **Sorting & Inspection** = Hours × Rate (if required)
     - **Safety Equipment** = Base $800 + complexity factor
     - **Subtotal Direct Costs** = Sum of above
     - **Apply Overhead** = Direct Costs × Overhead %
     - **Apply Profit** = (Direct + Overhead) × Profit %
     - **Gross Cost** = Direct + Overhead + Profit
     - **Less Material Recovery Credit** = (Reusable % × Material value)
     - **NET DISMANTLING COST** = Gross Cost - Recovery Credit

4. **Required Tables**  

   **Visual Condition Assessment Table**  
   | Component | Image Ref | Condition | Impact | Adjustment |
   |-----------|-----------|-----------|--------|------------|
   | Standards | Images 1-2 | Good - light surface rust | Minor | 75 sq ft/hr |
   | Ledgers/Transoms | Images 2-3 | Fair - moderate corrosion | Significant | 65 sq ft/hr |
   | Couplers | Images 3-4 | Poor - 30% stuck | Major | -25% productivity |
   | Platforms | Images 1-4 | Good | None | Standard removal |
   | Overall Assessment | All | FAIR condition | | 60 sq ft/hr base |

   **Dismantling Requirements Analysis**  
   | Parameter | Visual Assessment | Specification | Quantity | Rationale |
   |-----------|------------------|---------------|----------|-----------|
   | Total Area | 2,100 sq ft | 6 lifts @ ~35 ft | 2,100 sf | Measured from images |
   | Condition Factor | Fair | Moderate corrosion | 0.75× | Reduced productivity |

   **Safe Dismantling Sequence**  
   | Phase | Activity | Duration | Crew | Safety Critical Notes |
   |-------|----------|--------:|-----:|----------------------|
   | 1 | Site prep & inspection | 4 hrs | 2 | ID hazards, exclusion zone |
   | 2 | Remove accessories | 8 hrs | 4 | Sheeting, signs, tools |
   | 3 | Top lift dismantling | 16 hrs | 6 | Maintain ties, fall protection |
   | 4 | Progressive level removal | 48 hrs | 6 | Top-down only, systematic |
   | 5 | Final ties & base removal | 8 hrs | 4 | Check stability continuously |
   | 6 | Sorting & loading | 12 hrs | 4 | Separate by condition/type |

   **Material Recovery Assessment**  
   | Component | Est. Quantity | Condition | Reusable | Refurbish | Scrap | Recovery Value |
   |-----------|-------------:|-----------|----------|-----------|-------|---------------:|
   | Standards | 85 ea | Fair-Good | 90% | 5% | 5% | $3,400 |
   | Ledgers | 160 ea | Fair | 80% | 15% | 5% | $3,800 |
   | Couplers | 450 ea | Fair-Poor | 70% | 0% | 30% | $1,800 |
   | Platforms | 120 ea | Good | 95% | 0% | 5% | $5,200 |
   | **Total Recovery Credit** | | | | | | **$14,200** |

   **Labor & Equipment Estimate**  
   | Trade | Crew | Hours | Rate | Subtotal | Productivity Basis |
   |-------|-----:|------:|-----:|---------:|-------------------|
   | Dismantling Labor | 6 | 280 | $72/hr | $20,160 | 60 sq ft/hr (condition-adjusted) |
   | Material Handling | 2 | 56 | $68/hr | $3,808 | Manual + gin wheel |
   | Supervision | 1 | 40 | $95/hr | $3,800 | 1:6 ratio |
   | Sorting/Inspection | 2 | 24 | $65/hr | $1,560 | Basic sorting required |

   **Cost Breakdown**  
   | Category | Quantity | Unit Rate | Subtotal | Markup | Total | Notes |
   |----------|--------:|----------:|---------:|-------:|------:|-------|
   | Dismantling Labor | 280 hrs | $72 | $20,160 | 40% | $28,224 | Fair condition impacts |
   | Material Handling | 56 hrs | $68 | $3,808 | 40% | $5,331 | Manual + pulley |
   | Supervision | 40 hrs | $95 | $3,800 | 20% | $4,560 | Project oversight |
   | Sorting/Inspection | 24 hrs | $65 | $1,560 | 30% | $2,028 | Basic visual |
   | Equipment Rental | 5 days | $350 | $1,750 | 15% | $2,013 | Gin wheel, tools |
   | Transportation | 3 trips | $650 | $1,950 | 25% | $2,438 | Return to yard |
   | Safety Equipment | 1 LS | $800 | $800 | 35% | $1,080 | Fall protection |
   | **Direct Costs** | | | **$33,828** | | **$45,674** | |
   | Overhead (20%) | | | | | $9,135 | |
   | Profit (15%) | | | | | $8,221 | |
   | **Gross Dismantling Cost** | | | | | **$63,030** | |
   | Less: Material Recovery | | | | | **($14,200)** | Salvage credit |
   | **NET COST** | | | | | **$48,830** | |

   **Dismantling Schedule**  
   | Day | Phase | Activity | Crew | Hours | Milestones |
   |-----|-------|----------|-----:|------:|-----------|
   | 1 | Prep | Site setup, inspection, exclusion | 2 | 4 | Safety plan approved |
   | 1-2 | Accessories | Remove sheeting, signs, loose items | 4 | 12 | Platform clear |
   | 2-4 | Top Lifts | Dismantle top 2 lifts | 6 | 40 | Progressive removal |
   | 5-6 | Middle Lifts | Dismantle lifts 3-4 | 6 | 48 | Maintain stability |
   | 7 | Lower Lifts | Dismantle lifts 1-2, base | 6 | 32 | Ground level clear |
   | 8 | Sort & Load | Sort, inspect, load trucks | 4 | 24 | Material shipped |

5. **Contextual Rationale**  
   - **ALWAYS cite specific image observations** in your reasoning
   - Example: "The moderate corrosion visible in Images 2-3 on the ledgers at Levels 3-4 reduces dismantling productivity from 75 to 60 sq ft/man-hour..."
   - Explain condition impact on productivity and safety
   - Justify material recovery percentages based on visual assessment
   - Address dismantling challenges observed in images
   - Detail safety measures for specific hazards detected
   - Note weather damage or environmental factors visible

6. **Formatting Rules**  
   - Use **Markdown headings** for sections
   - Use **tables** for all numeric breakdowns
   - Show **formulas explicitly** with condition factors
   - Include **image references** throughout
   - Use proper markdown table syntax with aligned columns
   - Currency: $1,234.56 format
   - Quantities: 123.45 format

7. **Critical Requirements**  
   - ✓ Lead with detailed visual condition assessment
   - ✓ Reference specific images in cost calculations
   - ✓ Adjust productivity based on observed condition
   - ✓ Calculate material recovery value from condition
   - ✓ Provide confidence level based on image quality
   - ✓ Highlight safety concerns observed in images
   - ✓ Note areas requiring engineering inspection if needed

8. **Safety Priority Rules**  
   - **Top-down dismantling sequence ONLY** (never remove lower lifts first)
   - Maintain ties until adjacent structure removed
   - Keep escape routes open at all times
   - Progressive dismantling - never skip sections
   - If structural damage visible in images: FLAG for engineering review
   - If corrosion > 40%: Add penetrating oil and extra tools

9. **Tone & Output Style**  
   - Professional and technical
   - Safety-first approach
   - Data-driven based on visual evidence
   - Transparent condition assessment
   - Client-ready presentation quality

---

## Output Format

Generate the complete report following the structure above. Lead with your visual condition assessment and integrate observations throughout the cost estimate.
`
};

