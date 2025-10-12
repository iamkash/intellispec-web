# 🛡️ Workspace & Document Validation Guide

## Cursor IDE will automatically enforce these rules

### ⚡ Quick Commands

```bash
# Check field mappings
npm run check-field-mappings

# Validate all workspaces  
npm run validate-workspaces
```

## 🎯 Cursor IDE Automation

### When creating workspaces, Cursor will:

1. **Auto-suggest validated templates** from `.cursor/templates/`
2. **Auto-import validation** from `src/schemas/WorkspaceValidation.ts`
3. **Auto-check field mappings** against `src/models/DocumentSchemas.ts`
4. **Auto-include validation UI** in workspace renderers

### When creating documents, Cursor will:

1. **Auto-extend BaseDocument** interface
2. **Auto-add to DOCUMENT_FIELD_MAPPINGS** 
3. **Auto-generate Mongoose schemas** with proper validation
4. **Auto-create indexes** for performance

## 📋 Field Mapping Reference

### paintInvoice Documents
```json
"fieldMappings": {
  "company_id": "companyId",     // ✅ Correct
  "site_id": "facilityId",      // ✅ Correct  
  "date_range": "purchaseDate"  // ✅ Correct
}
```

### company Documents  
```json
"fieldMappings": {
  "industry": "industry",       // ✅ Correct
  "name": "name"               // ✅ Correct
}
```

### site Documents
```json
"fieldMappings": {
  "company_id": "company_id",   // ✅ Correct (underscore!)
  "name": "name"               // ✅ Correct
}
```

### paint_specifications Documents
```json
"fieldMappings": {
  "manufacturer": "manufacturer", // ✅ Correct
  "voc_content": "vocContent"    // ✅ Correct
}
```

## 🚀 Cursor Templates Usage

### Create New Workspace
1. Type `@workspace` in Cursor
2. Select "Validated Workspace Template"
3. Fill in variables
4. Cursor auto-validates and adds validation UI

### Create New KPI Gadget  
1. Type `@kpi-gadget` in Cursor
2. Select "Validated KPI Gadget Template"
3. Choose document type
4. Cursor auto-applies correct field mappings

### Create New Document Schema
1. Type `@document-schema` in Cursor  
2. Select "Validated Document Schema Template"
3. Define fields
4. Cursor auto-generates Mongoose schema and adds to field mappings

## 🔧 Validation Rules (Auto-Enforced)

### ✅ Required in ALL Workspaces:
- `id` field (kebab-case)
- `title` field
- `filterContext.enabled: true`
- Standard filter definitions (company_id, site_id, date_range)
- Validation component in renderer

### ✅ Required in ALL KPI Gadgets:
- `aggregationConfig.baseFilter.type` 
- Correct `fieldMappings` for document type
- Valid `dataPath` (dot notation)
- Proper aggregation expressions

### ✅ Required in ALL Document Schemas:
- Extend `BaseDocument` interface
- Include in `DOCUMENT_FIELD_MAPPINGS`
- Proper Mongoose validation
- Standard audit fields
- Performance indexes

## 🎯 Auto-Corrections

Cursor will automatically fix:

- ❌ `"company_id": "company_id"` → ✅ `"company_id": "companyId"` (for paintInvoice)
- ❌ `/api/documents?type=company` → ✅ `/api/options/companies`
- ❌ Missing `refreshTrigger: true` → ✅ Added automatically
- ❌ Invalid dataPath → ✅ Corrected to dot notation
- ❌ Missing validation imports → ✅ Auto-imported

## 🚨 Error Prevention

### URL Validation Rules
- ✅ **Relative URLs**: `/api/options/companies`, `/api/data/aggregation`
- ✅ **Absolute URLs**: `https://api.example.com/options/companies`
- ❌ **Invalid**: `api/companies` (missing leading slash), `not-a-url`

### Filter Configuration Rules
- ✅ **Select/Multiselect with optionsUrl**: Must have both `labelField` and `valueField`
- ✅ **Common labelField values**: `"label"`, `"name"`, `"code"`, `"title"`
- ✅ **Common valueField values**: `"value"`, `"id"`, `"key"`
- ❌ **Missing fields**: Select filters with optionsUrl but no labelField/valueField

### Cursor will warn about:
- Invalid field mappings
- Missing document types in DOCUMENT_FIELD_MAPPINGS
- Incorrect API endpoints
- Missing validation components
- Invalid aggregation configurations
- Missing gadget descriptions (required for maintainability)
- Missing labelField/valueField in select/multiselect filters with optionsUrl
- Missing required workspace fields (title, description)
- Using "name" instead of "title" in workspace configuration

### Cursor will block:
- Saving workspaces without validation
- Creating documents without proper schemas
- Using hardcoded field mappings
- Missing required fields

## 💡 Best Practices (Auto-Applied)

1. **Always use templates** - Cursor suggests them automatically
2. **Validate early** - Cursor validates on every save
3. **Follow naming conventions** - Cursor enforces kebab-case for IDs
4. **Use standard endpoints** - Cursor suggests `/api/options/*`
5. **Include descriptions** - Cursor prompts for missing descriptions

## 🔍 Debugging

### If validation fails:
1. Check console for detailed error messages
2. Look for validation alert in workspace UI
3. Run `npm run check-field-mappings` to see available fields
4. Cursor will highlight specific issues and suggest fixes

### Common fixes Cursor applies:
- Field mapping corrections
- Missing validation imports  
- Incorrect document type references
- Invalid filter configurations

---

**🎉 With these Cursor IDE rules, validation is automatic and enforced on every workspace and document creation!**
