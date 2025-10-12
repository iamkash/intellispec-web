# IntelliSCAFF Calculators Progress

## Overview
IntelliSCAFF provides a comprehensive suite of 50+ AI-powered scaffolding calculators covering structural integrity, safety, lifecycle management, and environmental factors. All calculators feature intelligent prompts with domain expertise, recommendations, and compliance checking against international standards (OSHA, EN 12811, BS 5975).

## Key Enhancements
- **Enhanced Intelligence**: All calculators now include domain heuristics, alternatives analysis, uncertainty quantification, and escalation criteria
- **Dual Input Support**: Vision-based calculators accept both images and manual inputs for flexibility
- **Comprehensive Inputs**: Added critical parameters like base dimensions, wind factors, ground conditions, and safety factors
- **Standards Compliance**: Built-in checks against OSHA 1926, EN 12811-1, BS 5975, and TG20:21
- **Smart Recommendations**: Each calculator provides prioritized actions and trade-off analysis

## Calculator Status

| Name | Type | Category | Description | Inputs | Outputs | Tags | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Load Capacity Calculator | Calculator | Structural Integrity | Calculates max load allowed per bay/platform | Tube size, span, duty rating, board type | Safe Working Load (kg) | load, capacity, SWL | Added |
| Scaffold Bay Design | Calculator | Structural Integrity | Sizes scaffold bays based on geometry and height | Height, bay width, levels | Bay layout recommendation | bay, design, geometry | Added |
| Tie Frequency Calculator | Calculator | Structural Integrity | Determines tie spacing for stability | Height, exposure class, load duty | Tie spacing (m) | tie, bracing, compliance | Added |
| Foundation Pressure Calculator | Calculator | Structural Integrity | Computes bearing pressure under base plates | Total load, base area, soil capacity | Pressure (kN/m²), pass/fail | foundation, soil, bearing | Added |
| Access Method Selector | Calculator | Safety & Ops | Recommends ladders, stairs, lifts | Height, width, no. of workers | Best access method | access, ladder, stairs | Existing |
| Fall Clearance Calculator | Calculator | Safety | Calculates fall clearance for PPE | Lanyard, harness, worker height | Clearance distance (m) | fall, clearance, harness | Added |
| **Alignment & Verticality Checker** | AI Vision | Structural Integrity | Advanced plumb analysis with structural impact | 40+ params: tilt, twist, settlement, tie effectiveness | Verticality assessment, squareness check, monitoring plan | alignment, tilt, plumb | **Enhanced** |
| **Base Plate & Foundation Validator** | AI Vision | Structural Integrity | Comprehensive bearing capacity and settlement analysis | 45+ params: soil conditions, load distribution, plate sizing | Bearing analysis, settlement prediction, compliance check | foundation, base | **Enhanced** |
| Joint & Coupler Recognition | AI Vision | Structural Integrity | Detects missing/loose/incorrect couplers | Photos/videos | Defect list | coupler, joint | Added |
| Tube & Component Damage Detector | AI Vision | Structural Integrity | Finds bent, corroded, cracked tubes | Photos | Damage severity score | corrosion, tubes, wear | Added |
| **Load Distribution Heatmap** | AI Vision | Structural Integrity | Advanced stress visualization with optimization | 45+ params: dead/live/environmental loads, stress measurements | Heat map visualization, member analysis, optimization opportunities | load, stress, heatmap | **Enhanced** |
| Guardrail & Toe Board Detector | AI Vision | Safety | Detects missing rails/boards | Images | Safety pass/fail | guardrail, fall | Added |
| **Deck Gap & Opening Detector** | AI Vision | Safety | Comprehensive platform safety with fall hazard assessment | 40+ params: gap measurements, openings, board condition | Compliance matrix, risk assessment, remediation plan | deck, plank, gap | **Enhanced** |
| **Protrusion Hazard Detector** | AI Vision | Safety | Advanced sharp edge and impact hazard analysis | 40+ params: zone analysis, risk scoring, protection measures | Risk matrix, remediation plan, compliance assessment | protrusion, hazard | **Enhanced** |
| Access Point Validator | AI Vision | Safety | Checks ladders/stairs for compliance | Images | Access compliance | access, ladders | Added |
| Tag & Label Compliance | AI Vision | Safety | Reads scaffold tags/labels | Photos | Parsed data | tags, compliance | Added |
| Worker Count on Scaffold | AI Vision | Worker Monitoring | Counts workers per platform | Video feed | Worker number | workers, occupancy | Added |
| PPE Compliance Detector | AI Vision | Worker Monitoring | Detects PPE (helmet, harness) | Images/video | Compliance score | PPE, safety | Added |
| Unsafe Behavior Recognition | AI Vision | Worker Monitoring | Flags unsafe actions | Video feed | Alerts | unsafe, behavior | Added |
| Tool & Material Placement Monitor | AI Vision | Worker Monitoring | Detects unsecured tools/materials | Images | Hazard report | tools, materials | Added |
| Erection Sequence Validator | AI Vision | Lifecycle | Validates erection order vs OSHA/ISO | Time-lapse | Sequence compliance | erection, sequence | Added |
| Dismantling Sequence Checker | AI Vision | Lifecycle | Ensures safe dismantling order | Time-lapse | Sequence compliance | dismantling, sequence | Added |
| **Digital Twin Overlay** | AI Vision | Lifecycle | BIM comparison with deviation mapping and compliance | 45+ params: design specs, capture methods, tolerances | Deviation analysis, compliance matrix, change documentation | digital twin, design | **Enhanced** |
| **Automated Component Counting** | AI Vision | Lifecycle | Intelligent inventory with loss tracking and reconciliation | 45+ params: component types, condition, tracking methods | Count summary, utilization analysis, financial tracking | counting, inventory | **Enhanced** |
| Scaffold Utilization Tracker | AI Vision | Lifecycle | Tracks scaffold usage vs plan | Video | Utilization index | utilization, monitoring | Added |
| Wind Load Visual Risk Detector | AI Vision | Environmental | Correlates scaffold sway with wind | Images + weather | Risk rating | wind, sway, risk | Added |
| Weather Impact Analyzer | AI Vision | Environmental | Assesses shutdown risk (rain, snow, lightning) | Weather API + images | Risk index | weather, shutdown | Added |
| Surface Condition Detector | AI Vision | Environmental | Detects wet/slippery/icy platforms | Images | Hazard level | surface, slip | Added |
| **Lighting & Visibility Checker** | AI Vision | Environmental | Comprehensive lux measurement and compliance | 45+ params: lux readings, uniformity, glare assessment | Illumination audit, energy analysis, improvement plan | lighting, visibility | **Enhanced** |
| Scaffold Stability Estimator | Estimator | Structural Integrity | Predicts probability of scaffold tipping | Height, load, wind, ties | Stability % | stability, tipping | Added |
| Load Capacity Estimator | Estimator | Structural Integrity | Estimates safe load limit | Tube size, span, board type | Max SWL (kg) | load, capacity | Removed (merged into calculator) |
| Foundation Pressure Estimator | Estimator | Structural Integrity | Calculates ground pressure | Load, plate area, soil capacity | Pressure (kN/m²) | foundation, soil | Removed (merged into calculator) |
| Tie Frequency Estimator | Estimator | Structural Integrity | Predicts required ties | Height, exposure class, duty rating | Tie spacing (m) | tie, bracing | Removed (merged into calculator) |
| Fall Clearance Estimator | Estimator | Safety | Estimates clearance distance | Lanyard, anchor, worker height | Clearance (m) | fall, clearance | Removed (merged into calculator) |
| Erection Time Estimator | Estimator | Lifecycle | Predicts man-hours for erection | Scaffold size, crew size | Hours/days | erection, productivity | Added |
| Dismantling Time Estimator | Estimator | Lifecycle | Predicts time for dismantling | Scaffold size, crew size | Hours/days | dismantling, productivity | Added |
| Cost Estimator | Estimator | Lifecycle | Estimates total cost of scaffolding project | Materials, labor, rental rates | Cost breakdown ($) | cost, pricing | Added |
| Material Quantity Estimator | Estimator | Lifecycle | Predicts no. of tubes, couplers, boards | Scaffold geometry | BOM list | materials, BOM | Added |
| Worker Load Estimator | Estimator | Worker Monitoring | Predicts safe worker count per platform | Platform SWL, live load | Max no. of workers | workers, occupancy | Added |
| Environmental Risk Estimator | Estimator | Environmental | Calculates risk from weather | Wind speed, rain, temp | Risk rating | environment, hazard | Added |

