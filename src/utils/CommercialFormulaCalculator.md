# Commercial Formula Calculator

A safe, commercial-friendly formula engine for B2B SaaS applications that implements Excel-like functions without GPL-3.0 licensing restrictions.

## 🛡️ Licensing & Commercial Safety

**✅ SAFE FOR B2B SAAS APPLICATIONS**

This formula calculator is built from scratch with MIT/BSD compatible licensing, making it safe for commercial use:

- ❌ **No GPL-3.0 dependencies** (unlike HyperFormula)
- ✅ **MIT/BSD compatible** - can be used in proprietary software
- ✅ **No source code disclosure requirements**
- ✅ **No copyleft restrictions**
- ✅ **Safe for commercial licensing**

## 🚀 Features

### Formula Types Supported

1. **Legacy Formulas** (backward compatibility)
   - `COUNT('yes')` - Count fields with specific value
   - `SUM(field1, field2, field3)` - Sum multiple fields
   - `FIELD('fieldName')` - Get field value

2. **Excel-like Formulas** (new format)
   - `=SUM(A1, B2, C3)` - Excel-style function calls
   - `=A1 + B2 * C3` - Mathematical expressions
   - `=IF(condition, trueValue, falseValue)` - Conditional logic

### Built-in Functions

#### Mathematical Functions
- `SUM(values...)` - Sum of values
- `AVERAGE(values...)` - Average of values
- `COUNT(values...)` - Count non-empty values
- `COUNTIF(range, criteria)` - Count values matching criteria
- `ROUND(number, decimals)` - Round to specified decimals
- `MAX(values...)` - Maximum value
- `MIN(values...)` - Minimum value
- `ABS(number)` - Absolute value
- `POWER(base, exponent)` - Exponentiation
- `SQRT(number)` - Square root

#### Logical Functions
- `IF(condition, trueValue, falseValue)` - Conditional logic
- `AND(conditions...)` - Logical AND
- `OR(conditions...)` - Logical OR
- `NOT(condition)` - Logical NOT

#### Text Functions
- `CONCATENATE(texts...)` - Join text strings
- `LEN(text)` - String length
- `UPPER(text)` - Convert to uppercase
- `LOWER(text)` - Convert to lowercase

#### Statistical Functions
- `SUMPRODUCT(array1, array2)` - Sum of products
- `MEDIAN(values...)` - Median value
- `MODE(values...)` - Most frequent value

## 📖 Usage Examples

### Basic Setup

```typescript
import { commercialFormulaCalculator } from './CommercialFormulaCalculator';

// Set context data
commercialFormulaCalculator.setContext({
  q1: 'yes',
  q2: 3,
  q3: 2,
  q4: 3,
  q5: 'no',
  totalYes: 7,
  totalNo: 1
});

// Evaluate formulas
const result = commercialFormulaCalculator.evaluate("=SUM(q2, q3, q4)");
console.log(result.value); // 8
```

### TSTI Audit Form Examples

```typescript
// Count Yes responses
const totalYes = commercialFormulaCalculator.evaluate("COUNT('yes')");
// Result: 7

// Count No responses  
const totalNo = commercialFormulaCalculator.evaluate("COUNT('no')");
// Result: 1

// Calculate overall score
const score = commercialFormulaCalculator.evaluate("=FIELD('q2') + FIELD('q3') + FIELD('q4')");
// Result: 8

// Calculate compliance percentage
const compliance = commercialFormulaCalculator.evaluate("=(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100");
// Result: 87.5

// Excel-style compliance calculation
const excelCompliance = commercialFormulaCalculator.evaluate('=COUNTIF(q1, "yes") / (COUNTIF(q1, "yes") + COUNTIF(q1, "no")) * 100');
// Result: 100
```

### Advanced Examples

