# Calculator Development Runbook

## 📖 Overview

This runbook provides step-by-step instructions for creating, testing, and deploying new calculators in the intelliSPEC platform. All calculators are **metadata-driven** (no hardcoded business logic) and use the **DynamicCalculatorGadget** framework.

---

## 🏗️ Directory Structure

```
scripts/calculators/
├── inspect/          # Inspection calculators (55 files)
├── NDT/              # Non-destructive testing calculators
├── quote/            # Quote and estimation calculators
├── scaffolding/      # Scaffolding-related calculators
└── README.md         # This runbook
```

**Total Calculators:** 94+ across all categories

---

## 🚀 Quick Start: Add a New Calculator

### Step 1: Choose the Right Folder

Place your calculator in the appropriate category:
- **`inspect/`** - General inspection calculators
- **`NDT/`** - NDT-specific calculations
- **`quote/`** - Cost estimation and quoting
- **`scaffolding/`** - Scaffolding and access planning

### Step 2: Create the Calculator File

**Naming Convention:** Use kebab-case (e.g., `my-new-calculator.js`)

**File Location:** `scripts/calculators/<category>/my-new-calculator.js`

### Step 3: Use the Minimal Template

```javascript
module.exports = {
  id: 'my-new-calculator',
  category: 'inspection',
  title: 'My New Calculator',
  description: 'Brief description of what this calculator does',
  version: '1.0.0',
  tags: [], // Add 'vision' if image-based
  
  uiDefinition: [
    // Sections, groups, and fields go here (see Step 4)
  ],
  
  aiConfig: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.1,
    systemPrompt: `You are an expert inspection engineer...`,
    maxTokens: 2000
  }
};
```

### Step 4: Define UI Structure (Flat Schema)

**CRITICAL:** Use a **flat array** structure (not nested objects).

#### 4.1 Define a Section
```javascript
{
  id: 'input-section',
  type: 'section',
  title: 'Input Parameters',
  description: 'Enter calculation inputs',
  icon: 'FormOutlined',
  order: 1,
  size: 24
}
```

#### 4.2 Define a Group
```javascript
{
  id: 'general-inputs',
  type: 'group',
  title: 'General Inputs',
  sectionId: 'input-section',  // Links to parent section
  order: 1,
  size: 24,
  collapsible: false
}
```

#### 4.3 Define Fields
```javascript
{
  id: 'asset_type',
  type: 'select',
  label: 'Asset Type',
  sectionId: 'input-section',   // Links to section
  groupId: 'general-inputs',    // Links to group
  size: 12,                     // Grid size (out of 24)
  required: true,
  defaultValue: '',
  placeholder: 'Select asset type',
  options: [
    { label: 'Piping', value: 'piping' },
    { label: 'Vessel', value: 'vessel' },
    { label: 'Tank', value: 'tank' }
  ]
}
```

### Step 5: Add Conditional Logic (Optional)

Show/hide fields based on other field values:

```javascript
// Parent field (drives visibility)
{
  id: 'asset_type',
  type: 'select',
  label: 'Asset Type',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 12,
  options: [
    { label: 'Piping', value: 'piping' },
    { label: 'Tank', value: 'tank' }
  ]
},

// Conditional group (only shows for piping)
{
  id: 'piping-params',
  type: 'group',
  title: 'Piping Parameters',
  sectionId: 'input-section',
  order: 2,
  size: 24,
  collapsible: true,
  watchField: 'asset_type',        // Watch this field
  showWhen: 'piping,pipeline'      // Show when value matches (comma-separated)
}
```

### Step 6: Write the AI Prompt

**Best Practices:**
- Be specific about inputs and outputs
- Constrain output format (Markdown sections only)
- Avoid hardcoded values
- Reference industry standards

```javascript
aiConfig: {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.1,
  systemPrompt: `You are an expert inspection engineer with 20+ years of experience.

Context: This calculator estimates inspection duration based on asset characteristics.

