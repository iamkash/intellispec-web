# HF Sinclair Asset Import Guide

## ✅ Automatic ID Generation - How It Works

### What Gets Created Automatically

When you import your asset data, the system **automatically generates** these IDs:

```javascript
{
  // ✅ AUTO-GENERATED - You don't provide these
  id: "doc_1759580606978_jaz27f9c1",        // MongoDB document ID
  _id: "doc_1759580606978_0w97hvkk3",       // MongoDB internal ID
  tenantId: "t_hf_sinclair",                 // From your login
  created_date: "2025-10-04T12:23:26.978Z",  // Timestamp
  last_updated: "2025-10-04T12:23:26.978Z",  // Timestamp
  created_by: "admin@hfsinclair.com",        // Your username
  updated_by: "admin@hfsinclair.com",        // Your username
  deleted: false,                            // Default status
  
  // ❌ YOU MUST PROVIDE - From your Excel
  asset_tag: "NAVAJO-02-P-0002",             // Your equipment ID
  name: "02-STRIPPER BTMS",                  // Equipment description
  asset_type: "Pipe",                        // Equipment type
  asset_group_id: "ag_12345"                 // Linked to Unit (auto-lookup available!)
}
```

## 🎯 Your Data Format → System Format

### Your Excel Columns

| Your Column | Example Value | Maps To | Notes |
|-------------|---------------|---------|-------|
| Asset_Tag | NAVAJO-02-P-0002 | `asset_tag` | ✅ Unique identifier |
| Unit_ID | 02 CRUDE | `asset_group_code` | 🔍 System will lookup asset_group_id |
| Equipment_ID | 02-STRIPPER BTMS | `asset_tag` or `description` | Your choice |
| Equipment_Type | Pipe | `asset_type` | ✅ Direct mapping |
| Equipment_Description | 02-TOWER RFX | `name` | ✅ Asset name |

### Smart Lookup Feature (NEW!)

The system now supports **code-based lookups**:

#### ✅ Option 1: Use Business Codes (Recommended)
```excel
| Asset_Tag        | Equipment_Description | Equipment_Type | Facility | Unit_ID  |
|------------------|-----------------------|----------------|----------|----------|
| NAVAJO-02-P-0002 | 02-STRIPPER BTMS      | Pipe           | NAVAJO   | 02 CRUDE |
```

**Column Mappings:**
- `Asset_Tag` → `asset_tag`
- `Equipment_Description` → `name`
- `Equipment_Type` → `asset_type`
- `Facility` → `site_code` (system looks up site_id)
- `Unit_ID` → `asset_group_code` (system looks up asset_group_id)

#### ✅ Option 2: Use Direct Database IDs
```excel
| Asset_Tag        | Equipment_Description | Equipment_Type | Site ID      | Asset Group ID |
|------------------|-----------------------|----------------|--------------|----------------|
| NAVAJO-02-P-0002 | 02-STRIPPER BTMS      | Pipe           | site_navajo  | ag_02_crude    |
```

**Column Mappings:**
- `Asset_Tag` → `asset_tag`
- `Equipment_Description` → `name`
- `Equipment_Type` → `asset_type`
- `Site ID` → `site_id`
- `Asset Group ID` → `asset_group_id`

## 📋 Step-by-Step Import Process

### Step 1: Prepare Your Hierarchy

Before importing assets, you need:

1. **Companies** (e.g., "HF Sinclair")
   - Probably already exist in system

2. **Sites/Facilities** (e.g., "NAVAJO", "02 CRUDE")
   - Must have a `code` field (e.g., "NAVAJO")
   - Example:
     ```json
     {
       "name": "NAVAJO Refinery",
       "code": "NAVAJO",
       "company_id": "comp_hf_sinclair"
     }
     ```

3. **Asset Groups/Units** (e.g., "02 CRUDE", "02-TOWER RFX")
   - Must have a `code` field (e.g., "02 CRUDE")
   - Example:
     ```json
     {
       "name": "02 CRUDE Unit",
       "code": "02 CRUDE",
       "site_id": "site_navajo",
       "group_type": "process_unit"
     }
     ```

### Step 2: Prepare Your Excel File

**Recommended Format** (using business codes):

| Asset_Tag        | Name              | Equipment_Type | Site_Code | Unit_Code | Manufacturer | Model  | Description        | Status |
|------------------|-------------------|----------------|-----------|-----------|--------------|--------|--------------------|--------|
| NAVAJO-02-P-0002 | 02-STRIPPER BTMS  | Pipe           | NAVAJO    | 02 CRUDE  | Cameron      | API-610| Process piping     | active |
| NAVAJO-02-V-0015 | Control Valve V15 | Valve          | NAVAJO    | 02 CRUDE  | Fisher       | EWT-100| Main control valve | active |

