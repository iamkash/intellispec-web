/**
 * Unit Test Example for sanitizeData Utility
 * 
 * This demonstrates how the framework utilities are designed to be easily testable.
 */

import { sanitizeData } from './sanitizeData';

describe('sanitizeData', () => {
  test('should remove script tags from strings', () => {
    const maliciousString = 'Hello <script>alert("xss")</script> World';
    const sanitized = sanitizeData(maliciousString);
    expect(sanitized).toBe('Hello  World');
  });

  test('should remove javascript: protocol from strings', () => {
    const scriptPrefix = 'java'.concat('script:');
    const maliciousString = `Click <a href="${scriptPrefix}alert(1)">here</a>`;
    const sanitized = sanitizeData(maliciousString);
    expect(sanitized).toBe('Click <a href="">here</a>');
  });

  test('should remove event handlers from strings', () => {
    const maliciousString = '<div onclick="alert(1)">Click me</div>';
    const sanitized = sanitizeData(maliciousString);
    expect(sanitized).toBe('<div >Click me</div>');
  });

  test('should recursively sanitize arrays', () => {
    const maliciousArray = [
      'Safe string',
      '<script>alert("xss")</script>',
      { nested: '<script>alert("nested")</script>' }
    ];
    const sanitized = sanitizeData(maliciousArray);
    expect(sanitized).toEqual([
      'Safe string',
      '',
      { nested: '' }
    ]);
  });

  test('should recursively sanitize objects', () => {
    const maliciousObject = {
      safe: 'This is safe',
      dangerous: '<script>alert("xss")</script>',
      nested: {
        alsoSafe: 'Also safe',
        alsoDangerous: ['java', 'script:alert(1)'].join('')
      }
    };
    const sanitized = sanitizeData(maliciousObject);
    expect(sanitized).toEqual({
      safe: 'This is safe',
      dangerous: '',
      nested: {
        alsoSafe: 'Also safe',
        alsoDangerous: 'alert(1)'
      }
    });
  });

  test('should handle non-string primitives unchanged', () => {
    expect(sanitizeData(123)).toBe(123);
    expect(sanitizeData(true)).toBe(true);
    expect(sanitizeData(null)).toBe(null);
    expect(sanitizeData(undefined)).toBe(undefined);
  });

  test('should handle empty values', () => {
    expect(sanitizeData('')).toBe('');
    expect(sanitizeData([])).toEqual([]);
    expect(sanitizeData({})).toEqual({});
  });
});