Task: Using ONLY the inputs provided, calculate the estimated inspection duration.

Output a professional Markdown report with ONLY these sections:

# Inspection Duration Estimate
## Inputs Summary
## Method and Assumptions
## Calculations
- Step 1: Calculate base inspection time
- Step 2: Apply complexity factors
- Step 3: Add contingency

## Summary Table
| Metric | Value | Units | Rationale |
|--------|-------|-------|-----------|
| Base Time | X | hours | ... |
| Total Time | Y | hours | ... |

## References and Standards
- API 510
- ASME Section V

Do NOT include cost estimates, resource requirements, or schedules unless explicitly requested.`,
  maxTokens: 2000
}
```

### Step 7: Test Your Calculator Locally

**Reference calculator:** Use `inspect/inspection-duration-estimator.js` as the gold standard.

```bash
# Check if your calculator loads without errors
node -e "console.log(require('./scripts/calculators/inspect/my-new-calculator.js'))"
```

### Step 8: Seed to Database

```bash
# Seed all calculators (auto-discovers your new file)
node scripts/seed-calculators.js

# Or recreate just your calculator
node scripts/seed-calculators.js --id=my-new-calculator

# Target specific tenant
node scripts/seed-calculators.js --tenant=my-tenant-id
```

### Step 9: Verify in UI

1. Start the app: `npm start`
2. Navigate to calculators section
3. Search for your calculator by ID or title
4. Test the form rendering and AI response

---

## 📐 Schema Reference

### Required Properties (All Items)

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| `id` | ✅ | string | Unique identifier (kebab-case) |
| `type` | ✅ | string | `section`, `group`, or field type |
| `title` or `label` | ✅ | string | Display name |
| `sectionId` | Groups/Fields only | string | Parent section ID |
| `groupId` | Fields only | string | Parent group ID |

### Grid Sizing (24-column grid)

| Size | Usage |
|------|-------|
| 24 | Full width |
| 12 | Half width (2 columns) |
| 8 | Third width (3 columns) |
| 6 | Quarter width (4 columns) |
| 4 | Sixth width (6 columns) |

**Examples:**
- Two fields side-by-side: `size: 12` each
- Three fields per row: `size: 8` each
- Four fields per row: `size: 6` each

### Available Field Types

| Type | Use Case | Required Props |
|------|----------|----------------|
| `text` | Short text input | `label`, `size` |
| `textarea` | Long text input | `label`, `size`, `rows` |
| `number` | Numeric input | `label`, `size` |
| `select` | Dropdown | `label`, `size`, `options` |
| `radio` | Radio buttons | `label`, `size`, `options` |
| `checkbox` | Checkbox | `label`, `size` |
| `checkbox_group` | Multiple checkboxes | `label`, `size`, `options` (objects!) |
| `date` | Date picker | `label`, `size` |
| `upload` | File upload | `label`, `size`, `accept` |
| `image-upload-with-drawing` | Image + annotations | `label`, `size`, `multiple` |

### Conditional Visibility

```javascript
{
  id: 'conditional-field',
  type: 'text',
  label: 'Only for Piping',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 12,
  watchField: 'asset_type',           // Field to watch
  showWhen: 'piping,pipeline',        // Comma-separated values
  showOnMatch: true                   // Optional: explicit match behavior
}
```

---

## 🖼️ Image-Based Calculators

### When to Use Images

- Photo quality assessment
- Defect detection (corrosion, cracks, welds)
- OCR (nameplate reading)
- Evidence documentation
- Calibration and scaling

### Requirements for Vision Calculators

1. **Add `vision` tag** to metadata
2. **Use image field type** (`image-upload-with-drawing` preferred)
3. **Update AI prompt** to reference images
4. **Handle reconciliation** if images conflict with inputs

### Image Field Example

