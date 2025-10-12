const { validateFieldMapping, DOCUMENT_FIELD_MAPPINGS } = require('./src/models/DocumentSchemas.ts');

console.log('🔍 Asset field mappings:');
console.log(JSON.stringify(DOCUMENT_FIELD_MAPPINGS.asset, null, 2));

console.log('\n🧪 Testing field mappings:');

// Test the field mappings from the dashboard
const testMappings = [
  { filterField: 'company_id', dbField: 'company_id' },
  { filterField: 'site_id', dbField: 'site_id' },
  { filterField: 'date_range', dbField: 'inspection.next_inspection_date' }
];

testMappings.forEach(({ filterField, dbField }) => {
  const result = validateFieldMapping('asset', filterField, dbField);
  console.log(`${filterField} -> ${dbField}: ${result.isValid ? '✅' : '❌'} ${result.suggestion || ''}`);
});

