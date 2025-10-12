/**
 * Commercial Formula Calculator Demo
 * 
 * This demo shows how the commercial-safe formula calculator works
 * without any GPL-3.0 licensing restrictions.
 * 
 * SAFE FOR B2B SAAS APPLICATIONS - MIT/BSD Compatible
 */

// Import the calculator (in a real app, you'd use ES6 imports)
const { CommercialFormulaCalculator } = require('./CommercialFormulaCalculator.ts');
// Create calculator instance
const calculator = new CommercialFormulaCalculator();

// Set up test data (TSTI audit form context)
const testContext = {
  q1: 'yes',
  q2: 3,
  q3: 2,
  q4: 3,
  q5: 'no',
  q6: 'yes',
  q7: 'yes',
  q8: 'yes',
  q9: 'yes',
  q10: 'na',
  q11: 'yes'
};

calculator.setContext(testContext);
// Test legacy formulas (backward compatibility)
const legacyTests = [
  { formula: "COUNT('yes')", description: "Count Yes responses" },
  { formula: "COUNT('no')", description: "Count No responses" },
  { formula: "COUNT('na')", description: "Count N/A responses" },
  { formula: "SUM(q2, q3, q4)", description: "Sum of scores" },
  { formula: "FIELD('q2')", description: "Get field value" }
];

legacyTests.forEach(test => {
  const result = calculator.evaluate(test.formula);
console.log(`  Formula: ${test.formula}`);
if (result.error) {
}
});

// Test Excel-like formulas
const excelTests = [
  { formula: "=SUM(q2, q3, q4)", description: "Excel SUM function" },
  { formula: "=AVERAGE(q2, q3, q4)", description: "Excel AVERAGE function" },
  { formula: "=MAX(q2, q3, q4)", description: "Excel MAX function" },
  { formula: "=MIN(q2, q3, q4)", description: "Excel MIN function" },
  { formula: "=q2 + q3 + q4", description: "Mathematical expression" },
  { formula: "=(q2 + q3 + q4) / 3", description: "Complex expression" },
  { formula: '=IF(q2 > 2, "High", "Low")', description: "IF function with condition" },
  { formula: '=CONCATENATE("Score: ", q2)', description: "Text concatenation" }
];

excelTests.forEach(test => {
  const result = calculator.evaluate(test.formula);
console.log(`  Formula: ${test.formula}`);
if (result.error) {
}
});

// Test TSTI audit specific calculations
const auditTests = [
  { 
    formula: "=(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100", 
    description: "Compliance percentage (legacy)" 
  },
  { 
    formula: '=COUNTIF(q1, "yes") / (COUNTIF(q1, "yes") + COUNTIF(q1, "no")) * 100', 
    description: "Compliance percentage (Excel-style)" 
  },
  { 
    formula: "=FIELD('q2') + FIELD('q3') + FIELD('q4')", 
    description: "Overall audit score" 
  }
];

auditTests.forEach(test => {
  const result = calculator.evaluate(test.formula);
console.log(`  Formula: ${test.formula}`);
if (result.error) {
}
});

// Test error handling
const errorTests = [
  { formula: "=INVALID_FUNCTION()", description: "Unknown function" },
  { formula: "", description: "Empty formula" },
  { formula: null, description: "Null formula" },
  { formula: "=1 / 0", description: "Division by zero" }
];

errorTests.forEach(test => {
  const result = calculator.evaluate(test.formula);
console.log(`  Formula: ${test.formula}`);
if (result.error) {
}
});

// Test custom function registration
// Register a custom business function
calculator.registerFunction('AUDIT_SCORE', (...args) => {
  const yesCount = args.filter(arg => arg === 'yes').length;
  const totalCount = args.length;
  return totalCount > 0 ? (yesCount / totalCount) * 100 : 0;
});

const customResult = calculator.evaluate('=AUDIT_SCORE(q1, q5, q6, q7, q8, q9, q11)');