| **Erection Planner** | Planner | Lifecycle | Comprehensive erection planning with optimized sequencing | 45+ params: type, complexity, crew skills, site conditions, optimization | Full WBS, critical path, resource loading, quality gates | planning, erection | **Enhanced** |
| **Dismantling Planner** | Planner | Lifecycle | Safe dismantling with reverse sequencing and material handling | 40+ params: condition, corrosion, sorting, lowering methods | Safety sequence, material disposition, hold points | planning, dismantling | **Enhanced** |

| **Crew Shift Planner** | Planner | Planning | Intelligent shift scheduling with fatigue management | 40+ params: skills, fatigue scoring, shift patterns, optimization | Roster, fatigue analysis, cost breakdown, compliance | planning, crew, shifts | **Enhanced** |
| **Material Delivery Schedule Builder** | Planner | Planning | JIT logistics optimization with supply chain management | 45+ params: phasing, truck optimization, storage constraints | Master schedule, cost optimization, risk assessment | planning, materials | **Enhanced** |
| Scaffold Phase Sequencer | Planner | Planning | Creates phased sequences across areas | Areas, deps, targets | Phases | planning, sequence | Added |
| **Permit & Prerequisite Tracker** | Planner | Planning | Complete permit workflow and compliance management | 40+ params: permit status, prerequisites, approval workflow | Compliance matrix, timeline tracking, escalation criteria | planning, permits | **Enhanced** |
| Weather-Aware Work Window Planner | Planner | Planning | Chooses safe work windows | Thresholds, windows | Workable windows | planning, weather | Added |
| Critical Path Scaffold Tasks (CPM) | Planner | Planning | Computes critical path & float | Tasks, durations, deps | CPM table | planning, CPM | Added |
| Resource Leveling Advisor | Planner | Planning | Smooths resource peaks | Task resource usage | Leveling suggestions | planning, resources | Added |
| **Daily Work Pack Generator** | Planner | Planning | Smart daily execution plans with safety integration | 35+ params: tasks, crew, resources, permits, quality gates | Full schedule, resource allocation, safety briefings, progress tracking | planning, daily | **Enhanced** |

