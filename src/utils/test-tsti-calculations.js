/**
 * Test TSTI Audit Form Calculations
 * 
 * This test verifies that the commercial formula calculator correctly
 * calculates the TSTI audit form summary values.
 */

// Mock the calculator for testing
const { CommercialFormulaCalculator } = require('./CommercialFormulaCalculator.ts');
// Create calculator instance
const calculator = new CommercialFormulaCalculator();

// Set up TSTI audit form data (simulating form responses)
const tstiFormData = {
  q1: 'yes',      // Task Planning Completion
  q2: 3,          // Job Task Planning Score
  q3: 2,          // Hazard Identification Score
  q4: 3,          // Hazard Mitigation Score
  q5: 'no',       // TSTI Revisited After Scope Change
  q6: 'yes',      // Hazard Recognition Completion
  q7: 'yes',      // Coach Questions Asked
  q8: 'yes',      // Employee Review & Signatures
  q9: 'yes',      // FLS Authorization
  q10: 'na',      // 2-Up Process Followed
  q11: 'yes'      // TSTI Plan Compliance
};
// Set the context
calculator.setContext(tstiFormData);

// Test the specific calculations from the TSTI form
const calculations = [
  {
    name: 'Total Yes Responses',
    formula: "COUNT('yes')",
    expected: 7
  },
  {
    name: 'Total No Responses',
    formula: "COUNT('no')",
    expected: 1
  },
  {
    name: 'Total N/A Responses',
    formula: "COUNT('na')",
    expected: 1
  },
  {
    name: 'Overall Audit Score',
    formula: "FIELD('q2') + FIELD('q3') + FIELD('q4')",
    expected: 8
  },
  {
    name: 'Compliance Percentage',
    formula: "(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100",
    expected: 87.5
  }
];
calculations.forEach(calc => {
  const result = calculator.evaluate(calc.formula);
  const isCorrect = Math.abs(result.value - calc.expected) < 0.01;
  const status = isCorrect ? '✅' : '❌';
  console.log(`${status} ${calc.name}`);
  console.log(`  Formula: ${calc.formula}`);
  console.log(`  Actual: ${result.value}`);
if (result.error) {
}
});

// Test Excel-style formulas
const excelCalculations = [
  {
    name: 'Excel SUM Function',
    formula: "=SUM(q2, q3, q4)",
    expected: 8
  },
  {
    name: 'Excel AVERAGE Function',
    formula: "=AVERAGE(q2, q3, q4)",
    expected: 2.67
  },
  {
    name: 'Excel COUNTIF Function',
    formula: '=COUNTIF(q1, "yes")',
    expected: 1
  },
  {
    name: 'Excel IF Function',
    formula: '=IF(q2 > 2, "High", "Low")',
    expected: 'High'
  }
];

excelCalculations.forEach(calc => {
  const result = calculator.evaluate(calc.formula);
  const isCorrect = typeof calc.expected === 'number' 
    ? Math.abs(result.value - calc.expected) < 0.01
    : result.value === calc.expected;
  const status = isCorrect ? '✅' : '❌';
  console.log(`${status} ${calc.name}`);
  console.log(`  Formula: ${calc.formula}`);
  console.log(`  Actual: ${result.value}`);
if (result.error) {
}
});

// Test with form data structure (as used in DocumentFormGadget)
// Simulate the context structure used by DocumentFormGadget
const formDataContext = {
  formData: tstiFormData
};

calculator.setContext(formDataContext);

const formDataCalculations = [
  {
    name: 'Total Yes (with formData structure)',
    formula: "COUNT('yes')",
    expected: 7
  },
  {
    name: 'Total No (with formData structure)',
    formula: "COUNT('no')",
    expected: 1
  },
  {
    name: 'Overall Score (with formData structure)',
    formula: "FIELD('q2') + FIELD('q3') + FIELD('q4')",
    expected: 8
  }
];

formDataCalculations.forEach(calc => {
  const result = calculator.evaluate(calc.formula);
  const isCorrect = Math.abs(result.value - calc.expected) < 0.01;
  const status = isCorrect ? '✅' : '❌';
  console.log(`${status} ${calc.name}`);
  console.log(`  Formula: ${calc.formula}`);
  console.log(`  Actual: ${result.value}`);
if (result.error) {
}
});
