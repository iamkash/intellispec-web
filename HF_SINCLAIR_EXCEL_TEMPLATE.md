# HF Sinclair Excel Import Template

## 📋 Your Current Data Format

Based on your columns:
```
Asset_Tag | Unit_ID | Equipment_ID | Circuit_ID | Event Type | Actual Due Date | Equipment_Type | Equipment_Description
```

## ✅ Recommended Import Template

### Option 1: Asset Import Only (Ignore Inspection Data)

Use these columns for importing assets:

| Asset_Tag | Unit_ID | Equipment_ID | Equipment_Type | Circuit_ID | Equipment_Description | Facility | Manufacturer | Status |
|-----------|---------|--------------|----------------|------------|-----------------------|----------|--------------|--------|
| NAVAJO-02-P-0002 | 02 CRUDE | 02-STRIPPER BTMS | Pipe | CS-001 | 02-STRIPPER BTMS | NAVAJO | Cameron | active |
| NAVAJO-02-P-0003 | 02 CRUDE | 02-TOWER RFX | Pipe | CS-002 | 02-TOWER RFX | NAVAJO | | active |

**Column Mappings in Import UI:**
- `Asset_Tag` → **Asset Tag / Equipment ID (Unique)**
- `Unit_ID` → **Unit Code (🔍 lookups asset_group_id)**
- `Equipment_ID` → **Asset Name / Equipment Description**
- `Equipment_Type` → **Equipment Type (Pipe, Valve, Tank, etc.)**
- `Circuit_ID` → **Description / Notes** (or create custom field)
- `Equipment_Description` → **Description / Notes** (append to description)
- `Facility` → **Facility/Site Code (🔍 lookups site_id)**
- `Manufacturer` → **Manufacturer (text value)**
- `Status` → **Status (active, inactive, maintenance)**

**Skip these columns** (not asset fields):
- ❌ `Event Type` - This is inspection data, not asset data
- ❌ `Actual Due Date` - This is inspection schedule, not asset data

### Option 2: Enhanced with Facility Column

If your data has facility information:

| Asset_Tag | Facility | Unit_ID | Equipment_ID | Equipment_Type | Circuit_ID | Equipment_Description | Manufacturer | Model | Status |
|-----------|----------|---------|--------------|----------------|------------|-----------------------|--------------|-------|--------|
| NAVAJO-02-P-0002 | NAVAJO | 02 CRUDE | 02-STRIPPER BTMS | Pipe | CS-001 | 02-STRIPPER BTMS | Cameron | API-610 | active |

## 🎯 How to Prepare Your Excel File

### Step 1: Start with Your Current Data

```
Asset_Tag            | Unit_ID  | Equipment_ID      | Circuit_ID | Event Type          | Actual Due Date | Equipment_Type | Equipment_Description
NAVAJO-02-P-0002     | 02 CRUDE | 02-STRIPPER BTMS  | CS-001     | External Inspection | 3/24/2026       | Pipe           | 02-STRIPPER BTMS
```

### Step 2: Add Required Columns for Asset Import

Add these columns to your Excel:

**Required:**
- `Facility` (e.g., "NAVAJO") - So system can lookup site_id
- Keep: `Asset_Tag`, `Unit_ID`, `Equipment_ID`, `Equipment_Type`

**Optional but Recommended:**
- `Manufacturer`
- `Model`
- `Status` (active, inactive, maintenance)

**Result:**

```
Asset_Tag | Facility | Unit_ID | Equipment_ID | Equipment_Type | Circuit_ID | Equipment_Description | Manufacturer | Model | Status
NAVAJO-02-P-0002 | NAVAJO | 02 CRUDE | 02-STRIPPER BTMS | Pipe | CS-001 | 02-STRIPPER BTMS | Cameron | API-610 | active
```

### Step 3: Remove or Ignore Inspection Columns

These columns are for inspection tracking, NOT asset creation:
- ❌ Remove: `Event Type`
- ❌ Remove: `Actual Due Date`

**Note:** If you want to track inspections, you'll need a separate "Inspection" import later.

## 📝 Final Excel Template

Download this template and fill in your data:

