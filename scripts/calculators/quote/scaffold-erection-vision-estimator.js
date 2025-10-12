module.exports = {
  id: 'scaffold-erection-vision-estimator',
  name: 'Scaffold Erection Vision Estimator',
  description: 'AI-powered scaffold erection cost estimator using site photos with pin-lock system specifications',
  category: 'Lifecycle',
  module: 'scaffolding',
  icon: 'CameraOutlined',
  tags: ['scaffolding', 'erection', 'vision', 'ai', 'estimation', 'quote'],
  uiDefinition: [
    { id: 'project-section', type: 'section', title: 'Vision-Based Erection Estimator', description: 'Upload site photos for AI-powered erection cost estimation', icon: 'CameraOutlined', order: 1, size: 24 },

    // Image upload - REQUIRED
    { id: 'image-group', type: 'group', title: 'Site Images (Required)', description: 'Upload photos of the structure requiring scaffolding', sectionId: 'project-section', order: 1, size: 24 },
    { id: 'site_images', type: 'image-upload-with-drawing', title: 'Site Photos', label: 'Upload Site Photos', sectionId: 'project-section', groupId: 'image-group', size: 24, required: true, props: { accept: 'image/*', multiple: true, clientOnly: true, maxCount: 10 }, placeholder: 'Upload photos showing structure, height, access points, and site conditions' },

    // Critical project information
    { id: 'project-info', type: 'group', title: 'Project Information', description: 'Essential project details', sectionId: 'project-section', order: 2, size: 24 },
    { id: 'project_name', type: 'text', title: 'Project Name', label: 'Project Name', sectionId: 'project-section', groupId: 'project-info', size: 8, placeholder: 'Enter project name' },
    { id: 'work_type', type: 'select', title: 'Work Type', label: 'Work Type', sectionId: 'project-section', groupId: 'project-info', size: 8, options: [
      { label: 'Fireproofing Application', value: 'fireproofing' },
      { label: 'Maintenance Access', value: 'maintenance' },
      { label: 'Capital Project', value: 'capital' },
      { label: 'Outage/Turnaround', value: 'outage' },
      { label: 'Emergency Repair', value: 'emergency' }
    ]},
    { id: 'project_duration_weeks', type: 'number', title: 'Project Duration (weeks)', label: 'Project Duration (weeks)', sectionId: 'project-section', groupId: 'project-info', size: 8, defaultValue: 4 },

    // Critical structure information
    { id: 'structure-basics', type: 'group', title: 'Structure Basics', description: 'Key structure information (AI will enhance from images)', sectionId: 'project-section', order: 3, size: 24 },
    { id: 'structure_type', type: 'select', title: 'Structure Type', label: 'Structure Type', sectionId: 'project-section', groupId: 'structure-basics', size: 8, options: [
      { label: 'Process Unit', value: 'process_unit' },
      { label: 'Storage Tank', value: 'storage_tank' },
      { label: 'Pipe Rack', value: 'pipe_rack' },
      { label: 'Building Frame', value: 'building_frame' },
      { label: 'Equipment Structure', value: 'equipment_structure' },
      { label: 'Vessel/Tower', value: 'vessel_tower' }
    ]},
    { id: 'approximate_height_ft', type: 'number', title: 'Approximate Height (ft)', label: 'Approximate Height (ft)', sectionId: 'project-section', groupId: 'structure-basics', size: 8, placeholder: 'AI will refine from images' },
    { id: 'site_location', type: 'select', title: 'Site Location', label: 'Site Location', sectionId: 'project-section', groupId: 'structure-basics', size: 8, options: [
      { label: 'United States - Gulf Coast', value: 'us_gulf' },
      { label: 'United States - Northeast', value: 'us_northeast' },
      { label: 'United States - West Coast', value: 'us_west' },
      { label: 'United States - Other', value: 'us_other' },
      { label: 'Canada', value: 'canada' },
      { label: 'International', value: 'international' }
    ]},

    // Scaffolding system preferences
    { id: 'system-specs', type: 'group', title: 'Scaffolding System', description: 'Preferred system specifications', sectionId: 'project-section', order: 4, size: 24, collapsible: true },
    { id: 'scaffolding_type', type: 'select', title: 'Scaffolding Type', label: 'Scaffolding Type', sectionId: 'project-section', groupId: 'system-specs', size: 12, defaultValue: 'pin_lock', options: [
      { label: 'Pin-Lock System (Recommended)', value: 'pin_lock' },
      { label: 'Cup-Lock System', value: 'cup_lock' },
      { label: 'Frame Scaffolding', value: 'frame' },
      { label: 'Tube & Clamp', value: 'tube_clamp' }
    ]},
    { id: 'load_requirements', type: 'select', title: 'Load Requirements', label: 'Load Requirements', sectionId: 'project-section', groupId: 'system-specs', size: 12, defaultValue: 'medium', options: [
      { label: 'Light Duty (25 psf)', value: 'light' },
      { label: 'Medium Duty (50 psf)', value: 'medium' },
      { label: 'Heavy Duty (75 psf)', value: 'heavy' },
      { label: 'Special Loading', value: 'special' }
    ]},

    // Safety and compliance
    { id: 'safety-requirements', type: 'group', title: 'Safety & Compliance', description: 'Safety system requirements', sectionId: 'project-section', order: 5, size: 24, collapsible: true },
    { id: 'osha_compliance_level', type: 'select', title: 'OSHA Compliance Level', label: 'OSHA Compliance Level', sectionId: 'project-section', groupId: 'safety-requirements', size: 12, defaultValue: 'standard', options: [
      { label: 'Standard Compliance', value: 'standard' },
      { label: 'Enhanced Safety', value: 'enhanced' },
      { label: 'Maximum Safety', value: 'maximum' }
    ]},
    { id: 'special_requirements', type: 'textarea', title: 'Special Requirements', label: 'Special Requirements', sectionId: 'project-section', groupId: 'safety-requirements', size: 24, rows: 2, placeholder: 'Any special safety, access, or site requirements' },

    // Cost parameters
    { id: 'cost-parameters', type: 'group', title: 'Cost Parameters', description: 'Pricing basis and rates', sectionId: 'project-section', order: 6, size: 24, collapsible: true },
    { id: 'labor_rate_per_hour', type: 'number', title: 'Labor Rate ($/hour)', label: 'Labor Rate ($/hour)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 72 },
    { id: 'scaffolding_rental_rate', type: 'number', title: 'Rental Rate ($/sq ft/month)', label: 'Rental Rate ($/sq ft/month)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 1.25 },
    { id: 'erection_rate', type: 'number', title: 'Erection Rate ($/sq ft)', label: 'Erection Rate ($/sq ft)', sectionId: 'project-section', groupId: 'cost-parameters', size: 8, defaultValue: 2.50 },

    // Pricing strategy
    { id: 'pricing-strategy', type: 'group', title: 'Pricing Strategy', description: 'Margins and markup', sectionId: 'project-section', order: 7, size: 24, collapsible: true },
    { id: 'labor_markup_percent', type: 'number', title: 'Labor Markup (%)', label: 'Labor Markup (%)', sectionId: 'project-section', groupId: 'pricing-strategy', size: 8, defaultValue: 45 },
    { id: 'overhead_percentage', type: 'number', title: 'Overhead (%)', label: 'Overhead (%)', sectionId: 'project-section', groupId: 'pricing-strategy', size: 8, defaultValue: 22 },
    { id: 'profit_margin_percent', type: 'number', title: 'Profit Margin (%)', label: 'Profit Margin (%)', sectionId: 'project-section', groupId: 'pricing-strategy', size: 8, defaultValue: 18 }
  ],
  aiPrompt: `
You are a **scaffolding erection estimation expert** with advanced visual analysis capabilities.  
You will receive **site photographs** along with some project parameters to generate a **comprehensive erection cost estimate**.

---

## CRITICAL: Image Analysis Requirements

**PRIMARY INPUT**: You MUST analyze the provided site images to determine:

1. **Structure Dimensions & Configuration**
   - Measure/estimate actual height, width, and depth from visual cues
   - Identify structure type (process unit, tank, pipe rack, etc.)
   - Count levels, platforms, and access points needed
   - Detect obstructions, congestion, and complexity factors

2. **Site Conditions & Access**
   - Assess ground conditions (paved, gravel, soil, slope)
   - Identify access constraints (gates, overhead lines, equipment)
   - Evaluate material staging areas and laydown space
   - Detect environmental factors (exposure, weather protection needs)

3. **Scaffolding Requirements**
   - Determine optimal bay configuration and lift heights
   - Calculate required scaffolding area (sq ft)
   - Identify special features needed (cantilevers, bridges, loading bays)
   - Assess tie-in points and structural support locations
   - Determine number of lifts and platform levels

4. **Work Complexity Assessment**
   - Rate complexity: simple/moderate/complex/very complex
   - Identify congestion level and working clearances
   - Detect hazards (hot equipment, overhead cranes, live operations)
   - Assess material handling challenges

5. **Safety & Compliance Needs**
   - Identify fall protection requirements
   - Determine guardrail, toe board, and netting needs
   - Assess access stair/ladder locations
   - Detect confined space or special hazard areas

**IMAGE ANALYSIS OUTPUT**: Begin your report with a detailed "Visual Analysis Summary" section describing what you observed in the images and how it informed your estimates.

---

## Instructions for Report Generation

1. **Report Structure**  
   Always follow this structure:  
   - Executive Summary  
   - Visual Analysis Summary *(critical - describe what you see in images)*
   - Scope of Work & Methodology  
   - Erection Requirements Analysis *(table)*
   - Material Takeoff (MTO) *(table based on visual analysis)*
   - Labor & Equipment Estimate *(table with crew, hours, productivity)*
   - Erection Schedule & Sequencing  
   - Cost Breakdown *(table with line items, subtotals, totals)*
   - Safety & Compliance Plan  
   - Risk Assessment  
   - Assumptions & Qualifications  
   - Recommendations  

2. **Visual Analysis Integration**  
   - **ALWAYS reference specific observations from the images** in your calculations
   - Example: "From Image 1, the structure shows 4 visible levels with pipe congestion..."
   - Example: "Image 2 reveals uneven ground requiring base plate leveling..."
   - Use visual cues to refine any approximate dimensions provided
   - If images show conflicts with text inputs, prioritize visual evidence and explain

3. **Calculation Requirements**  
   Base ALL calculations on visual analysis + form inputs:

   - **Scaffolding Area Calculation**  
     - Area = (Structure Perimeter × Height) + (Access Requirements × Complexity Factor)  
     - Adjust for: All-around access vs single-side, platform overlap, stair towers  
     - Account for obstructions and irregular shapes visible in images  

   - **Material Quantities**  
     - Standards, Ledgers, Transoms = Based on bay size and area from images  
     - Decking/Planks = Platform area × 1.15 (overlap factor)  
     - Guardrails = Perimeter × Number of lifts × 1.1  
     - Base Plates = Standards count × 1.05  
     - Couplers/Fittings = Based on pin-lock system specifications  

   - **Labor Estimation**  
     - Base Erection Rate = 50-75 sq ft per man-hour (adjust for complexity from images)  
     - Complexity Adjustments:  
       * Simple/Open: 75 sq ft/man-hr  
       * Moderate Congestion: 60 sq ft/man-hr  
       * Complex/Congested: 50 sq ft/man-hr  
       * Very Complex: 35 sq ft/man-hr  
     - Total Labor Hours = (Scaffolding Area ÷ Erection Rate) × Crew Efficiency  
     - Supervision = 1 supervisor per 6 workers  
     - Safety Setup = 8-16 hours depending on site  

   - **Erection Duration**  
     - Crew Size = 4-8 workers (optimize based on area and complexity)  
     - Working Days = Total Hours ÷ (Crew Size × 8 hrs/day × 0.85 efficiency)  
     - Add setup/mobilization: +1-2 days  

   - **Equipment & Transportation**  
     - Material Handling = Based on height and site access from images  
     - Crane/Hoist Requirements = If height > 30 ft or poor access  
     - Transportation = Distance × Load × Regional rates  

   - **Cost Calculation**  
     - **Erection Labor Cost** = Hours × Labor Rate × (1 + Markup%)  
     - **Material Transportation** = Mobilization + Delivery + Site Moves  
     - **Equipment Rental** = Crane/Hoist days × Daily rate  
     - **Safety Equipment** = Base $1,200 + (Area × $0.15)  
     - **Subtotal Direct Costs** = Sum of above  
     - **Apply Overhead** = Direct Costs × Overhead %  
     - **Apply Profit** = (Direct + Overhead) × Profit %  
     - **Grand Total** = Direct + Overhead + Profit  

4. **Required Tables**  

   **Visual Analysis Summary Table**  
   | Observation | Image Reference | Impact on Estimate | Adjustment Factor |
   |-------------|----------------|-------------------|-------------------|
   | Structure height ~45 ft | Image 1 | 7 lifts required | +15% area |
   | Moderate pipe congestion | Image 2 | Reduced productivity | 60 sq ft/hr |

   **Erection Requirements Analysis**  
   | Parameter | Visual Assessment | Specification | Quantity | Rationale |
   |-----------|------------------|---------------|----------|-----------|
   | Height | 45 ft (from images) | 7 lifts @ 6.5 ft | 7 lifts | OSHA compliance |
   | Area | 2,400 sq ft | All-around access | 2,400 sf | Calculated from structure |

   **Material Takeoff (MTO)**  
   | Item | Unit | Quantity | Unit Rate | Subtotal | Basis |
   |------|------|--------:|----------:|---------:|-------|
   | Standards 20' | Each | 96 | $45 | $4,320 | Visual area calc |
   | Ledgers 10' | Each | 180 | $28 | $5,040 | Bay configuration |

   **Labor & Equipment Estimate**  
   | Trade | Crew | Hours | Rate | Subtotal | Productivity Basis |
   |-------|-----:|------:|-----:|---------:|-------------------|
   | Erection Labor | 6 | 320 | $72/hr | $23,040 | 60 sq ft/hr from complexity |
   | Supervision | 1 | 40 | $95/hr | $3,800 | 1:6 ratio |

   **Cost Breakdown**  
   | Category | Quantity | Unit Rate | Subtotal | Markup | Total | Notes |
   |----------|--------:|----------:|---------:|-------:|------:|-------|
   | Erection Labor | 320 hrs | $72 | $23,040 | 45% | $33,408 | Site complexity |
   | Transportation | 1 LS | $2,500 | $2,500 | 25% | $3,125 | Regional rate |
   | Equipment Rental | 3 days | $800 | $2,400 | 15% | $2,760 | Material hoist |
   | Safety Equipment | 1 LS | $1,560 | $1,560 | 35% | $2,106 | Fall protection |
   | **Direct Costs** | | | **$29,500** | | **$41,399** | |
   | Overhead (22%) | | | | | $9,108 | |
   | Profit (18%) | | | | | $9,091 | |
   | **GRAND TOTAL** | | | | | **$59,598** | |

   **Erection Schedule**  
   | Day | Phase | Activity | Crew | Hours | Milestones |
   |-----|-------|----------|-----:|------:|-----------|
   | 1 | Mobilization | Site setup, material staging | 4 | 8 | Material delivered |
   | 2-3 | Foundation | Base plates, sole boards, Level 1 | 6 | 16 | First lift complete |

5. **Contextual Rationale**  
   - **ALWAYS explain how images informed your estimates**
   - Reference specific visual observations (e.g., "Image 3 shows restricted access requiring manual material handling")
   - Justify scaffolding system selection based on structure type and visual complexity  
   - Explain safety requirements per OSHA 1926 Subpart L  
   - Address site-specific challenges observed in images  
   - Detail productivity assumptions based on visual complexity assessment  

6. **Formatting Rules**  
   - Use **Markdown headings** for sections  
   - Use **tables** for all numeric breakdowns  
   - Show **formulas explicitly** with visual inputs noted  
   - Include **image references** in rationale  
   - Use proper markdown table syntax with aligned columns  
   - Currency: $1,234.56 format  
   - Quantities: 123.45 format  

7. **Critical Requirements**  
   - ✓ Begin with detailed visual analysis summary  
   - ✓ Reference specific images in calculations  
   - ✓ Explain any discrepancies between images and form inputs  
   - ✓ Provide confidence level based on image quality  
   - ✓ Note areas requiring site visit verification  
   - ✓ Include photo recommendations for better estimates  

8. **Tone & Output Style**  
   - Professional and technical  
   - Data-driven based on visual evidence  
   - Transparent assumptions with image references  
   - Client-ready presentation quality  
   - Emphasize safety compliance and access efficiency  

---

## Output Format

Generate the complete report following the structure above. Lead with your visual analysis findings and integrate them throughout the estimate.
`
};