**Column Requirements:**
- ✅ **Asset_Tag** - REQUIRED (unique identifier like "NAVAJO-02-P-0002")
- ✅ **Name** - REQUIRED (equipment description)
- ✅ **Equipment_Type** - REQUIRED (like "Pipe", "Valve", "Tank")
- 🔍 **Site_Code** - OPTIONAL (facility code like "NAVAJO" - system looks up ID)
- 🔍 **Unit_Code** - OPTIONAL (unit code like "02 CRUDE" - system looks up ID)
- ℹ️ All other columns - OPTIONAL

### Step 3: Upload & Map Columns

1. **Upload Excel file**
   - System reads and analyzes your file
   - Shows preview of first 5 rows

2. **Map Columns** (Auto-mapping will detect most):

   | Excel Column | → | Map to Field |
   |--------------|---|--------------|
   | Asset_Tag | → | Asset Tag / Equipment ID |
   | Name | → | Asset Name / Equipment Description |
   | Equipment_Type | → | Equipment Type |
   | Site_Code | → | Facility/Site Code (will lookup ID) |
   | Unit_Code | → | Unit ID / Asset Group Code (will lookup ID) |
   | Manufacturer | → | Manufacturer |
   | Model | → | Model |
   | Description | → | Description / Notes |

3. **Preview & Validate**
   - System validates data
   - Shows any errors (missing required fields, etc.)
   - **Smart Lookup Happens Here**:
     - Converts "NAVAJO" → `site_id: "site_navajo_12345"`
     - Converts "02 CRUDE" → `asset_group_id: "ag_02_crude_67890"`

4. **Import**
   - System processes each row
   - Creates new assets or updates existing (based on Asset_Tag)
   - Shows progress bar
   - Reports success/failure counts

## 🔍 How Smart Lookup Works

### Behind the Scenes

When you provide `site_code: "NAVAJO"`:

```javascript
// System automatically does this:
1. Query: "Find site where code = 'NAVAJO'"
2. Result: { id: "site_navajo_12345", name: "NAVAJO Refinery", code: "NAVAJO" }
3. Replace: site_code: "NAVAJO" → site_id: "site_navajo_12345"
4. Import: Asset now has correct site_id reference
```

When you provide `asset_group_code: "02 CRUDE"`:

```javascript
// System automatically does this:
1. Query: "Find asset_group where code = '02 CRUDE'"
2. Result: { id: "ag_02_crude_67890", name: "02 CRUDE Unit", code: "02 CRUDE" }
3. Replace: asset_group_code: "02 CRUDE" → asset_group_id: "ag_02_crude_67890"
4. Import: Asset now has correct asset_group_id reference
```

### Fallback Behavior

If lookup fails:
- ⚠️ **Warning logged** (not error)
- ❌ **Import fails** for that row if field was required
- ✅ **Shows in error report** with specific message

**Example Error:**
```
Row 5: Failed to create - Asset group with code '02 CRUDE' not found.
Please create the asset group first or use the database ID directly.
```

## 🎯 Real Example: Your Data

### Your Source Data
```
Company: HF Sinclair
Facility: NAVAJO
Unit_ID: 02 CRUDE
Equipment_ID: 02-STRIPPER BTMS  
Asset_Tag: NAVAJO-02-P-0002
Equipment_Type: Pipe
Equipment_Description: 02-TOWER RFX
```

### Excel Format (Recommended)
```excel
| Asset_Tag        | Name          | Equipment_Type | Site_Code | Unit_Code | Description    |
|------------------|---------------|----------------|-----------|-----------|----------------|
| NAVAJO-02-P-0002 | 02-TOWER RFX  | Pipe           | NAVAJO    | 02 CRUDE  | 02-STRIPPER BTMS |
```

### What Gets Created in Database
```javascript
{
  // ✅ AUTO-GENERATED
  id: "doc_1759580606978_jaz27f9c1",
  _id: "doc_1759580606978_0w97hvkk3", 
  type: "asset",
  tenantId: "t_hf_sinclair",
  created_date: "2025-10-04T12:23:26.978Z",
  created_by: "admin@hfsinclair.com",
  deleted: false,
  
  // ✅ FROM YOUR EXCEL
  asset_tag: "NAVAJO-02-P-0002",           // ← Your Asset_Tag column
  name: "02-TOWER RFX",                     // ← Your Name column
  asset_type: "Pipe",                       // ← Your Equipment_Type column
  description: "02-STRIPPER BTMS",          // ← Your Description column
  
  // 🔍 AUTO-LOOKED UP
  site_id: "site_navajo_abc123",            // ← Looked up from "NAVAJO"
  asset_group_id: "ag_02_crude_xyz789",     // ← Looked up from "02 CRUDE"
  
  // ℹ️ OPTIONAL (if provided)
  manufacturer: "",
  model: "",
  status: "active"
}
```

