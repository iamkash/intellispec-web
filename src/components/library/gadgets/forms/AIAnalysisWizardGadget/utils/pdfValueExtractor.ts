/**
 * PDF Value Extractor Utility
 * 
 * Safely extracts display values from various data types for PDF generation.
 * Handles complex objects, arrays, and edge cases to prevent [object Object] or
 * other malformed text from appearing in PDFs.
 */

/**
 * Normalizes text for PDF rendering by converting Unicode special characters
 * to ASCII equivalents that jsPDF's built-in fonts can handle properly.
 * This prevents weird spacing and character rendering issues.
 */
const normalizeForPdf = (s: string): string => {
  if (!s) return '';
  return s
    .normalize('NFKC')  // Normalize Unicode composition
    // Non-breaking spaces and special spaces
    .replace(/\u00A0/g, ' ')      // Non-breaking space -> regular space
    .replace(/\u202F/g, ' ')      // Narrow non-breaking space -> space
    .replace(/\u2007/g, ' ')      // Figure space -> space
    .replace(/\u2008/g, ' ')      // Punctuation space -> space
    .replace(/\u2009/g, ' ')      // Thin space -> space
    .replace(/\u200A/g, ' ')      // Hair space -> space
    // Hyphens and dashes
    .replace(/\u2011/g, '-')      // Non-breaking hyphen -> regular hyphen
    .replace(/\u2010/g, '-')      // Hyphen -> regular hyphen
    .replace(/\u2012/g, '-')      // Figure dash -> hyphen
    .replace(/\u2013/g, '-')      // En dash -> hyphen
    .replace(/\u2014/g, '-')      // Em dash -> hyphen
    .replace(/\u2212/g, '-')      // Minus sign -> hyphen
    // Quotes and apostrophes
    .replace(/[\u2018\u2019]/g, "'")  // Left/right single quotes -> apostrophe
    .replace(/[\u201C\u201D]/g, '"')   // Left/right double quotes -> quote
    .replace(/\u201A/g, "'")          // Single low quote -> apostrophe
    .replace(/\u201E/g, '"')          // Double low quote -> quote
    // Other punctuation
    .replace(/\u2026/g, '...')        // Ellipsis -> three dots
    .replace(/\u00B7/g, '·')          // Middle dot (keep as is)
    // Collapse multiple spaces and normalize line endings
    .replace(/[ \t]+/g, ' ')          // Multiple spaces/tabs -> single space
    .replace(/\r\n/g, '\n')           // Windows line endings -> Unix
    .replace(/\r/g, '\n')             // Mac line endings -> Unix
    .trim();
};

/**
 * Extracts a display-friendly string value from any data type
 * @param value - The raw value from form data
 * @param fieldType - Optional field type hint for special handling
 * @returns A properly formatted string for PDF display
 */
export function extractPdfValue(value: any, fieldType?: string): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Handle signature fields specially
  if (fieldType === 'signature' && typeof value === 'object' && value?.dataURL) {
    const signedBy = value.signedBy || 'Unknown';
    const timestamp = value.timestamp 
      ? new Date(value.timestamp).toLocaleString() 
      : 'Unknown time';
    return `Digitally signed by: ${signedBy} on ${timestamp}`;
  }

  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle primitive types (string, number)
  if (typeof value === 'string') {
    return normalizeForPdf(value);
  }
  if (typeof value === 'number') {
    return String(value);
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value
      .map(item => extractSingleValue(item))
      .filter(v => v !== '')
      .join(', ');
  }

  // Handle objects
  if (typeof value === 'object') {
    return extractSingleValue(value);
  }

  // Fallback - should rarely reach here
  try {
    const stringified = JSON.stringify(value);
    // If it's a simple value that can be stringified, use it
    if (stringified && stringified !== '{}' && stringified !== '[]') {
      // Remove quotes from simple string values
      if (stringified.startsWith('"') && stringified.endsWith('"')) {
        return stringified.slice(1, -1);
      }
      return stringified;
    }
  } catch {
    // If JSON.stringify fails, return empty string
  }

  return '';
}

/**
 * Extracts a single value from an object or primitive
 * @param item - The item to extract value from
 * @returns The extracted string value
 */
