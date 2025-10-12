# Formula Calculator Documentation

The Formula Calculator provides a powerful way to create calculated fields in forms that automatically update based on other field values.

## Overview

The formula system allows you to:
- Count responses by value (yes/no/na)
- Sum numeric values from specific fields
- Perform mathematical calculations
- Create percentage calculations
- Reference individual field values

## Supported Functions

### COUNT(value, [pattern])
Counts fields that match a specific value.

**Parameters:**
- `value`: The value to count (e.g., 'yes', 'no', 'na')
- `pattern` (optional): Field name pattern to filter (e.g., 'q' for question fields)

**Examples:**
```javascript
COUNT('yes')           // Count all 'yes' responses
COUNT('no', 'q')       // Count 'no' responses in fields containing 'q'
COUNT('na')            // Count all 'na' responses
```

### COUNT_IGNORE_CASE(value, [pattern])
Same as COUNT but case-insensitive.

### SUM(pattern)
Sums numeric values from fields matching a pattern.

**Parameters:**
- `pattern`: Field name pattern to include in sum

**Examples:**
```javascript
SUM('score')           // Sum all fields containing 'score'
SUM('q')               // Sum all question fields (if they're numeric)
```

### FIELD(fieldPath)
Gets the value of a specific field.

**Parameters:**
- `fieldPath`: The field name/path

**Examples:**
```javascript
FIELD('q2')            // Get value of field 'q2'
FIELD('totalScore')    // Get value of field 'totalScore'
```

## Mathematical Operations

You can combine functions with standard mathematical operations:
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Parentheses: `()` for grouping

**Examples:**
```javascript
FIELD('q2') + FIELD('q3') + FIELD('q4')                    // Sum of three fields
(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100        // Percentage calculation
FIELD('score1') * 0.3 + FIELD('score2') * 0.7              // Weighted average
```

## Predefined Templates

The system includes common formula templates:

```javascript
FormulaTemplates.COUNT_YES              // "COUNT('yes')"
FormulaTemplates.COUNT_NO               // "COUNT('no')"
FormulaTemplates.COUNT_NA               // "COUNT('na')"
FormulaTemplates.COUNT_YES_QUESTIONS    // "COUNT('yes', 'q')"
FormulaTemplates.COUNT_NO_QUESTIONS     // "COUNT('no', 'q')"
FormulaTemplates.COUNT_NA_QUESTIONS     // "COUNT('na', 'q')"
FormulaTemplates.SUM_SCORES             // "SUM('score')"
FormulaTemplates.PERCENTAGE_YES         // "(COUNT('yes') / (COUNT('yes') + COUNT('no') + COUNT('na'))) * 100"
FormulaTemplates.PERCENTAGE_NO          // "(COUNT('no') / (COUNT('yes') + COUNT('no') + COUNT('na'))) * 100"
FormulaTemplates.OVERALL_SCORE          // "FIELD('q2') + FIELD('q3') + FIELD('q4')"
FormulaTemplates.COMPLIANCE_SCORE       // "(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100"
```

## Using Formulas in Form Metadata

To create a calculated field in your form metadata, add these properties:

```json
{
  "id": "totalYes",
  "title": "Total Yes Responses",
  "type": "number",
  "calculated": true,
  "autoRefresh": true,
  "formula": "COUNT('yes')",
  "disabled": true,
  "description": "Automatically calculated total of Yes responses"
}
```

### Required Properties for Calculated Fields:

- `calculated`: Set to `true` to mark as calculated field
- `autoRefresh`: Set to `true` to auto-update when form data changes
- `formula`: The formula expression to evaluate
- `disabled`: Usually set to `true` since calculated fields shouldn't be manually edited

## Example: TSTI Audit Form Scoring

Here's how the TSTI audit form uses formulas for its scoring summary:

```json
{
  "sectionId": "summary-section",
  "groupId": "score-group",
  "id": "totalYes",
  "title": "Total Yes Responses",
  "type": "number",
  "size": 4,
  "label": "Total Yes",
  "disabled": true,
  "calculated": true,
  "autoRefresh": true,
  "formula": "COUNT('yes')",
  "description": "Automatically calculated total of Yes responses"
},
{
  "sectionId": "summary-section",
  "groupId": "score-group",
  "id": "totalNo",
  "title": "Total No Responses",
  "type": "number",
  "size": 4,
  "label": "Total No",
  "disabled": true,
  "calculated": true,
  "autoRefresh": true,
  "formula": "COUNT('no')",
  "description": "Automatically calculated total of No responses"
},
{
  "sectionId": "summary-section",
  "groupId": "score-group",
  "id": "totalNA",
  "title": "Total N/A Responses",
  "type": "number",
  "size": 4,
  "label": "Total N/A",
  "disabled": true,
  "calculated": true,
  "autoRefresh": true,
  "formula": "COUNT('na')",
  "description": "Automatically calculated total of N/A responses"
},
{
  "sectionId": "summary-section",
  "groupId": "score-group",
  "id": "score",
  "title": "Overall Score",
  "type": "number",
  "size": 12,
  "label": "Overall Audit Score",
  "disabled": true,
  "calculated": true,
  "autoRefresh": true,
  "formula": "FIELD('q2') + FIELD('q3') + FIELD('q4')",
  "description": "Overall score based on planning and hazard assessment"
},
{
  "sectionId": "summary-section",
  "groupId": "score-group",
  "id": "compliancePercentage",
  "title": "Compliance Percentage",
  "type": "number",
  "size": 12,
  "label": "Compliance Percentage (%)",
  "disabled": true,
  "calculated": true,
  "autoRefresh": true,
  "formula": "(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100",
  "description": "Percentage of Yes responses (excluding N/A responses)"
}
```

## Advanced Examples

### Weighted Scoring
```javascript
FIELD('planningScore') * 0.3 + FIELD('hazardScore') * 0.4 + FIELD('executionScore') * 0.3
```

### Conditional Calculations
```javascript
COUNT('yes', 'q') >= 8 ? 100 : (COUNT('yes', 'q') / 8) * 100
```

### Complex Percentage
```javascript
((COUNT('yes') + COUNT('na') * 0.5) / (COUNT('yes') + COUNT('no') + COUNT('na'))) * 100
```

## Security

The formula evaluator is designed to be secure:
- Only allows predefined functions
- Restricts mathematical operations to safe operations
- Validates formulas before execution
- Prevents code injection attacks

## Error Handling

If a formula has an error:
- The field will display 0
- An error message will be logged
- The form will continue to function normally

## Best Practices

1. **Use descriptive field IDs** that make formulas readable
2. **Test formulas** with various data scenarios
3. **Use templates** when possible for common calculations
4. **Keep formulas simple** - break complex calculations into multiple fields
5. **Document formulas** in field descriptions
6. **Validate formulas** before deploying to production 