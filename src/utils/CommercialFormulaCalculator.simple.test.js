/**
 * Simple JavaScript test for Commercial Formula Calculator
 * Tests basic functionality without TypeScript compilation issues
 */

// Mock the calculator for testing
const { CommercialFormulaCalculator } = require('./CommercialFormulaCalculator.ts');

describe('CommercialFormulaCalculator - Basic Tests', () => {
  let calculator;

  beforeEach(() => {
    calculator = new CommercialFormulaCalculator();
    calculator.setContext({
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
    });
  });

  test('should evaluate legacy COUNT function', () => {
    const result = calculator.evaluate("COUNT('yes')");
    expect(result.value).toBe(7);
    expect(result.type).toBe('number');
  });

  test('should evaluate legacy SUM function', () => {
    const result = calculator.evaluate("SUM(q2, q3, q4)");
    expect(result.value).toBe(8);
    expect(result.type).toBe('number');
  });

  test('should evaluate Excel-style SUM function', () => {
    const result = calculator.evaluate("=SUM(q2, q3, q4)");
    expect(result.value).toBe(8);
    expect(result.type).toBe('number');
  });

  test('should evaluate mathematical expression', () => {
    const result = calculator.evaluate("=q2 + q3 + q4");
    expect(result.value).toBe(8);
    expect(result.type).toBe('number');
  });

  test('should handle missing fields gracefully', () => {
    const result = calculator.evaluate("=SUM(q2, missingField, q3)");
    expect(result.value).toBe(5); // q2(3) + missingField(0) + q3(2)
    expect(result.type).toBe('number');
  });

  test('should evaluate IF function with field references', () => {
    const result = calculator.evaluate('=IF(q2 > 2, "High", "Low")');
    expect(result.value).toBe('High');
    expect(result.type).toBe('string');
  });

  test('should evaluate AVERAGE function', () => {
    const result = calculator.evaluate("=AVERAGE(q2, q3, q4)");
    expect(result.value).toBeCloseTo(2.67, 2);
    expect(result.type).toBe('number');
  });

  test('should handle empty formula', () => {
    const result = calculator.evaluate('');
    expect(result.value).toBe(0);
    expect(result.type).toBe('number');
  });

  test('should handle null formula', () => {
    const result = calculator.evaluate(null);
    expect(result.value).toBe(0);
    expect(result.type).toBe('number');
  });
}); 