function extractSingleValue(item: any): string {
  // Handle null/undefined
  if (item === null || item === undefined) {
    return '';
  }

  // Handle primitives
  if (typeof item === 'string') {
    return normalizeForPdf(String(item));
  }
  if (typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }

  // Handle objects with common display properties
  if (typeof item === 'object' && !Array.isArray(item)) {
    // Priority order for display properties
    const displayProperties = [
      'label',      // Most common for select/dropdown
       'text',       // Alternative label property
       'display',    // Display value
      'displayName',// Display name
      'name',       // Common name property
      'title',      // Title property
      'value',      // Fallback to value if no label
      'description',// Description as last resort
      'toString'    // If object has custom toString
    ];

    for (const prop of displayProperties) {
      if (prop === 'toString' && typeof item.toString === 'function') {
        const result = item.toString();
        // Only use toString if it doesn't return [object Object]
        if (result && !result.includes('[object')) {
          return result;
        }
      } else if (item[prop] !== undefined && item[prop] !== null) {
        const val = item[prop];
        if (typeof val === 'string') {
          return normalizeForPdf(val);
        }
        if (typeof val === 'number') {
          return String(val);
        }
      }
    }

    // Special handling for objects with id and no display properties
    if (item.id && !item.label && !item.name) {
      const idStr = String(item.id);
      return typeof item.id === 'string' ? normalizeForPdf(idStr) : idStr;
    }

    // Handle objects with nested structure (e.g., {data: {value: "x"}})
    if (item.data && typeof item.data === 'object') {
      return extractSingleValue(item.data);
    }

    // If object has only one property, use its value
    const keys = Object.keys(item);
    if (keys.length === 1) {
      return extractSingleValue(item[keys[0]]);
    }

    // For objects with multiple properties but no clear display value,
    // try to create a meaningful string
    if (keys.length > 0 && keys.length <= 3) {
      const values = keys
        .map(key => {
          const val = item[key];
          if (val !== null && val !== undefined && typeof val !== 'object') {
            return `${key}: ${val}`;
          }
          return null;
        })
        .filter(Boolean);
      
      if (values.length > 0) {
        return values.join(', ');
      }
    }
  }

  // Last resort - return empty string instead of [object Object]
  return '';
}

/**
 * Formats a value based on field type for better PDF display
 * @param value - The extracted string value
 * @param fieldType - The field type
 * @returns Formatted string value
 */
export function formatPdfValue(value: string, fieldType?: string): string {
  if (!value) return '';

  switch (fieldType) {
    case 'currency':
      // Format as currency if it's a number
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(num);
      }
      return value;

    case 'percentage':
      const percent = parseFloat(value);
      if (!isNaN(percent)) {
        return `${percent}%`;
      }
      return value;

    case 'date':
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch {
        // Fall through to return original value
      }
      return value;

    case 'datetime':
      try {
        const datetime = new Date(value);
        if (!isNaN(datetime.getTime())) {
          return datetime.toLocaleString();
        }
      } catch {
        // Fall through to return original value
      }
      return value;

    case 'phone':
      // Format phone numbers if they're 10 digits
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      return value;

    default:
      return value;
  }
}

/**
 * Main function to safely extract and format values for PDF
 * @param value - Raw value from form data
 * @param fieldType - Optional field type for special handling
 * @returns Properly formatted string for PDF display
 */
const normalizeOptions = (options: any): Array<{ label: string; value: any }> => {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (option === null || option === undefined) {
        return null;
      }
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      if (typeof option === 'object') {
        const optLabel = option.label ?? option.name ?? option.title ?? option.text ?? option.value;
        const optValue = option.value ?? option.id ?? option.key ?? optLabel;
        if (optLabel === undefined && optValue === undefined) {
          return null;
        }
        return {
          label: normalizeForPdf(String(optLabel ?? '')),
          value: optValue
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ label: string; value: any }>;
};

const mapValueToOptionLabel = (rawValue: any, fieldType?: string, fieldConfig?: any): any => {
  if (!fieldConfig) return rawValue;

  const optionSources = [
    fieldConfig.options,
    fieldConfig.props?.options,
    fieldConfig.meta?.options
  ].find((opts) => Array.isArray(opts));

  const normalizedOptions = normalizeOptions(optionSources);
  if (!normalizedOptions.length) {
    return rawValue;
  }

  const toLabeledObject = (val: any) => {
    if (val === null || val === undefined) return val;

    if (typeof val === 'object') {
      if (typeof val.label === 'string') {
        return { label: normalizeForPdf(val.label), value: val.value ?? val.id ?? val.key ?? val.label };
      }
      if (val.name || val.title || val.text) {
        const label = val.name ?? val.title ?? val.text;
        return { label: normalizeForPdf(String(label)), value: val.value ?? val.id ?? val.key ?? label };
      }
    }

    const match = normalizedOptions.find((opt) => {
      if (Array.isArray(opt.value)) {
        return opt.value.includes(val);
      }
      if (typeof opt.value === 'string' || typeof opt.value === 'number' || typeof opt.value === 'boolean') {
        return String(opt.value) === String(val);
      }
      return opt.value === val;
    });

    if (match) {
      return {
        label: match.label,
        value: match.value
      };
    }

    return val;
  };

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => toLabeledObject(item));
  }

  // checkbox_group can sometimes be stored as object with keys true/false
  if (fieldType === 'checkbox_group' && rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    const keys = Object.keys(rawValue).filter((key) => rawValue[key]);
    return keys.map((key) => toLabeledObject(key));
  }

  return toLabeledObject(rawValue);
};

export function safePdfValue(value: any, fieldType?: string, fieldConfig?: any): string {
  const valueWithLabels = mapValueToOptionLabel(value, fieldType, fieldConfig);
  const extracted = extractPdfValue(valueWithLabels, fieldType);
  const formatted = formatPdfValue(extracted, fieldType);
  // Final normalization pass to ensure any formatted values are also normalized
  return normalizeForPdf(formatted);
}