## 📊 Validation Rules

### Required Fields
1. **asset_tag** - Must be unique (like "NAVAJO-02-P-0002")
2. **name** - Must not be empty
3. **asset_type** - Must not be empty
4. **Reference to parent** - Either:
   - `site_code` (will lookup site_id) OR `site_id` (direct)
   - `asset_group_code` (will lookup asset_group_id) OR `asset_group_id` (direct)

### Validation Checks
- ✅ Unique asset_tag (no duplicates unless updating)
- ✅ Valid site_code/site_id (site must exist)
- ✅ Valid asset_group_code/asset_group_id (group must exist)
- ✅ Equipment_Type not empty
- ✅ No special characters that break database

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Asset tag already exists" | Duplicate Asset_Tag | Use update mode or change to unique value |
| "Site with code 'NAVAJO' not found" | Site doesn't exist yet | Create site first or use site_id directly |
| "Asset group with code '02 CRUDE' not found" | Unit doesn't exist yet | Create asset group first or use asset_group_id |
| "Required field is empty" | Missing Asset_Tag, Name, or Type | Fill in required fields |

## 🚀 Import Scenarios

### Scenario 1: First Time Import (Codes)
```excel
| Asset_Tag        | Name          | Equipment_Type | Site_Code | Unit_Code |
|------------------|---------------|----------------|-----------|-----------|
| NAVAJO-02-P-0001 | Main Feed Pump| Pump           | NAVAJO    | 02 CRUDE  |
| NAVAJO-02-P-0002 | Tower RFX     | Pipe           | NAVAJO    | 02 CRUDE  |
```
**Result**: Creates 2 new assets with auto-looked up IDs

### Scenario 2: Update Existing (by Asset_Tag)
```excel
| Asset_Tag        | Name                | Equipment_Type | Status      |
|------------------|---------------------|----------------|-------------|
| NAVAJO-02-P-0001 | Main Feed Pump (Updated) | Pump      | maintenance |
```
**Result**: Updates existing asset (matches on Asset_Tag), changes name and status

### Scenario 3: Mixed Create/Update
```excel
| Asset_Tag        | Name          | Equipment_Type | Site_Code | Unit_Code |
|------------------|---------------|----------------|-----------|-----------|
| NAVAJO-02-P-0001 | Updated Pump  | Pump           | NAVAJO    | 02 CRUDE  |
| NAVAJO-02-P-0099 | New Valve     | Valve          | NAVAJO    | 02 CRUDE  |
```
**Result**: Updates NAVAJO-02-P-0001, creates NAVAJO-02-P-0099

## 🛠️ Troubleshooting

### Issue: "Site not found"
**Check:**
1. Does site exist in database?
2. Does site have a `code` field?
3. Is code spelled exactly right? (case-sensitive)

**Solution:**
```sql
-- Option 1: Create site first
POST /api/documents
{
  "type": "site",
  "name": "NAVAJO Refinery",
  "code": "NAVAJO",  ← Must match your Excel
  "company_id": "comp_hf_sinclair"
}

-- Option 2: Use site_id directly instead of site_code
```

### Issue: "Asset group not found"
**Check:**
1. Does asset group exist?
2. Does it have a `code` field?
3. Is code spelled exactly right?

**Solution:**
```sql
-- Option 1: Create asset group first
POST /api/documents
{
  "type": "asset_group",
  "name": "02 CRUDE Unit",
  "code": "02 CRUDE",  ← Must match your Excel
  "site_id": "site_navajo_12345",
  "group_type": "process_unit"
}

-- Option 2: Use asset_group_id directly
```

## ✅ Best Practices

1. **Import in Order**
   - Companies first (or verify exist)
   - Then Sites/Facilities
   - Then Asset Groups/Units
   - Finally Assets

2. **Use Codes for Convenience**
   - More readable Excel files
   - Easier to maintain
   - System handles lookup automatically

3. **Test with Small Batch**
   - Import 5-10 records first
   - Verify results
   - Then import full dataset

4. **Keep Backup**
   - Always keep original Excel file
   - Export before making changes
   - Use version control (v1, v2, etc.)

5. **Validate Before Import**
   - Check for duplicate Asset_Tags
   - Verify all codes exist in system
   - Ensure required fields filled

## 📞 Support

If import fails or you need help:
1. Check validation errors in preview step
2. Review error summary after import
3. Check that sites and asset groups exist with correct codes
4. Verify Asset_Tags are unique
5. Contact system administrator with error details

---

**Last Updated**: October 4, 2025  
**Version**: 2.0 (with Smart Lookup)  
**Status**: ✅ Production Ready