```javascript
{
  id: 'defect_photos',
  type: 'image-upload-with-drawing',
  label: 'Upload Defect Photos',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 24,
  multiple: true,              // Allow multiple images
  accept: 'image/*',           // File type filter
  maxSize: 10,                 // Max size in MB
  description: 'Upload clear photos of the defect area'
}
```

### Vision Prompt Template

```javascript
systemPrompt: `You are an expert NDT inspector analyzing images and inputs.

CRITICAL: You MUST analyze BOTH the uploaded images AND the user inputs. Do NOT assume default values.

If images conflict with user inputs, include an Evidence Reconciliation table:

| Indicator | From Images | From Inputs | Final Used | Notes |
|-----------|-------------|-------------|------------|-------|
| ... | ... | ... | ... | ... |

All findings must be presented in valid Markdown tables (no code fences).

...rest of prompt...`
```

### Current Vision Calculators

- `duplicate-image-detector`
- `photo-quality-gate`
- `image-scale-calibration`
- `nameplate-ocr-confidence`
- `cui-quick-screen`
- `flange-gasket-risk-quick-check`
- `coating-condition-score`
- `corrosion-detector`
- `weld-anomaly-detector`
- `crack-detector`
- And 4 more...

---

## 🔧 Advanced Patterns

### Scope Basis Pattern

For calculators that need flexible units (area vs. length):

```javascript
// Basis selector
{
  id: 'scope_basis',
  type: 'select',
  label: 'Scope Basis',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 8,
  defaultValue: 'surface_area',
  options: [
    { label: 'Surface Area', value: 'surface_area' },
    { label: 'Linear Length', value: 'linear_length' },
    { label: 'Count', value: 'count' }
  ]
},

// Unit selector (conditional on basis)
{
  id: 'scope_unit_area',
  type: 'select',
  label: 'Unit',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 4,
  options: [
    { label: 'm²', value: 'm2' },
    { label: 'ft²', value: 'ft2' }
  ],
  watchField: 'scope_basis',
  showWhen: 'surface_area'
},

{
  id: 'scope_unit_linear',
  type: 'select',
  label: 'Unit',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 4,
  options: [
    { label: 'm', value: 'm' },
    { label: 'ft', value: 'ft' }
  ],
  watchField: 'scope_basis',
  showWhen: 'linear_length'
},

// Size input (always visible)
{
  id: 'scope_size',
  type: 'number',
  label: 'Scope Size',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 12,
  required: true
}
```

### Checkbox Group Pattern

**CRITICAL:** Options must be objects with `{ label, value }`, NOT strings!

```javascript
{
  id: 'defect_types',
  type: 'checkbox_group',
  label: 'Defect Types',
  sectionId: 'input-section',
  groupId: 'general-inputs',
  size: 24,
  options: [
    { label: 'Corrosion', value: 'corrosion' },
    { label: 'Cracks', value: 'cracks' },
    { label: 'Dents', value: 'dents' },
    { label: 'Leaks', value: 'leaks' }
  ]
}
```

---

## ✅ Validation & Quality Checklist

Before submitting your calculator:

- [ ] **ID is unique** (check existing calculators)
- [ ] **File is in correct folder** (`inspect/`, `NDT/`, etc.)
- [ ] **Uses flat schema** (no nested `sections.groups.fields`)
- [ ] **All fields have `sectionId` and `groupId`**
- [ ] **Grid sizes add up properly** (prefer 24-column layout)
- [ ] **`checkbox_group` options are objects** (not strings)
- [ ] **Conditional logic uses `watchField`/`showWhen`**
- [ ] **AI prompt is concise and constrained**
- [ ] **References industry standards** where applicable
- [ ] **`vision` tag added** if image-based
- [ ] **Tested locally** (loads without errors)
- [ ] **Seeded to database** successfully
- [ ] **Tested in UI** (form renders, AI responds)

---

## 🔍 Validation Script

The seed script validates your calculator automatically:

```javascript
// Runs on every seed
validateCalculatorMetadata(calculator, sourceFile);
```

