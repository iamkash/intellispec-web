import { extractPdfValue, formatPdfValue, safePdfValue } from '../pdfValueExtractor';

describe('PDF Value Extractor', () => {
  describe('extractPdfValue', () => {
    // Test primitive values
    it('should handle primitive values', () => {
      expect(extractPdfValue('test string')).toBe('test string');
      expect(extractPdfValue(123)).toBe('123');
      expect(extractPdfValue(true)).toBe('Yes');
      expect(extractPdfValue(false)).toBe('No');
      expect(extractPdfValue(null)).toBe('');
      expect(extractPdfValue(undefined)).toBe('');
    });

    // Test select field objects
    it('should extract label from select field objects', () => {
      expect(extractPdfValue({ label: 'Option A', value: 'opt_a' })).toBe('Option A');
      expect(extractPdfValue({ label: 'Display Text', value: 123 })).toBe('Display Text');
      expect(extractPdfValue({ text: 'Text Value', id: 1 })).toBe('Text Value');
      expect(extractPdfValue({ name: 'Item Name', code: 'ITM001' })).toBe('Item Name');
    });

    // Test arrays
    it('should handle arrays properly', () => {
      expect(extractPdfValue(['item1', 'item2', 'item3'])).toBe('item1, item2, item3');
      expect(extractPdfValue([
        { label: 'Option 1', value: 1 },
        { label: 'Option 2', value: 2 }
      ])).toBe('Option 1, Option 2');
      expect(extractPdfValue([1, 2, 3])).toBe('1, 2, 3');
      expect(extractPdfValue([])).toBe('');
    });

    // Test complex objects
    it('should handle complex objects', () => {
      expect(extractPdfValue({ value: 'simple_value' })).toBe('simple_value');
      expect(extractPdfValue({ title: 'Document Title' })).toBe('Document Title');
      expect(extractPdfValue({ displayName: 'User Name' })).toBe('User Name');
      expect(extractPdfValue({ description: 'Some description' })).toBe('Some description');
    });

    // Test objects that would produce [object Object]
    it('should never return [object Object]', () => {
      const complexObject = {
        nested: {
          deep: {
            value: 'hidden'
          }
        }
      };
      const result = extractPdfValue(complexObject);
      expect(result).not.toContain('[object');
      expect(result).toBe('hidden');
    });

    // Test signature fields
    it('should handle signature fields correctly', () => {
      const signature = {
        dataURL: 'data:image/png;base64,...',
        signedBy: 'John Doe',
        timestamp: '2025-01-01T10:00:00Z'
      };
      const result = extractPdfValue(signature, 'signature');
      expect(result).toContain('Digitally signed by: John Doe');
      expect(result).toContain('on');
    });

    // Test edge cases
    it('should handle edge cases gracefully', () => {
      expect(extractPdfValue({})).toBe('');
      expect(extractPdfValue({ id: 123 })).toBe('123');
      expect(extractPdfValue({ onlyProp: 'value' })).toBe('value');
      const dateResult = extractPdfValue(new Date('2025-01-01'));
      expect(dateResult).not.toContain('[object');
    });
  });

  describe('formatPdfValue', () => {
    it('should format currency values', () => {
      expect(formatPdfValue('1234.56', 'currency')).toBe('$1,234.56');
      expect(formatPdfValue('not a number', 'currency')).toBe('not a number');
    });

    it('should format percentage values', () => {
      expect(formatPdfValue('75.5', 'percentage')).toBe('75.5%');
      expect(formatPdfValue('invalid', 'percentage')).toBe('invalid');
    });

    it('should format date values', () => {
      const result = formatPdfValue('2025-01-01', 'date');
      expect(result).not.toContain('[object');
    });

    it('should format phone numbers', () => {
      expect(formatPdfValue('1234567890', 'phone')).toBe('(123) 456-7890');
      expect(formatPdfValue('123-456-7890', 'phone')).toBe('(123) 456-7890');
      expect(formatPdfValue('12345', 'phone')).toBe('12345');
    });
  });

  describe('safePdfValue', () => {
    it('should extract and format values safely', () => {
      expect(safePdfValue({ label: 'Test', value: 'test' }, 'select')).toBe('Test');
      expect(safePdfValue(1234.56, 'currency')).toBe('$1,234.56');
      const safeDate = safePdfValue('2025-01-01', 'date');
      expect(safeDate).not.toContain('[object');
      expect(typeof safeDate).toBe('string');
      expect(safeDate.length).toBeGreaterThan(0);
      expect(safePdfValue(null)).toBe('');
      expect(safePdfValue({ random: { nested: 'object' } })).toBe('');
    });

    it('should map select values to option labels when field config is provided', () => {
      const fieldConfig = {
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' }
        ]
      };

      expect(safePdfValue('a', 'select', fieldConfig)).toBe('Option A');
      expect(safePdfValue(['a', 'b'], 'multi-select', fieldConfig)).toBe('Option A, Option B');
      const multiObject = safePdfValue([
        { id: 'a' },
        { id: 'b' }
      ], 'multi-select', fieldConfig);
      expect(multiObject).toBe('Option A, Option B');
    });
  });
});
