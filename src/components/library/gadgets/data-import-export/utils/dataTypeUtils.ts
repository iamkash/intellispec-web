/**
 * Convert field type from form metadata to data type
 */
export function getDataTypeFromFieldType(fieldType: string): 'string' | 'number' | 'date' | 'boolean' {
    const typeMap: Record<string, 'string' | 'number' | 'date' | 'boolean'> = {
        'text': 'string',
        'textarea': 'string',
        'email': 'string',
        'password': 'string',
        'number': 'number',
        'date': 'date',
        'time': 'date',
        'switch': 'boolean',
        'checkbox': 'boolean',
        'select': 'string',
        'radio': 'string',
        'tags': 'string', // Will be split into array
        'autocomplete': 'string',
        'cascader': 'string',
        'treeselect': 'string',
        'segmented': 'string',
        'slider': 'number',
        'rate': 'number',
        'color': 'string',
        'upload': 'string',
        'location': 'string',
        'signature': 'string',
        'drawing': 'string',
        'camera': 'string',
        'audio': 'string',
        'qrscanner': 'string'
    };
    
    return typeMap[fieldType] || 'string';
}
