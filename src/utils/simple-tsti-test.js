/**
 * Simple TSTI Calculation Test
 * 
 * This test simulates the TSTI audit form calculations to verify
 * that the formulas work correctly.
 */
// Simulate TSTI form data
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
// Simple COUNT function simulation
function countValues(data, value) {
  let count = 0;
  for (const key in data) {
    if (data[key] === value) {
      count++;
    }
  }
  return count;
}

// Simple FIELD function simulation
function getFieldValue(data, fieldName) {
  return data[fieldName] || 0;
}

// Test calculations
const calculations = [
  {
    name: 'Total Yes Responses',
    formula: "COUNT('yes')",
    calculation: () => countValues(tstiFormData, 'yes'),
    expected: 7
  },
  {
    name: 'Total No Responses',
    formula: "COUNT('no')",
    calculation: () => countValues(tstiFormData, 'no'),
    expected: 1
  },
  {
    name: 'Total N/A Responses',
    formula: "COUNT('na')",
    calculation: () => countValues(tstiFormData, 'na'),
    expected: 1
  },
  {
    name: 'Overall Audit Score',
    formula: "FIELD('q2') + FIELD('q3') + FIELD('q4')",
    calculation: () => getFieldValue(tstiFormData, 'q2') + getFieldValue(tstiFormData, 'q3') + getFieldValue(tstiFormData, 'q4'),
    expected: 8
  },
  {
    name: 'Compliance Percentage',
    formula: "(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100",
    calculation: () => {
      const yesCount = countValues(tstiFormData, 'yes');
      const noCount = countValues(tstiFormData, 'no');
      return (yesCount / (yesCount + noCount)) * 100;
    },
    expected: 87.5
  }
];

calculations.forEach(calc => {
  const result = calc.calculation();
  const isCorrect = Math.abs(result - calc.expected) < 0.01;
  const status = isCorrect ? '✅' : '❌';
console.log(`  Formula: ${calc.formula}`);
console.log(`  Actual: ${result}`);
});

// Test Excel-style calculations
const excelCalculations = [
  {
    name: 'Excel SUM Function',
    formula: "=SUM(q2, q3, q4)",
    calculation: () => getFieldValue(tstiFormData, 'q2') + getFieldValue(tstiFormData, 'q3') + getFieldValue(tstiFormData, 'q4'),
    expected: 8
  },
  {
    name: 'Excel AVERAGE Function',
    formula: "=AVERAGE(q2, q3, q4)",
    calculation: () => {
      const sum = getFieldValue(tstiFormData, 'q2') + getFieldValue(tstiFormData, 'q3') + getFieldValue(tstiFormData, 'q4');
      return sum / 3;
    },
    expected: 2.67
  },
  {
    name: 'Excel IF Function',
    formula: '=IF(q2 > 2, "High", "Low")',
    calculation: () => getFieldValue(tstiFormData, 'q2') > 2 ? 'High' : 'Low',
    expected: 'High'
  }
];

excelCalculations.forEach(calc => {
  const result = calc.calculation();
  const isCorrect = typeof calc.expected === 'number' 
    ? Math.abs(result - calc.expected) < 0.01
    : result === calc.expected;
  const status = isCorrect ? '✅' : '❌';
console.log(`  Formula: ${calc.formula}`);
console.log(`  Actual: ${result}`);
});
