# API 510 Inspection Sections

This folder contains the simplified section configuration files for the API 510 Pressure Vessel Inspection wizard.

## Section Files

### 1. `vessel-identification.json`
- **Purpose**: Basic vessel information and identification
- **Fields**: Vessel tag, name, manufacturer, serial number, design code, construction year
- **Order**: 1

### 2. `safety-preparation.json`
- **Purpose**: Safety procedures, permits, and pre-inspection safety checks
- **Fields**: Work permit, lockout/tagout, confined space, hot work, safety equipment
- **Order**: 2

### 3. `visual-inspection.json`
- **Purpose**: General condition assessment, component inspection, and anomaly documentation
- **Fields**: Overall condition, corrosion, cracking, deformation, leakage, weld condition
- **Order**: 3

### 4. `measurements-tests.json`
- **Purpose**: Physical measurements, testing procedures, and data collection
- **Fields**: Thickness measurements, pressure tests, corrosion rates, test results
- **Order**: 4

### 5. `findings-assessment.json`
- **Purpose**: Inspection results, condition assessment, and recommendations
- **Fields**: Overall assessment, critical findings, safety concerns, compliance status
- **Order**: 5

### 6. `documentation-report.json`
- **Purpose**: Inspection photographs, supporting documents, and final report generation
- **Fields**: Photographs, drawings, report format, inspector signature, inspection date
- **Order**: 6

## Usage

These section files are referenced by the main API 510 inspection workspace:
`../api-510-inspection.json`

Each section file contains:
- Section metadata (id, title, description, icon)
- Form groups for organizing fields
- Individual form fields with appropriate types and validations
- Required field indicators
- Professional dropdown options

## Structure

Each section file follows this structure:
```json
[
  {
    "id": "section-id",
    "type": "section",
    "title": "Section Title",
    "description": "Section description",
    "icon": "IconName",
    "order": 1,
    "size": 12
  },
  {
    "id": "group-id",
    "type": "group",
    "title": "Group Title",
    "sectionId": "section-id",
    "order": 1,
    "size": 12,
    "collapsible": false
  },
  {
    "id": "field-id",
    "type": "field-type",
    "title": "Field Title",
    "label": "Field Label",
    "sectionId": "section-id",
    "groupId": "group-id",
    // ... other field properties
  }
]
```

## Maintenance

When updating these sections:
1. Maintain the section order (1-6)
2. Keep field IDs unique across all sections
3. Ensure proper group and section relationships
4. Test the wizard after making changes
5. Update this README if adding new sections or fields 