```excel
┌──────────────────┬──────────┬──────────┬──────────────────┬────────────────┬────────────┬───────────────────────┬──────────────┬─────────┬────────┐
│ Asset_Tag        │ Facility │ Unit_ID  │ Equipment_ID     │ Equipment_Type │ Circuit_ID │ Equipment_Description │ Manufacturer │ Model   │ Status │
├──────────────────┼──────────┼──────────┼──────────────────┼────────────────┼────────────┼───────────────────────┼──────────────┼─────────┼────────┤
│ NAVAJO-02-P-0002 │ NAVAJO   │ 02 CRUDE │ 02-STRIPPER BTMS │ Pipe           │ CS-001     │ 02-STRIPPER BTMS      │ Cameron      │ API-610 │ active │
│ NAVAJO-02-P-0003 │ NAVAJO   │ 02 CRUDE │ 02-TOWER RFX     │ Pipe           │ CS-002     │ 02-TOWER RFX          │              │         │ active │
│ NAVAJO-02-V-0015 │ NAVAJO   │ 02 CRUDE │ Control Valve-15 │ Valve          │            │ Main control valve    │ Fisher       │ EWT-100 │ active │
└──────────────────┴──────────┴──────────┴──────────────────┴────────────────┴────────────┴───────────────────────┴──────────────┴─────────┴────────┘
```

## 🔧 Import Workflow

### 1. Upload Excel File
- System reads your file
- Shows preview of first 5 rows

### 2. Map Columns

The system will show all your Excel columns. Map them like this:

| Your Excel Column | → | Map to System Field |
|-------------------|---|---------------------|
| Asset_Tag | → | Asset Tag / Equipment ID (Unique) ✅ REQUIRED |
| Facility | → | Facility/Site Code (🔍 lookups site_id) |
| Unit_ID | → | Unit Code (🔍 lookups asset_group_id) |
| Equipment_ID | → | Asset Name / Equipment Description ✅ REQUIRED |
| Equipment_Type | → | Equipment Type (Pipe, Valve, Tank, etc.) ✅ REQUIRED |
| Circuit_ID | → | Description / Notes |
| Equipment_Description | → | Description / Notes |
| Manufacturer | → | Manufacturer (text value) |
| Model | → | Model (text value) |
| Status | → | Status (active, inactive, maintenance) |