## New High-Value Calculators Added

| Name | Type | Category | Description | Key Features | Status |
| --- | --- | --- | --- | --- | --- |
| **Bracing Pattern Calculator** | Calculator | Structural Integrity | Calculates optimal diagonal bracing patterns for lateral stability | Plan/facade/ledger bracing, Wind exposure factors, Pattern optimization, EN 12811-1 & OSHA compliance | Added |
| **Cantilever Scaffold Calculator** | Calculator | Structural Integrity | Designs cantilever/overhang scaffolds with counterweight requirements | Moment equilibrium, Counterweight sizing, Tie force analysis, Deflection checks, Safety factor verification | Added |
| **Scaffold Load Chart Generator** | Calculator | Structural Integrity | Generates visual load distribution charts and capacity tables | Heat map visualization, Component utilization, Load path analysis, Color-coded safety indicators | Added |
| **Outrigger & Buttress Calculator** | Calculator | Structural Integrity | Calculates outrigger/buttress requirements for stability | Effective base calculations, Multi-sided configs, Connection capacity, Ground bearing verification | Added |
| **Scaffold Inspection Checklist Generator** | Generator | Safety & Ops | Creates customized inspection checklists based on regulations | Type-specific items, OSHA/EN/BS compliance, Photo requirements, Severity scoring, Digital/print formats | Added |

## Major Calculator Enhancements

### Scaffold Stability Estimator - Complete Redesign
- **Previous**: Basic 5 inputs (height, load, wind, tie spacing)
- **Enhanced**: 25+ comprehensive inputs including:
  - Base dimensions and H/B ratio analysis
  - Dead load and eccentricity factors
  - Wind direction and sheeting percentage
  - Ground conditions and slope effects
  - Outriggers, ballast, and bracing patterns
  - Detailed moment calculations (overturning vs resisting)
  - Multiple stabilization alternatives with cost analysis
  - Engineering formulas and safety factor calculations

### All Calculators - Intelligence Upgrade
Every calculator now includes:
- **Use Section**: Domain-specific heuristics and formulas
- **Recommendations**: Prioritized actionable improvements
- **Alternatives & Trade-offs**: Comparison tables with cost/benefit
- **Assumptions & Uncertainty**: Confidence levels and sensitivity analysis
- **Escalation Criteria**: Clear thresholds for engineering review
- **References**: Direct citations to OSHA, EN, BS standards

> All calculators follow the flat uiDefinition schema used by other modules. AI Vision items include dual input capability (image + manual) for flexibility.