**Common Errors:**
- `checkbox_group without options array` → Add `options: [...]`
- `checkbox_group option not an object` → Change `['option1']` to `[{ label: 'Option 1', value: 'option1' }]`
- `Missing sectionId or groupId` → Add parent references

---

## 📚 Reference Calculators (Gold Standards)

Use these as templates for new calculators:

| Calculator | Use As Template For... |
|------------|------------------------|
| `inspection-duration-estimator.js` | General inspection calculators |
| `scope-sizing.js` | Scope basis pattern |
| `photo-quality-gate.js` | Image-based calculators |
| `duplicate-image-detector.js` | Multi-image vision calculators |
| `corrosion-detector.js` | AI defect detection |

**Location:** `scripts/calculators/inspect/`

---

## 🛠️ Troubleshooting

### Calculator Not Showing in UI

1. Check database: `db.calculators.find({ id: 'my-calculator-id' })`
2. Verify tenant: Ensure calculator is seeded to correct tenant
3. Check logs: Look for validation errors during seed
4. Verify category matches filter

### Form Not Rendering Correctly

1. Validate flat schema structure
2. Ensure all `sectionId` and `groupId` references are valid
3. Check grid sizing (should total ≤24 per row)
4. Test conditional logic (`watchField`/`showWhen`)

### AI Not Responding

1. Check `aiConfig.systemPrompt` is defined
2. Verify API keys are set (`OPENAI_API_KEY`)
3. Check model name (`gpt-4o`, `gpt-4o-mini`, etc.)
4. Review prompt constraints (too restrictive?)

### Validation Errors

```bash
# Common error: checkbox_group options
❌ Calculator my-calculator has checkbox_group "field_id" option at index 0 that is not an object.

# Fix: Change options from strings to objects
options: ['option1', 'option2']  // ❌ Wrong
options: [
  { label: 'Option 1', value: 'option1' },  // ✅ Correct
  { label: 'Option 2', value: 'option2' }
]
```

---

## 📦 Database Operations

### Seed All Calculators
```bash
node scripts/seed-calculators.js
```

### Recreate All Calculators (Clean Slate)
```bash
node scripts/seed-calculators.js --recreate
```

### Recreate Single Calculator
```bash
node scripts/seed-calculators.js --id=my-calculator-id
```

### Target Specific Tenant
```bash
node scripts/seed-calculators.js --tenant=tenant-id
```

### Check Database
```bash
# MongoDB shell
db.calculators.find({ category: 'inspection' }).count()
db.calculators.findOne({ id: 'my-calculator-id' })
```

---

## 🎯 Best Practices

### DO ✅
- Use `inspection-duration-estimator.js` as reference
- Keep prompts concise and constrained
- Use conditional logic for asset-specific fields
- Add `vision` tag for image calculators
- Test in UI before committing
- Use industry-standard terminology
- Reference codes and standards (API, ASME, etc.)

### DON'T ❌
- Hardcode business logic in framework code
- Use nested schema structure
- Use string arrays for `checkbox_group` options
- Assume default values in AI prompts
- Introduce costs/schedules unless in scope
- Use eval or unsafe code execution
- Skip validation before seeding

---

## 📝 Quick Reference

### Minimal Calculator Template

See **Step 3** in Quick Start section above for the complete template.

### Gold Standard Reference

**`scripts/calculators/inspect/inspection-duration-estimator.js`** - Use this as your primary reference for all new calculators.

### Common Commands

```bash
# Seed all calculators
node scripts/seed-calculators.js

# Recreate specific calculator
node scripts/seed-calculators.js --id=my-calculator-id

# Test calculator loads
node -e "console.log(require('./scripts/calculators/inspect/my-calculator.js'))"
```

### Need Help?

- Review the schema reference section above
- Check troubleshooting section for common issues
- Examine reference calculators in `inspect/` folder
- Run validation to catch errors early

---

**Last Updated:** October 2025  
**Total Calculators:** 94+  
**Framework Version:** 1.0.0
