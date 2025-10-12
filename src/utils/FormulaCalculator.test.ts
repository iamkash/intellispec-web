import { evaluateFormula, validateFormula, FormulaTemplates } from './FormulaCalculator';

describe('FormulaCalculator', () => {
  const mockContext = {
    formData: {
      q1: 'yes',
      q2: 3,
      q3: 2,
      q4: 3,
      q5: 'no',
      q6: 'na',
      q7: 'yes',
      q8: 'yes',
      q9: 'no',
      q10: 'yes',
      q11: 'yes'
    },
    fieldConfigs: {},
    metadata: {}
  };

  describe('evaluateFormula', () => {
    it('should count yes responses correctly', () => {
      const result = evaluateFormula(FormulaTemplates.COUNT_YES, mockContext);
      expect(result.value).toBe(6); // q1, q7, q8, q10, q11 are 'yes'
    });

    it('should count no responses correctly', () => {
      const result = evaluateFormula(FormulaTemplates.COUNT_NO, mockContext);
      expect(result.value).toBe(3); // q5, q9 are 'no'
    });

    it('should count na responses correctly', () => {
      const result = evaluateFormula(FormulaTemplates.COUNT_NA, mockContext);
      expect(result.value).toBe(1); // q6 is 'na'
    });

    it('should calculate overall score correctly', () => {
      const result = evaluateFormula(FormulaTemplates.OVERALL_SCORE, mockContext);
      expect(result.value).toBe(8); // q2(3) + q3(2) + q4(3) = 8
    });

    it('should calculate compliance percentage correctly', () => {
      const result = evaluateFormula(FormulaTemplates.COMPLIANCE_SCORE, mockContext);
      expect(result.value).toBe(66.66666666666666); // 6 yes / (6 yes + 3 no) * 100
    });

    it('should handle field values correctly', () => {
      const result = evaluateFormula("FIELD('q2')", mockContext);
      expect(result.value).toBe(3);
    });

    it('should handle mathematical operations correctly', () => {
      const result = evaluateFormula("FIELD('q2') + FIELD('q3') * 2", mockContext);
      expect(result.value).toBe(7); // 3 + (2 * 2) = 7
    });

    it('should return 0 for invalid formulas', () => {
      const result = evaluateFormula("INVALID_FUNCTION()", mockContext);
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateFormula', () => {
    it('should validate correct formulas', () => {
      const result = validateFormula(FormulaTemplates.COUNT_YES);
      expect(result.isValid).toBe(true);
    });

    it('should reject formulas without valid functions', () => {
      const result = validateFormula("1 + 2 + 3");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must contain at least one valid function');
    });

    it('should reject invalid function calls', () => {
      const result = validateFormula("INVALID_FUNCTION()");
      expect(result.isValid).toBe(false);
    });
  });

  describe('FormulaTemplates', () => {
    it('should have valid template formulas', () => {
      Object.values(FormulaTemplates).forEach(formula => {
        const result = validateFormula(formula);
        expect(result.isValid).toBe(true);
      });
    });
  });
}); 