```typescript
// Conditional logic
const status = commercialFormulaCalculator.evaluate('=IF(score > 7, "Pass", "Fail")');
// Result: "Pass"

// Complex mathematical expression
const weightedScore = commercialFormulaCalculator.evaluate('=(q2 * 0.4) + (q3 * 0.3) + (q4 * 0.3)');
// Result: 2.7

// Statistical analysis
const averageScore = commercialFormulaCalculator.evaluate('=AVERAGE(q2, q3, q4)');
// Result: 2.67

// Text manipulation
const summary = commercialFormulaCalculator.evaluate('=CONCATENATE("Score: ", score, " (", IF(score > 7, "Pass", "Fail"), ")")');
// Result: "Score: 8 (Pass)"
```

## 🔧 Integration with DocumentFormGadget

The calculator is automatically integrated with the DocumentFormGadget:

```typescript
// In your form metadata
{
  "id": "compliancePercentage",
  "type": "number",
  "calculated": true,
  "autoRefresh": true,
  "formula": "=(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100",
  "description": "Percentage of Yes responses (excluding N/A responses)"
}
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test CommercialFormulaCalculator.test.ts
```

Tests cover:
- Legacy formula compatibility
- Excel-like formula evaluation
- Mathematical expressions
- Error handling
- Real-world TSTI audit scenarios
- Custom function registration

## 🔒 Security Features

- **Safe evaluation**: Uses `Function` constructor with controlled scope
- **Input validation**: All inputs are validated before processing
- **Error handling**: Graceful error handling with descriptive messages
- **No eval()**: Avoids dangerous `eval()` function
- **Type safety**: Full TypeScript support with strict typing

## 🚀 Performance

- **Lightweight**: No external dependencies
- **Fast**: Optimized for real-time calculation
- **Memory efficient**: Minimal memory footprint
- **Caching ready**: Designed for result caching

## 🔧 Customization

### Register Custom Functions

```typescript
// Register a custom function
commercialFormulaCalculator.registerFunction('CUSTOM_AVERAGE', (...args: number[]) => {
  const validNumbers = args.filter(n => !isNaN(n));
  return validNumbers.length > 0 ? validNumbers.reduce((a, b) => a + b) / validNumbers.length : 0;
});

// Use the custom function
const result = commercialFormulaCalculator.evaluate('=CUSTOM_AVERAGE(1, 2, 3, "invalid", 5)');
// Result: 2.75 (ignores "invalid" string)
```

### Extend with Business Logic

```typescript
// Add business-specific functions
commercialFormulaCalculator.registerFunction('AUDIT_SCORE', (...args: any[]) => {
  const yesCount = args.filter(arg => arg === 'yes').length;
  const totalCount = args.length;
  return totalCount > 0 ? (yesCount / totalCount) * 100 : 0;
});

// Use in formulas
const auditScore = commercialFormulaCalculator.evaluate('=AUDIT_SCORE(q1, q2, q3, q4, q5)');
```

## 📋 Migration from HyperFormula

If you were using HyperFormula, migration is straightforward:

### Before (HyperFormula - GPL-3.0)
```typescript
import { HyperFormula } from 'hyperformula';
// GPL-3.0 licensed - NOT safe for commercial use
```

### After (Commercial Formula Calculator - MIT/BSD)
```typescript
import { commercialFormulaCalculator } from './CommercialFormulaCalculator';
// MIT/BSD compatible - SAFE for commercial use
```

## 🎯 Best Practices

1. **Use Excel-style formulas** for new implementations
2. **Maintain legacy formulas** for backward compatibility
3. **Validate inputs** before formula evaluation
4. **Handle errors gracefully** in your UI
5. **Cache results** for performance-critical applications
6. **Test thoroughly** with your specific use cases

## 🔗 Related Files

- `CommercialFormulaCalculator.ts` - Main implementation
- `CommercialFormulaCalculator.test.ts` - Test suite
- `DocumentFormGadget.tsx` - Integration with form gadget
- `tsti-audit-form.json` - Example usage in TSTI audit form

## 📄 License

This formula calculator is licensed under MIT/BSD compatible terms, making it safe for commercial B2B SaaS applications. 