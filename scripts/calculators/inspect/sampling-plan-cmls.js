module.exports = {
  "id": "sampling-plan-cmls",
  "name": "Sampling plan for CMLs",
  "description": "Compute minimum CMLs and suggested grid density based on length and fittings",
  "category": "Planning",
  "module": "inspect",
  "icon": "ExperimentOutlined",
  "tags": [
    "sampling",
    "cml",
    "planning",
    "grid"
  ],
  "uiDefinition": [
    {
      "id": "input-card",
      "type": "section",
      "title": "Input Parameters",
      "description": "Enter CML sampling parameters",
      "icon": "FormOutlined",
      "order": 1,
      "size": 24
    },
    {
      "id": "general-inputs",
      "type": "group",
      "title": "General Inputs",
      "description": "Piping length and fittings count",
      "sectionId": "input-card",
      "order": 1,
      "size": 24,
      "collapsible": false
    },
    {
      "id": "nps",
      "type": "number",
      "title": "Nominal Pipe Size (NPS)",
      "label": "NPS",
      "placeholder": "Enter pipe size",
      "required": true,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "general-inputs",
      "defaultValue": null
    },
    {
      "id": "pipe_length",
      "type": "number",
      "title": "Pipe Length",
      "label": "Pipe Length (feet)",
      "placeholder": "Enter pipe length",
      "required": true,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "general-inputs",
      "defaultValue": null
    },
    {
      "id": "num_fittings",
      "type": "number",
      "title": "Number of Fittings",
      "label": "Number of Fittings",
      "placeholder": "Enter number of fittings",
      "required": true,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "general-inputs",
      "defaultValue": 0
    }
    ,
    {
      "id": "fittings_density",
      "type": "select",
      "title": "Fittings Density",
      "label": "Fittings Density",
      "placeholder": "Select density",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "general-inputs",
      "defaultValue": "medium",
      "options": [
        { "label": "Low", "value": "low" },
        { "label": "Medium", "value": "medium" },
        { "label": "High", "value": "high" }
      ]
    },
    {
      "id": "scope_basis",
      "type": "select",
      "title": "Scope Basis",
      "label": "Scope Basis",
      "placeholder": "Select basis",
      "required": false,
      "size": 8,
      "sectionId": "input-card",
      "groupId": "general-inputs",
      "defaultValue": "linear_length",
      "options": [
        { "label": "Linear length", "value": "linear_length" },
        { "label": "Count (items)", "value": "count" }
      ]
    },
    {
      "id": "scope_unit_linear",
      "type": "select",
      "title": "Scope Unit",
      "label": "Scope Unit",
      "placeholder": "Select unit",
      "required": false,
      "size": 4,
      "sectionId": "input-card",
      "groupId": "general-inputs",
      "defaultValue": "ft",
      "options": [
        { "label": "ft", "value": "ft" },
        { "label": "m", "value": "m" }
      ],
      "watchField": "scope_basis",
      "showWhen": "linear_length"
    },
    {
      "id": "scope_unit_count",
      "type": "select",
      "title": "Scope Unit",
      "label": "Scope Unit",
      "required": false,
      "size": 4,
      "sectionId": "input-card",
      "groupId": "general-inputs",
      "defaultValue": "items",
      "options": [ { "label": "items", "value": "items" } ],
      "watchField": "scope_basis",
      "showWhen": "count"
    },
    {
      "id": "risk-settings",
      "type": "group",
      "title": "Risk and Circuit Context",
      "description": "Risk class and circuit information",
      "sectionId": "input-card",
      "order": 2,
      "size": 24,
      "collapsible": true
    },
    {
      "id": "risk_class",
      "type": "select",
      "title": "Risk Class",
      "label": "Risk Class",
      "placeholder": "Select risk class",
      "required": false,
      "size": 8,
      "sectionId": "input-card",
      "groupId": "risk-settings",
      "defaultValue": "medium",
      "options": [
        { "label": "Low", "value": "low" },
        { "label": "Medium", "value": "medium" },
        { "label": "High", "value": "high" }
      ]
    },
    {
      "id": "corrosion_circuit",
      "type": "text",
      "title": "Corrosion Circuit",
      "label": "Corrosion Circuit",
      "placeholder": "e.g., 10T-201-A",
      "required": false,
      "size": 8,
      "sectionId": "input-card",
      "groupId": "risk-settings",
      "defaultValue": ""
    },
    {
      "id": "small_bore_percent",
      "type": "number",
      "title": "Small Bore Percent",
      "label": "% ≤ NPS 2",
      "placeholder": "Percent of small-bore lines",
      "required": false,
      "size": 8,
      "sectionId": "input-card",
      "groupId": "risk-settings",
      "defaultValue": null
    },
    {
      "id": "fitting-breakdown",
      "type": "group",
      "title": "Fitting Breakdown",
      "description": "Detailed counts of fittings",
      "sectionId": "input-card",
      "order": 3,
      "size": 24,
      "collapsible": true
    },
    {
      "id": "elbows_count",
      "type": "number",
      "title": "Elbows",
      "label": "Elbows",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "fitting-breakdown",
      "defaultValue": 0
    },
    {
      "id": "tees_count",
      "type": "number",
      "title": "Tees",
      "label": "Tees",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "fitting-breakdown",
      "defaultValue": 0
    },
    {
      "id": "branches_count",
      "type": "number",
      "title": "Branches",
      "label": "Branches",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "fitting-breakdown",
      "defaultValue": 0
    },
    {
      "id": "deadlegs_count",
      "type": "number",
      "title": "Deadlegs",
      "label": "Deadlegs",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "fitting-breakdown",
      "defaultValue": 0
    },
    {
      "id": "environment-material",
      "type": "group",
      "title": "Environment & Material",
      "description": "Factors influencing CUI and corrosion",
      "sectionId": "input-card",
      "order": 4,
      "size": 24,
      "collapsible": true
    },
    {
      "id": "insulation_present",
      "type": "switch",
      "title": "Insulation Present",
      "label": "Insulation Present",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "environment-material",
      "defaultValue": false
    },
    {
      "id": "temperature_band",
      "type": "select",
      "title": "Temperature Band",
      "label": "Temperature Band",
      "placeholder": "Select band",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "environment-material",
      "defaultValue": "-20_to_60C",
      "options": [
        { "label": "< -20°C", "value": "lt_-20C" },
        { "label": "-20°C to 60°C", "value": "-20_to_60C" },
        { "label": "60°C to 120°C", "value": "60_to_120C" },
        { "label": "120°C to 200°C", "value": "120_to_200C" },
        { "label": "> 200°C", "value": "gt_200C" }
      ]
    },
    {
      "id": "service_corrosivity",
      "type": "select",
      "title": "Service Corrosivity",
      "label": "Service Corrosivity",
      "placeholder": "Select level",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "environment-material",
      "defaultValue": "medium",
      "options": [
        { "label": "Low", "value": "low" },
        { "label": "Medium", "value": "medium" },
        { "label": "High", "value": "high" }
      ]
    },
    {
      "id": "phase",
      "type": "select",
      "title": "Phase",
      "label": "Phase",
      "placeholder": "Select phase",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "environment-material",
      "defaultValue": "wet",
      "options": [
        { "label": "Wet", "value": "wet" },
        { "label": "Dry", "value": "dry" }
      ]
    },
    {
      "id": "coating_condition",
      "type": "select",
      "title": "Coating Condition",
      "label": "Coating Condition",
      "placeholder": "Select condition",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "environment-material",
      "defaultValue": "fair",
      "options": [
        { "label": "Good", "value": "good" },
        { "label": "Fair", "value": "fair" },
        { "label": "Poor", "value": "poor" }
      ]
    },
    {
      "id": "external_exposure",
      "type": "select",
      "title": "External Exposure",
      "label": "External Exposure",
      "placeholder": "Select exposure",
      "required": false,
      "size": 6,
      "sectionId": "input-card",
      "groupId": "environment-material",
      "defaultValue": "unsheltered",
      "options": [
        { "label": "Sheltered", "value": "sheltered" },
        { "label": "Unsheltered", "value": "unsheltered" },
        { "label": "Coastal", "value": "coastal" }
      ]
    },
    {
      "id": "policy-context",
      "type": "group",
      "title": "Policy & Execution Context",
      "description": "Codes, accessibility and baseline",
      "sectionId": "input-card",
      "order": 5,
      "size": 24,
      "collapsible": true
    },
    {
      "id": "code_basis",
      "type": "select",
      "title": "Code Basis",
      "label": "Code Basis",
      "placeholder": "Select basis",
      "required": false,
      "size": 8,
      "sectionId": "input-card",
      "groupId": "policy-context",
      "defaultValue": "api570",
      "options": [
        { "label": "API 570", "value": "api570" },
        { "label": "Company Policy", "value": "company_policy" }
      ]
    },
    {
      "id": "accessibility_complexity",
      "type": "select",
      "title": "Accessibility Complexity",
      "label": "Accessibility Complexity",
      "placeholder": "Select complexity",
      "required": false,
      "size": 8,
      "sectionId": "input-card",
      "groupId": "policy-context",
      "defaultValue": "medium",
      "options": [
        { "label": "Low", "value": "low" },
        { "label": "Medium", "value": "medium" },
        { "label": "High", "value": "high" }
      ]
    },
    {
      "id": "baseline_cmls",
      "type": "number",
      "title": "Baseline CMLs",
      "label": "Baseline CMLs",
      "placeholder": "If previous plan exists",
      "required": false,
      "size": 8,
      "sectionId": "input-card",
      "groupId": "policy-context",
      "defaultValue": null
    }
  ],
  "aiPrompt": "You are an expert piping inspection planner.\n\nContext: Sampling plan for CMLs — compute minimum CMLs and suggested grid density based on length and fittings.\nTask: Using only the inputs above, produce a concise CML sampling plan limited strictly to:\n1) Minimum number of CMLs required\n2) Recommended grid density (points/ft)\n\nOutput a professional Markdown report with ONLY these sections:\n\n# CML Sampling Plan\n## Inputs\n## Method and Assumptions\n## Calculations\n- Minimum CMLs Required\n- Recommended Grid Density (points/ft)\n## Summary Table\n(Use columns: Metric | Value | Units | Rationale)\n## References and Standards"
};