**Skip (don't map):**
- Event Type
- Actual Due Date

### 3. Preview & Validate

System will:
- ✅ Check for duplicate Asset_Tags
- 🔍 Lookup "NAVAJO" → finds site_id
- 🔍 Lookup "02 CRUDE" → finds asset_group_id
- ✅ Validate all required fields filled
- ⚠️ Show any errors

### 4. Import

System will:
- Create/update assets
- Show progress bar
- Display summary (Created: 45, Updated: 3, Failed: 2)

## 🎯 What Gets Auto-Generated

For each row, the system automatically creates:

```javascript
{
  // ✅ SYSTEM-GENERATED (You don't provide)
  id: "doc_1759580606978_jaz27f9c1",           // Unique document ID
  _id: "doc_1759580606978_0w97hvkk3",          // MongoDB internal ID
  type: "asset",                                // Document type
  tenantId: "t_hf_sinclair",                   // Your tenant
  created_date: "2025-10-04T12:23:26.978Z",    // Creation timestamp
  last_updated: "2025-10-04T12:23:26.978Z",    // Update timestamp
  created_by: "admin@hfsinclair.com",          // Your username
  updated_by: "admin@hfsinclair.com",          // Your username
  deleted: false,                              // Active status
  
  // ✅ FROM YOUR EXCEL
  asset_tag: "NAVAJO-02-P-0002",               // Asset_Tag column
  name: "02-STRIPPER BTMS",                    // Equipment_ID column
  asset_type: "Pipe",                          // Equipment_Type column
  description: "02-STRIPPER BTMS - CS-001",    // Equipment_Description + Circuit_ID
  manufacturer: "Cameron",                      // Manufacturer column (if provided)
  model: "API-610",                            // Model column (if provided)
  status: "active",                            // Status column (if provided)
  
  // 🔍 AUTO-LOOKED UP
  site_id: "site_navajo_abc123",               // From Facility: "NAVAJO"
  asset_group_id: "ag_02_crude_xyz789",        // From Unit_ID: "02 CRUDE"
  
  // 📊 ADDITIONAL FIELDS (Optional)
  circuit_id: "CS-001",                        // From Circuit_ID column
  tags: ["navajo", "02-crude", "pipe"],        // Auto-generated from context
  specifications: {},                          // Empty object (can add later)
  maintenance: {}                              // Empty object (can add later)
}
```

## 🔤 Naming Convention Rules

### Asset_Tag Format
Your current format: `NAVAJO-02-P-0002`

**Breakdown:**
- `NAVAJO` - Facility code
- `02` - Unit number
- `P` - Equipment type code (P=Pipe, V=Valve, T=Tank, etc.)
- `0002` - Sequential number

**System Requirements:**
- ✅ Must be unique across all assets
- ✅ Can use any format you want
- ✅ Alphanumeric with hyphens/underscores allowed
- ✅ Case-sensitive

**Recommended Format:**
```
[FACILITY]-[UNIT]-[TYPE]-[NUMBER]
```

Examples:
- `NAVAJO-02-P-0002` (Pipe)
- `NAVAJO-02-V-0015` (Valve)
- `NAVAJO-02-T-0001` (Tank)
- `NAVAJO-03-PUMP-0125` (Pump)

## 🚨 Common Issues & Solutions

### Issue 1: Duplicate Asset_Tag
**Error:** "Asset tag 'NAVAJO-02-P-0002' already exists"

**Solution:**
- Each Asset_Tag must be unique
- Use update mode if you want to update existing asset
- Or change Asset_Tag to unique value

### Issue 2: Unit Not Found
**Error:** "Asset group with code '02 CRUDE' not found"

**Solution:**
```sql
-- First create the unit (asset group):
POST /api/documents
{
  "type": "asset_group",
  "name": "02 CRUDE Unit",
  "code": "02 CRUDE",
  "site_id": "site_navajo_12345",
  "group_type": "process_unit"
}
```

### Issue 3: Facility Not Found
**Error:** "Site with code 'NAVAJO' not found"

**Solution:**
```sql
-- First create the facility (site):
POST /api/documents
{
  "type": "site",
  "name": "NAVAJO Refinery",
  "code": "NAVAJO",
  "company_id": "comp_hf_sinclair",
  "site_type": "refinery"
}
```

## 📊 Data Hierarchy Setup

**Before importing assets, ensure this hierarchy exists:**

```
1. Company
   └─ HF Sinclair (code: "HF_SINCLAIR")
      
2. Site/Facility
   └─ NAVAJO Refinery (code: "NAVAJO")
      
3. Asset Groups/Units
   └─ 02 CRUDE Unit (code: "02 CRUDE")
   └─ 03 VACUUM Unit (code: "03 VACUUM")
   └─ etc.

4. Assets (your import)
   └─ NAVAJO-02-P-0002
   └─ NAVAJO-02-P-0003
   └─ etc.
```

## 📋 Pre-Import Checklist

Before importing your asset data:

- [ ] Company "HF Sinclair" exists
- [ ] Site "NAVAJO" exists with code="NAVAJO"
- [ ] Asset Group "02 CRUDE" exists with code="02 CRUDE"
- [ ] All Asset_Tags are unique
- [ ] Facility column added to Excel
- [ ] Event Type and Due Date columns removed/ignored
- [ ] Required columns filled: Asset_Tag, Equipment_ID, Equipment_Type
- [ ] Codes match exactly (case-sensitive)

## 🎯 Quick Start

1. **Add Facility column** to your Excel:
   ```
   Asset_Tag, Facility, Unit_ID, Equipment_ID, Equipment_Type, ...
   ```

2. **Fill in Facility** for all rows:
   ```
   NAVAJO-02-P-0002, NAVAJO, 02 CRUDE, 02-STRIPPER BTMS, Pipe, ...
   ```

3. **Upload to system** and map columns

4. **Preview & validate**

5. **Import** - Done! ✅

---

**Template Ready**: Your assets will be automatically created with proper IDs and relationships!

