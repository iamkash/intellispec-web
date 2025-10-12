import { fillTemplate, coerceFieldValue } from '../utils/prompt';

describe('prompt utils', () => {
  test('fillTemplate replaces double-curly placeholders safely', () => {
    const tpl = 'Hello {{name}} with data {{data_json}}';
    const out = fillTemplate(tpl, { name: 'World', data_json: { a: 1 } });
    expect(out).toContain('Hello World');
    expect(out).toContain('{"a":1}');
  });

  test('coerceFieldValue handles number, arrays and enums', () => {
    expect(coerceFieldValue('number', '42')).toBe(42);
    expect(coerceFieldValue('checkbox_group', 'x')).toEqual(['x']);
    expect(coerceFieldValue('dropdown', 'a', ['a', 'b'])).toBe('a');
    expect(coerceFieldValue('dropdown', 'c', ['a', 'b'])).toBeUndefined();
    expect(coerceFieldValue('date', '2020-01-01')).toBe('2020-01-01');
  });
});


