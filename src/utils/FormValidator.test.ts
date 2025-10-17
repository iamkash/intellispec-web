/**
 * Unit tests for FormValidator class
 * 
 * Tests validation logic for different field types including email, phone, URL, and password validation.
 */

import FormValidator, { FieldConfig } from './FormValidator';

describe('FormValidator', () => {
  
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user123@test-domain.com',
        'email+tag@example.org'
      ];
      
      validEmails.forEach(email => {
        const result = FormValidator.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
    
    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user@domain',
        'user..name@domain.com',
        'user@domain..com'
      ];
      
      invalidEmails.forEach(email => {
        const result = FormValidator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid email address');
      });
    });
    
    it('should treat empty values as valid', () => {
      const emptyValues = ['', null, undefined, '   '];
      
      emptyValues.forEach(value => {
        const result = FormValidator.validateEmail(value as string);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
  });
  
  describe('validatePhone', () => {
    it('should validate correct phone formats', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+44 20 7123 4567',
        '(555) 123-4567',
        '555.123.4567'
      ];
      
      validPhones.forEach(phone => {
        const result = FormValidator.validatePhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
    
    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        '123',
        'abc123',
        '+',
        '++1234567890',
        '0123456789012345678' // Too long
      ];
      
      invalidPhones.forEach(phone => {
        const result = FormValidator.validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid phone number');
      });
    });
  });
  
  describe('validateUrl', () => {
    it('should validate correct URL formats', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'https://subdomain.example.com/path',
        'https://example.com:8080/path?query=value'
      ];
      
      validUrls.forEach(url => {
        const result = FormValidator.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
    
    it('should reject invalid URL formats', () => {
      const invalidUrls = [
        'invalid-url',
        'example.com',
        'ftp://example.com', // Invalid protocol for URL constructor
        'http://',
        'https://'
      ];
      
      invalidUrls.forEach(url => {
        const result = FormValidator.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid URL');
      });
    });
  });
  
  describe('validateNumber', () => {
    it('should validate correct number formats', () => {
      const validNumbers = [123, '123', '123.45', '-123', '0'];
      
      validNumbers.forEach(number => {
        const result = FormValidator.validateNumber(number);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
    
    it('should reject invalid number formats', () => {
      const invalidNumbers = ['abc', '123abc', 'NaN', 'infinity'];
      
      invalidNumbers.forEach(number => {
        const result = FormValidator.validateNumber(number);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid number');
      });
    });
    
    it('should validate min/max constraints', () => {
      const config: FieldConfig = { min: 10, max: 100 };
      
      // Valid range
      expect(FormValidator.validateNumber(50, config).isValid).toBe(true);
      expect(FormValidator.validateNumber(10, config).isValid).toBe(true);
      expect(FormValidator.validateNumber(100, config).isValid).toBe(true);
      
      // Invalid range
      expect(FormValidator.validateNumber(5, config).isValid).toBe(false);
      expect(FormValidator.validateNumber(150, config).isValid).toBe(false);
    });
  });
  
  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123',
        'MyStr0ngP@ss',
        'ComplexPass1'
      ];
      
      strongPasswords.forEach(password => {
        const result = FormValidator.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
    
    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        'lowercase',
        'UPPERCASE',
        'NoNumbers',
        '12345678'
      ];
      
      weakPasswords.forEach(password => {
        const result = FormValidator.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('Password must contain');
      });
    });
  });
  
  describe('validateRequired', () => {
    it('should validate required fields', () => {
      const validValues = ['value', 123, true, ['item'], { key: 'value' }];
      
      validValues.forEach(value => {
        const result = FormValidator.validateRequired(value, 'Test Field');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
    
    it('should reject empty required fields', () => {
      const emptyValues = [null, undefined, '', '   ', []];
      
      emptyValues.forEach(value => {
        const result = FormValidator.validateRequired(value, 'Test Field');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Test Field is required');
      });
    });
  });
  
  describe('validateField', () => {
    it('should validate field with multiple rules', () => {
      const emailConfig: FieldConfig = {
        type: 'email',
        label: 'Email Address',
        required: true
      };
      
      // Valid email
      expect(FormValidator.validateField('user@example.com', emailConfig).isValid).toBe(true);
      
      // Invalid email format
      expect(FormValidator.validateField('invalid-email', emailConfig).isValid).toBe(false);
      
      // Required field empty
      expect(FormValidator.validateField('', emailConfig).isValid).toBe(false);
    });
    
    it('should work with custom validators', () => {
      const customConfig: FieldConfig = {
        type: 'text',
        label: 'Custom Field',
        validator: (value: string) => {
          const isValid = value.startsWith('custom-');
          return {
            isValid,
            message: isValid ? undefined : 'Value must start with "custom-"'
          };
        }
      };
      
      expect(FormValidator.validateField('custom-value', customConfig).isValid).toBe(true);
      expect(FormValidator.validateField('invalid-value', customConfig).isValid).toBe(false);
    });
  });
  
  describe('validateForm', () => {
    it('should validate entire form with multiple fields', () => {
      const formData = {
        email: 'user@example.com',
        phone: '+1234567890',
        name: 'John Doe',
        age: 25
      };
      
      const fieldConfigs: Record<string, FieldConfig> = {
        email: { type: 'email', label: 'Email', required: true },
        phone: { type: 'phone', label: 'Phone', required: false },
        name: { type: 'text', label: 'Name', required: true },
        age: { type: 'number', label: 'Age', required: false, min: 18, max: 120 }
      };
      
      const result = FormValidator.validateForm(formData, fieldConfigs);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
    
    it('should return errors for invalid form data', () => {
      const formData = {
        email: 'invalid-email',
        phone: 'invalid-phone',
        name: '', // Required but empty
        age: 150 // Above max
      };
      
      const fieldConfigs: Record<string, FieldConfig> = {
        email: { type: 'email', label: 'Email', required: true },
        phone: { type: 'phone', label: 'Phone', required: false },
        name: { type: 'text', label: 'Name', required: true },
        age: { type: 'number', label: 'Age', required: false, min: 18, max: 120 }
      };
      
      const result = FormValidator.validateForm(formData, fieldConfigs);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.phone).toBe('Please enter a valid phone number');
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.age).toBe('Value must be at most 120');
    });
  });
  
  describe('getFieldRequirements', () => {
    it('should return requirements for different field types', () => {
      expect(FormValidator.getFieldRequirements('email')).toContain('Valid email format (user@domain.com)');
      expect(FormValidator.getFieldRequirements('phone')).toContain('Valid phone number format');
      expect(FormValidator.getFieldRequirements('url')).toContain('Valid URL format (https://example.com)');
      expect(FormValidator.getFieldRequirements('password')).toContain('At least 8 characters');
      expect(FormValidator.getFieldRequirements('number')).toContain('Valid number format');
      expect(FormValidator.getFieldRequirements('unknown')).toHaveLength(0);
    });
  });
}); 
