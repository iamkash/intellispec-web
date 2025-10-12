/**
 * Commercial Formula Calculator Tests
 * 
 * Tests for the commercial-safe formula engine that supports both legacy and Excel-like formulas.
 * This calculator is safe for B2B SaaS applications (MIT/BSD compatible).
 */

import { CommercialFormulaCalculator, FormulaContext } from './CommercialFormulaCalculator';

describe('CommercialFormulaCalculator', () => {
  let calculator: CommercialFormulaCalculator;
  let testContext: FormulaContext;

  beforeEach(() => {
    calculator = new CommercialFormulaCalculator();
    testContext = {
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
      q11: 'yes',
      score: 8,
      totalYes: 7,
      totalNo: 1,
      totalNA: 1
    };
    calculator.setContext(testContext);
  });

  describe('Legacy Formula Support', () => {
    test('should evaluate COUNT function', () => {
      const result = calculator.evaluate("COUNT('yes')");
      expect(result.value).toBe(7);
      expect(result.type).toBe('number');
    });

    test('should evaluate COUNT function for no values', () => {
      const result = calculator.evaluate("COUNT('no')");
      expect(result.value).toBe(1);
      expect(result.type).toBe('number');
    });

    test('should evaluate COUNT function for na values', () => {
      const result = calculator.evaluate("COUNT('na')");
      expect(result.value).toBe(1);
      expect(result.type).toBe('number');
    });

    test('should evaluate SUM function', () => {
      const result = calculator.evaluate("SUM(q2, q3, q4)");
      expect(result.value).toBe(8);
      expect(result.type).toBe('number');
    });

    test('should evaluate FIELD function', () => {
      const result = calculator.evaluate("FIELD('q2')");
      expect(result.value).toBe(3);
      expect(result.type).toBe('number');
    });

    test('should handle missing fields in SUM', () => {
      const result = calculator.evaluate("SUM(q2, missingField, q3)");
      expect(result.value).toBe(5); // q2(3) + missingField(0) + q3(2)
      expect(result.type).toBe('number');
    });

    test('should handle missing fields in FIELD', () => {
      const result = calculator.evaluate("FIELD('missingField')");
      expect(result.value).toBe(0);
      expect(result.type).toBe('number');
    });
  });

  describe('Excel-like Formula Support', () => {
    test('should evaluate SUM function with = prefix', () => {
      const result = calculator.evaluate("=SUM(q2, q3, q4)");
      expect(result.value).toBe(8);
      expect(result.type).toBe('number');
    });

    test('should evaluate AVERAGE function', () => {
      const result = calculator.evaluate("=AVERAGE(q2, q3, q4)");
      expect(result.value).toBeCloseTo(2.67, 2);
      expect(result.type).toBe('number');
    });

    test('should evaluate COUNT function', () => {
      const result = calculator.evaluate("=COUNT(q1, q2, q3, q4, q5)");
      expect(result.value).toBe(5);
      expect(result.type).toBe('number');
    });

    test('should evaluate COUNTIF function', () => {
      const result = calculator.evaluate('=COUNTIF(q1, "yes")');
      expect(result.value).toBe(1);
      expect(result.type).toBe('number');
    });

    test('should evaluate ROUND function', () => {
      const result = calculator.evaluate("=ROUND(3.14159, 2)");
      expect(result.value).toBe(3.14);
      expect(result.type).toBe('number');
    });

    test('should evaluate MAX function', () => {
      const result = calculator.evaluate("=MAX(q2, q3, q4)");
      expect(result.value).toBe(3);
      expect(result.type).toBe('number');
    });

    test('should evaluate MIN function', () => {
      const result = calculator.evaluate("=MIN(q2, q3, q4)");
      expect(result.value).toBe(2);
      expect(result.type).toBe('number');
    });

    test('should evaluate ABS function', () => {
      const result = calculator.evaluate("=ABS(-5)");
      expect(result.value).toBe(5);
      expect(result.type).toBe('number');
    });

    test('should evaluate POWER function', () => {
      const result = calculator.evaluate("=POWER(2, 3)");
      expect(result.value).toBe(8);
      expect(result.type).toBe('number');
    });

    test('should evaluate SQRT function', () => {
      const result = calculator.evaluate("=SQRT(16)");
      expect(result.value).toBe(4);
      expect(result.type).toBe('number');
    });
  });

  describe('Logical Functions', () => {
    test('should evaluate IF function', () => {
      const result = calculator.evaluate('=IF(q2 > 2, "High", "Low")');
      expect(result.value).toBe('High');
      expect(result.type).toBe('string');
    });

    test('should evaluate IF function with false condition', () => {
      const result = calculator.evaluate('=IF(q2 < 2, "Low", "High")');
      expect(result.value).toBe('High');
      expect(result.type).toBe('string');
    });

    test('should evaluate AND function', () => {
      const result = calculator.evaluate('=AND(q2 > 2, q3 > 1)');
      expect(result.value).toBe(true);
      expect(result.type).toBe('boolean');
    });

    test('should evaluate OR function', () => {
      const result = calculator.evaluate('=OR(q2 > 5, q3 > 1)');
      expect(result.value).toBe(true);
      expect(result.type).toBe('boolean');
    });

    test('should evaluate NOT function', () => {
      const result = calculator.evaluate('=NOT(FALSE)');
      expect(result.value).toBe(true);
      expect(result.type).toBe('boolean');
    });
  });

  describe('Text Functions', () => {
    test('should evaluate CONCATENATE function', () => {
      const result = calculator.evaluate('=CONCATENATE("Hello", " ", "World")');
      expect(result.value).toBe('Hello World');
      expect(result.type).toBe('string');
    });

    test('should evaluate LEN function', () => {
      const result = calculator.evaluate('=LEN("Hello World")');
      expect(result.value).toBe(11);
      expect(result.type).toBe('number');
    });

    test('should evaluate UPPER function', () => {
      const result = calculator.evaluate('=UPPER("hello world")');
      expect(result.value).toBe('HELLO WORLD');
      expect(result.type).toBe('string');
    });

    test('should evaluate LOWER function', () => {
      const result = calculator.evaluate('=LOWER("HELLO WORLD")');
      expect(result.value).toBe('hello world');
      expect(result.type).toBe('string');
    });
  });

  describe('Statistical Functions', () => {
    test('should evaluate SUMPRODUCT function', () => {
      const result = calculator.evaluate('=SUMPRODUCT([1, 2, 3], [4, 5, 6])');
      expect(result.value).toBe(32); // 1*4 + 2*5 + 3*6
      expect(result.type).toBe('number');
    });

    test('should evaluate MEDIAN function', () => {
      const result = calculator.evaluate('=MEDIAN(1, 3, 5, 7, 9)');
      expect(result.value).toBe(5);
      expect(result.type).toBe('number');
    });

    test('should evaluate MEDIAN function with even number of values', () => {
      const result = calculator.evaluate('=MEDIAN(1, 3, 5, 7)');
      expect(result.value).toBe(4); // (3 + 5) / 2
      expect(result.type).toBe('number');
    });

    test('should evaluate MODE function', () => {
      const result = calculator.evaluate('=MODE(1, 2, 2, 3, 4, 2, 5)');
      expect(result.value).toBe(2);
      expect(result.type).toBe('number');
    });
  });

  describe('Mathematical Expressions', () => {
    test('should evaluate simple addition', () => {
      const result = calculator.evaluate('=2 + 3');
      expect(result.value).toBe(5);
      expect(result.type).toBe('number');
    });

    test('should evaluate complex expression', () => {
      const result = calculator.evaluate('=(q2 + q3) * 2');
      expect(result.value).toBe(10); // (3 + 2) * 2
      expect(result.type).toBe('number');
    });

    test('should evaluate expression with field references', () => {
      const result = calculator.evaluate('=q2 + q3 + q4');
      expect(result.value).toBe(8); // 3 + 2 + 3
      expect(result.type).toBe('number');
    });

    test('should handle division', () => {
      const result = calculator.evaluate('=10 / 2');
      expect(result.value).toBe(5);
      expect(result.type).toBe('number');
    });

    test('should handle multiplication', () => {
      const result = calculator.evaluate('=3 * 4');
      expect(result.value).toBe(12);
      expect(result.type).toBe('number');
    });

    test('should handle subtraction', () => {
      const result = calculator.evaluate('=10 - 3');
      expect(result.value).toBe(7);
      expect(result.type).toBe('number');
    });
  });

  describe('Field References', () => {
    test('should evaluate direct field reference', () => {
      const result = calculator.evaluate('=q2');
      expect(result.value).toBe(3);
      expect(result.type).toBe('number');
    });

    test('should handle missing field reference', () => {
      const result = calculator.evaluate('=missingField');
      expect(result.value).toBe(0);
      expect(result.type).toBe('number');
    });

    test('should handle string field values', () => {
      const result = calculator.evaluate('=q1');
      expect(result.value).toBe('yes');
      expect(result.type).toBe('string');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid formula', () => {
      const result = calculator.evaluate('=INVALID_FUNCTION()');
      expect(result.type).toBe('error');
      expect(result.error).toContain('Unknown function');
    });

    test('should handle empty formula', () => {
      const result = calculator.evaluate('');
      expect(result.value).toBe(0);
      expect(result.type).toBe('number');
    });

    test('should handle null formula', () => {
      const result = calculator.evaluate(null as any);
      expect(result.value).toBe(0);
      expect(result.type).toBe('number');
    });

    test('should handle undefined formula', () => {
      const result = calculator.evaluate(undefined as any);
      expect(result.value).toBe(0);
      expect(result.type).toBe('number');
    });

    test('should handle division by zero gracefully', () => {
      const result = calculator.evaluate('=1 / 0');
      expect(result.type).toBe('error');
    });
  });

  describe('Real-world TSTI Audit Examples', () => {
    test('should calculate total yes responses', () => {
      const result = calculator.evaluate("COUNT('yes')");
      expect(result.value).toBe(7);
    });

    test('should calculate total no responses', () => {
      const result = calculator.evaluate("COUNT('no')");
      expect(result.value).toBe(1);
    });

    test('should calculate total N/A responses', () => {
      const result = calculator.evaluate("COUNT('na')");
      expect(result.value).toBe(1);
    });

    test('should calculate overall score', () => {
      const result = calculator.evaluate("=FIELD('q2') + FIELD('q3') + FIELD('q4')");
      expect(result.value).toBe(8);
    });

    test('should calculate compliance percentage', () => {
      const result = calculator.evaluate("=(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100");
      expect(result.value).toBe(87.5); // 7 / (7 + 1) * 100
    });

    test('should calculate Excel-style compliance percentage', () => {
      const result = calculator.evaluate('=COUNTIF(q1, "yes") / (COUNTIF(q1, "yes") + COUNTIF(q1, "no")) * 100');
      expect(result.value).toBe(100); // 1 / (1 + 0) * 100
    });
  });

  describe('Custom Function Registration', () => {
    test('should allow custom function registration', () => {
      calculator.registerFunction('CUSTOM_SUM', (...args: number[]) => 
        args.reduce((sum, arg) => sum + arg, 0)
      );
      
      const result = calculator.evaluate('=CUSTOM_SUM(1, 2, 3)');
      expect(result.value).toBe(6);
      expect(result.type).toBe('number');
    });

    test('should handle custom function with string arguments', () => {
      calculator.registerFunction('CUSTOM_CONCAT', (...args: any[]) => 
        args.map(arg => String(arg).toUpperCase()).join('-')
      );
      
      const result = calculator.evaluate('=CUSTOM_CONCAT("hello", "world")');
      expect(result.value).toBe('HELLO-WORLD');
      expect(result.type).toBe('string');
    });
  });

  describe('Context Management', () => {
    test('should update context correctly', () => {
      const newContext = { x: 10, y: 20, z: 30 };
      calculator.setContext(newContext);
      
      const result = calculator.evaluate('=x + y + z');
      expect(result.value).toBe(60);
    });

    test('should handle context with mixed data types', () => {
      const mixedContext = { 
        number: 42, 
        string: 'hello', 
        boolean: true,
        array: [1, 2, 3]
      };
      calculator.setContext(mixedContext);
      
      const result = calculator.evaluate('=number');
      expect(result.value).toBe(42);
    });
  });
}); 