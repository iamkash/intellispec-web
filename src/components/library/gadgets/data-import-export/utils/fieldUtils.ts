import { getDataTypeFromFieldType } from "./dataTypeUtils";

/**
 * Auto-generate semantic aliases from field labels
 * 100% DYNAMIC: No hardcoded aliases - AI uses labels and auto-generated variations
 */
export function generateAliasesFromLabel(label: string, dbField: string): string[] {
    const aliases: string[] = [];

    // Add the label itself
    aliases.push(label);

    // Add the db field name (converted to human-readable)
    const humanReadable = dbField
        .split('.')
        .pop()! // Get last part for nested fields
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    if (humanReadable !== label) {
        aliases.push(humanReadable);
    }

    // Add variations
    const words = label.split(/[\s\/\-(),]+/).filter(w => w.length > 0);

    // Add individual significant words (length > 2)
    words.forEach(word => {
        if (word.length > 2 && !aliases.includes(word)) {
            aliases.push(word);
        }
    });

    // Add combinations of first two words
    if (words.length >= 2) {
        const firstTwo = `${words[0]} ${words[1]}`;
        if (!aliases.includes(firstTwo)) {
            aliases.push(firstTwo);
        }
    }

    return aliases;
}


export interface FieldDefinition {
    dbField: string;
    label: string;
    required: boolean;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    aliases?: string[];
}
  
/**
 * Discover all form fields from form metadata
 * This makes import/export 100% dynamic - adding fields to forms automatically enables import/export!
 * 
 * @param formPath - Path to the form definition JSON file
 * @param documentType - The document type (company, site, asset_group, asset) - used for logging only
 * @returns Array of field definitions extracted from form metadata
 */
export async function discoverFormFields(formPath: string, documentType: string = 'unknown'): Promise<FieldDefinition[]> {
    try {
        if (!formPath) {
        console.warn(`No form path provided for document type: ${documentType}`);
        return [];
        }
        
        // Fetch form definition
        const response = await fetch(formPath);
        if (!response.ok) {
        console.warn(`Failed to load form definition: ${formPath}`);
        return [];
        }
        
        const formDef = await response.json();
        
        // Extract gadgetOptions from the form gadget
        const formGadget = formDef.gadgets?.find((g: any) => g.type === 'document-form-gadget');
        if (!formGadget || !formGadget.config || !formGadget.config.gadgetOptions) {
        console.warn(`No gadgetOptions found in form definition for ${documentType}`);
        return [];
        }
        
        const gadgetOptions = formGadget.config.gadgetOptions;
        
        // Extract field definitions from gadgetOptions
        const fields: FieldDefinition[] = [];
        
        gadgetOptions.forEach((option: any) => {
        // Skip sections and groups
        if (option.type === 'section' || option.type === 'group') {
            return;
        }
        
        // This is a field
        const label = option.label || option.title || option.id;
        const field: FieldDefinition = {
            dbField: option.id, // Field ID is the database field name
            label,
            required: option.required || false,
            dataType: getDataTypeFromFieldType(option.type),
            aliases: generateAliasesFromLabel(label, option.id) // Auto-generate from label
        };
        
        fields.push(field);
        });
        
        console.log(`Discovered ${fields.length} form fields for ${documentType}:`, fields);
        
        return fields;
        
    } catch (error) {
        console.error(`Error discovering form fields for ${documentType}:`, error);
        return [];
    }
}

/**
 * NEW: Discover fields from ALL hierarchy levels for asset import
 * Asset import supports auto-creation of Company, Site, and Asset Group
 * So we need to load fields from all 4 forms!
 * 
 * @param formPaths - Array of form paths to load { formPath, type, prefix }
 * @returns Array of field definitions from all related hierarchy forms
 */
export async function discoverAllHierarchyFields(
    formPaths: Array<{ formPath: string; type: string; prefix: string }>
): Promise<FieldDefinition[]> {
    try {
        console.log(`Discovering ALL hierarchy fields from ${formPaths.length} forms...`);
        
        const allFields: FieldDefinition[] = [];
        
        // Load fields from each hierarchy level
        for (const level of formPaths) {
        const fields = await discoverFormFields(level.formPath, level.type);
        
        // Add prefix to BOTH dbField and label to make them unique across hierarchy
        const prefixedFields = fields.map(field => ({
            ...field,
            dbField: `${level.type}_${field.dbField}`, // Make dbField unique: "company_name", "site_name", etc.
            label: `${level.prefix}: ${field.label}`,
            // Also add aliases with prefix for better AI matching
            aliases: [
            ...(field.aliases || []), // Fallback to empty array if undefined
            `${level.prefix} ${field.label}`,
            `${level.type}_${field.dbField}`,
            field.dbField // Keep original too for matching
            ]
        }));
        
        allFields.push(...prefixedFields);
        }
        
        console.log(`Discovered ${allFields.length} total fields from all hierarchy levels`);
        
        return allFields;
        
    } catch (error) {
        console.error('Error discovering all hierarchy fields:', error);
        return [];
    }
}


/**
 * Transform imported data to proper types based on field metadata
 * Handles: tags (string → array), dates (string → Date), numbers (string → number)
 */
export function transformImportedData(data: any, fieldDefinitions: FieldDefinition[]): any {
    const transformed = { ...data };
    
    fieldDefinitions.forEach(field => {
        const value = transformed[field.dbField];
        
        // Skip if value is null/undefined
        if (value === null || value === undefined) return;
        
        // Handle tags field: convert string to array
        if (field.dbField === 'tags' && typeof value === 'string' && value.trim()) {
        // Split by semicolon, comma, or newline
        transformed[field.dbField] = value
            .split(/[;,\n]+/)
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0);
        }
        
        // Handle array fields in general (detect by field type)
        else if (field.dataType === 'string' && typeof value === 'string' && value.includes(',')) {
        // If it looks like a comma-separated list, split it
        // But only for fields that are typically arrays (tags, keywords, etc.)
        const arrayFieldPatterns = ['tags', 'keywords', 'categories', 'labels'];
        if (arrayFieldPatterns.some(pattern => field.dbField.toLowerCase().includes(pattern))) {
            transformed[field.dbField] = value
            .split(/[,;]+/)
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
        }
        
        // Handle number fields
        else if (field.dataType === 'number' && typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            transformed[field.dbField] = num;
        }
        }
        
        // Handle date fields
        else if (field.dataType === 'date' && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            transformed[field.dbField] = date.toISOString();
        }
        }
        
        // Handle boolean fields
        else if (field.dataType === 'boolean' && typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        transformed[field.dbField] = lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1';
        }
    });
    
    return transformed;
}

/**
 * Set nested object value dynamically
 * Example: setNestedValue(obj, 'headquarters.address.city', 'Dallas')
 * Creates nested structure automatically
 */
function setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
        }
        current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
}
  
/**
 * Parse flat Excel row into nested object structure
 * Example: { 'headquarters_city': 'Dallas' } → { headquarters: { city: 'Dallas' } }
 */
export function unflattenObject(flat: Record<string, any>, separator: string = '_'): any {
    const result: any = {};
    
    for (const key in flat) {
        if (!flat.hasOwnProperty(key)) continue;
        
        const value = flat[key];
        if (value === undefined || value === null || value === '') continue;
        
        // Convert underscore notation back to dot notation
        const path = key.replace(new RegExp(separator, 'g'), '.');
        setNestedValue(result, path, value);
    }
    
    return result;
}
