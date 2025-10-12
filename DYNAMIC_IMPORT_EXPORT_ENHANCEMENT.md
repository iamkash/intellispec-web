# Dynamic Import/Export Enhancement Plan

## 🎯 Objective
Make import/export 100% dynamic so adding new form fields automatically enables import/export without code changes.

## 📋 Current Issues
1. ❌ Export logic has some hardcoded field paths (coating, maintenance, specifications)
2. ❌ Import logic doesn't auto-discover all form fields
3. ❌ No automatic detection of nested structures
4. ❌ Field definitions must be manually maintained in metadata

## ✅ Solution Architecture

### Phase 1: Dynamic Field Discovery
```typescript
/**
 * Fetch form metadata and extract ALL field definitions
 * Works for any document type (company, site, asset_group, asset)
 */
async function discoverFormFields(documentType: string): Promise<FieldDefinition[]> {
  // 1. Fetch form workspace definition (e.g., company-form.json)
  // 2. Parse gadgetOptions to extract all field IDs
  // 3. Detect nested fields by dot notation (e.g., headquarters.city)
  // 4. Determine data types from field type (text, number, date, etc.)
  // 5. Return complete field definition list
}
```

### Phase 2: Generic Nested Object Handler
```typescript
/**
 * Set/Get nested object values dynamically
 * Handles any depth: headquarters.address.city.zipcode
 */
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
```

### Phase 3: Dynamic Export Enhancement
```typescript
/**
 * Export with ZERO hardcoding
 * - Discovers all fields from form metadata
 * - Flattens nested objects automatically
 * - Handles arrays as CSV strings
 * - Works for any document type
 */
async function dynamicExport(documentType: string) {
  // 1. Discover all form fields
  const formFields = await discoverFormFields(documentType);
  
  // 2. Fetch all documents
  const documents = await fetchDocuments(documentType);
  
  // 3. For each document:
  //    - Flatten all nested objects using field definitions
  //    - Convert arrays to CSV strings
  //    - Include hierarchy data (auto-fetch related docs)
  
  // 4. Export to Excel with proper column names
}
```

### Phase 4: Dynamic Import Enhancement
```typescript
/**
 * Import with auto-field-detection
 * - Reads form metadata to understand structure
 * - Automatically creates nested objects
 * - Handles type conversions
 * - No hardcoded field names
 */
async function dynamicImport(file: File, documentType: string) {
  // 1. Discover all form fields from metadata
  const formFields = await discoverFormFields(documentType);
  
  // 2. Parse Excel and detect columns
  const columns = parseExcel(file);
  
  // 3. AI-map columns to form fields
  const mappings = await aiMapper.autoMap(columns, formFields);
  
  // 4. For each row:
  //    - Build nested object structure automatically
  //    - Apply type conversions based on field type
  //    - Validate against form rules
  
  // 5. Save to database
}
```

## 🔧 Implementation Steps

### Step 1: Add Form Metadata Discovery API
**File:** `api/routes/form-metadata.js`
```javascript
// GET /api/form-metadata/:documentType
// Returns: Complete field structure from form definition
fastify.get('/form-metadata/:documentType', async (request, reply) => {
  const { documentType } = request.params;
  
  // Load form definition (e.g., company-form.json)
  const formDef = loadFormDefinition(documentType);
  
  // Extract all fields from gadgetOptions
  const fields = extractFields(formDef.gadgets[0].config.gadgetOptions);
  
  return reply.send({ fields });
});
```

### Step 2: Update Data Import/Export Gadget
**File:** `src/components/library/gadgets/data-import-export-gadget.tsx`

**Changes:**
1. Add `discoverFormFields()` function
2. Replace hardcoded export logic with dynamic field discovery
3. Replace hardcoded import logic with dynamic nested object builder
4. Add `setNestedValue()` and `getNestedValue()` utilities
5. Remove all field-specific code

### Step 3: Update Field Definitions in Metadata
**Files:** 
- `asset-management.json`
- (No longer needed - auto-discovered!)

**Result:** Remove `fieldDefinitions` from import config - gadget discovers them automatically!

## 📊 Benefits

1. ✅ **Zero maintenance** - Add fields to forms, import/export works automatically
2. ✅ **Type safe** - Field types from form metadata ensure correct conversions
3. ✅ **Consistent** - Same field structure in forms, import, export, and database
4. ✅ **Scalable** - Works for any document type (current and future)
5. ✅ **DRY principle** - Single source of truth (form definitions)

## 🎯 Example Flow

### Before (Hardcoded):
```typescript
// ❌ Export: Hardcoded field extraction
if (doc.specifications?.coating_requirements) {
  exportRow.coating_primer_type = doc.specifications.coating_requirements.primer_type;
  exportRow.coating_topcoat_type = doc.specifications.coating_requirements.topcoat_type;
}
```

### After (Dynamic):
```typescript
// ✅ Export: Automatic field discovery
const formFields = await discoverFormFields('asset');
formFields.forEach(field => {
  const value = getNestedValue(doc, field.id);
  exportRow[field.label] = flattenValue(value);
});
```

## 🚀 Rollout Plan

1. ✅ Phase 1: Create form metadata discovery API (backend)
2. ✅ Phase 2: Add field discovery to gadget (frontend)
3. ✅ Phase 3: Replace export logic with dynamic version
4. ✅ Phase 4: Replace import logic with dynamic version
5. ✅ Phase 5: Test with all 4 document types
6. ✅ Phase 6: Remove legacy field definitions from metadata

## ✅ Testing Checklist

- [ ] Export company with all 40+ fields
- [ ] Export site with all 50+ fields
- [ ] Export asset_group with all 35+ fields
- [ ] Export asset with all 100+ fields
- [ ] Import company from Excel
- [ ] Import site from Excel
- [ ] Import asset_group from Excel
- [ ] Import asset from Excel
- [ ] Add new field to company form → verify export works
- [ ] Add new nested field to asset form → verify import works

## 🎓 Key Design Principles

1. **Single Source of Truth:** Form definitions define the data structure
2. **Convention over Configuration:** Use naming conventions (dot notation for nesting)
3. **Zero Hardcoding:** No document-type-specific code
4. **Metadata-Driven:** All logic derived from form metadata
5. **Type-Safe:** Use form field types for automatic conversions

---

**Status:** Ready for implementation  
**Estimated Effort:** 4-6 hours  
**Risk:** Low (non-breaking, additive changes)
