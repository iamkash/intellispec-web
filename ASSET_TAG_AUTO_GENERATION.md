# Asset Tag Auto-Generation - Complete Guide

## ✅ NEW FEATURE: Asset_Tag Auto-Generation

You no longer need to provide Asset_Tag! The system automatically generates it for you.

## 🎯 How It Works

### Your Input (Excel)
```excel
| Facility | Unit_ID  | Equipment_ID     | Equipment_Type |
|----------|----------|------------------|----------------|
| NAVAJO   | 02 CRUDE | 02-TOWER RFX     | Pipe           |
| NAVAJO   | 02 CRUDE | 02-STRIPPER BTMS | Pipe           |
| NAVAJO   | 02 CRUDE | Control Valve-15 | Valve          |
```

### System Generates (Automatic)
```excel
| Asset_Tag        | Facility | Unit_ID  | Equipment_ID     | Equipment_Type |
|------------------|----------|----------|------------------|----------------|
| NAVAJO-02-P-0001 | NAVAJO   | 02 CRUDE | 02-TOWER RFX     | Pipe           |
| NAVAJO-02-P-0002 | NAVAJO   | 02 CRUDE | 02-STRIPPER BTMS | Pipe           |
| NAVAJO-02-V-0001 | NAVAJO   | 02 CRUDE | Control Valve-15 | Valve          |
```

## 🏷️ Asset Tag Format

### Pattern
```
[FACILITY]-[UNIT]-[TYPE]-[####]
```

### Components

| Component | Source | Example | Notes |
|-----------|--------|---------|-------|
| **FACILITY** | site_code | NAVAJO | Uppercase, from your Facility column |
| **UNIT** | asset_group_code (first part) | 02 | Extracts "02" from "02 CRUDE" |
| **TYPE** | asset_type (mapped) | P | See type mapping table below |
| **####** | Auto-incrementing number | 0001, 0002, ... | 4-digit sequence, starts at 0001 |

### Type Code Mapping

| Equipment Type | Code | Example Asset_Tag |
|----------------|------|-------------------|
| Pipe | P | NAVAJO-02-P-0001 |
| Valve | V | NAVAJO-02-V-0001 |
| Tank | T | NAVAJO-02-T-0001 |
| Pump | PUMP | NAVAJO-02-PUMP-0001 |
| Compressor | COMP | NAVAJO-02-COMP-0001 |
| Heat Exchanger | HX | NAVAJO-02-HX-0001 |
| Vessel | VSL | NAVAJO-02-VSL-0001 |
| Reactor | R | NAVAJO-02-R-0001 |
| *Other* | First letter | NAVAJO-02-X-0001 |

## 📊 Complete Example

### Your Excel (Simple)
```excel
| Facility | Unit_ID     | Equipment_ID       | Equipment_Type  | Description           |
|----------|-------------|--------------------|-----------------|-----------------------|
| NAVAJO   | 02 CRUDE    | 02-TOWER RFX       | Pipe            | Tower reflux line     |
| NAVAJO   | 02 CRUDE    | 02-STRIPPER BTMS   | Pipe            | Stripper bottoms line |
| NAVAJO   | 02 CRUDE    | Control Valve-15   | Valve           | Main control valve    |
| NAVAJO   | 03 VACUUM   | Vacuum Pump-01     | Pump            | Primary vacuum pump   |
| NAVAJO   | 03 VACUUM   | Feed Tank          | Tank            | Feed storage tank     |
```

### What Gets Created in Database
```javascript
// Row 1
{
  asset_tag: "NAVAJO-02-P-0001",  // ✅ AUTO-GENERATED!
  name: "02-TOWER RFX",
  asset_type: "Pipe",
  description: "Tower reflux line",
  site_id: "site_navajo_abc123",      // 🔍 Looked up from "NAVAJO"
  asset_group_id: "ag_02_crude_xyz",  // 🔍 Looked up from "02 CRUDE"
  // ... all other auto-generated fields
}

// Row 2
{
  asset_tag: "NAVAJO-02-P-0002",  // ✅ AUTO-GENERATED! (next number)
  name: "02-STRIPPER BTMS",
  asset_type: "Pipe",
  description: "Stripper bottoms line",
  site_id: "site_navajo_abc123",
  asset_group_id: "ag_02_crude_xyz",
  // ... all other auto-generated fields
}

// Row 3
{
  asset_tag: "NAVAJO-02-V-0001",  // ✅ AUTO-GENERATED! (V for Valve)
  name: "Control Valve-15",
  asset_type: "Valve",
  description: "Main control valve",
  site_id: "site_navajo_abc123",
  asset_group_id: "ag_02_crude_xyz",
  // ... all other auto-generated fields
}

// Row 4
{
  asset_tag: "NAVAJO-03-PUMP-0001",  // ✅ AUTO-GENERATED! (Different unit: 03)
  name: "Vacuum Pump-01",
  asset_type: "Pump",
  description: "Primary vacuum pump",
  site_id: "site_navajo_abc123",
  asset_group_id: "ag_03_vacuum_def",  // Different unit
  // ... all other auto-generated fields
}

// Row 5
{
  asset_tag: "NAVAJO-03-T-0001",  // ✅ AUTO-GENERATED! (T for Tank)
  name: "Feed Tank",
  asset_type: "Tank",
  description: "Feed storage tank",
  site_id: "site_navajo_abc123",
  asset_group_id: "ag_03_vacuum_def",
  // ... all other auto-generated fields
}
```

## 🔢 Auto-Increment Logic

### How Sequence Numbers Work

```
Scenario 1: First Import (Empty Database)
───────────────────────────────────────────
Import: Facility=NAVAJO, Unit=02, Type=Pipe
System: No existing "NAVAJO-02-P-*" tags found
Result: NAVAJO-02-P-0001  (starts at 0001)

Import: Facility=NAVAJO, Unit=02, Type=Pipe
System: Found "NAVAJO-02-P-0001"
Result: NAVAJO-02-P-0002  (increments to 0002)

Import: Facility=NAVAJO, Unit=02, Type=Valve
System: No existing "NAVAJO-02-V-*" tags found
Result: NAVAJO-02-V-0001  (different type, starts at 0001)


Scenario 2: Importing to Existing Database
───────────────────────────────────────────
Existing: NAVAJO-02-P-0001, NAVAJO-02-P-0002, NAVAJO-02-P-0005

Import: Facility=NAVAJO, Unit=02, Type=Pipe
System: Found highest "NAVAJO-02-P-0005"
Result: NAVAJO-02-P-0006  (increments from highest, skips gaps)


Scenario 3: Multiple Facilities/Units
───────────────────────────────────────
Each combination gets its own sequence:
- NAVAJO-02-P-#### (NAVAJO facility, Unit 02, Pipes)
- NAVAJO-03-P-#### (NAVAJO facility, Unit 03, Pipes)
- TULSA-01-P-####  (TULSA facility, Unit 01, Pipes)
```

## 📋 Simplified Excel Template

### Minimum Required Columns

| Facility | Unit_ID | Equipment_ID | Equipment_Type | Description |
|----------|---------|--------------|----------------|-------------|
| NAVAJO   | 02 CRUDE | 02-TOWER RFX | Pipe | Tower reflux line |

**That's it!** System auto-generates:
- ✅ Asset_Tag: `NAVAJO-02-P-0001`
- ✅ All IDs: document ID, tenant ID, etc.
- 🔍 Lookups: site_id, asset_group_id
- 📝 Metadata: created_date, created_by, etc.

## 🎯 What YOU Provide vs What SYSTEM Generates

### YOU Provide (3-5 columns)

| Column | Required | Example |
|--------|----------|---------|
| **Facility** | ✅ Yes | NAVAJO |
| **Unit_ID** | ✅ Yes | 02 CRUDE |
| **Equipment_ID** | ✅ Yes | 02-TOWER RFX |
| **Equipment_Type** | ✅ Yes | Pipe |
| **Description** | ❌ No | Tower reflux line |
| Manufacturer | ❌ No | Cameron |
| Model | ❌ No | API-610 |
| Status | ❌ No | active |

### SYSTEM Generates (15+ fields)

```javascript
{
  // ✅ Auto-Generated Asset Tag (NEW!)
  asset_tag: "NAVAJO-02-P-0001",
  
  // ✅ Auto-Generated IDs
  id: "doc_1759580606978_jaz27f9c1",
  _id: "doc_1759580606978_0w97hvkk3",
  
  // ✅ Auto-Generated Metadata
  type: "asset",
  tenantId: "t_hf_sinclair",
  created_date: "2025-10-04T12:23:26.978Z",
  last_updated: "2025-10-04T12:23:26.978Z",
  created_by: "admin@hfsinclair.com",
  updated_by: "admin@hfsinclair.com",
  deleted: false,
  
  // 🔍 Auto-Looked Up
  site_id: "site_navajo_abc123",
  asset_group_id: "ag_02_crude_xyz789",
  
  // ❌ From Your Excel
  name: "02-TOWER RFX",
  asset_type: "Pipe",
  description: "Tower reflux line",
  
  // 📋 Defaults
  status: "active",
  tags: ["navajo", "02-crude", "pipe"]
}
```

## 🔄 Import Process

### Step-by-Step

```
1. You Upload Excel
   ┌──────────────────────────────────────┐
   │ Facility │ Unit_ID │ Equipment_ID    │
   │ NAVAJO   │ 02 CRUDE│ 02-TOWER RFX    │
   └──────────────────────────────────────┘

2. System Maps Columns
   ✅ Facility → site_code
   ✅ Unit_ID → asset_group_code
   ✅ Equipment_ID → name
   ✅ Equipment_Type → asset_type

3. System Processes Each Row
   🔍 Lookup: "NAVAJO" → site_id = "site_navajo_abc123"
   🔍 Lookup: "02 CRUDE" → asset_group_id = "ag_02_crude_xyz789"
   🏷️ Generate: Asset_Tag = "NAVAJO-02-P-0001"
   
4. System Creates Asset
   ✅ Document ID: "doc_1759580606978_jaz27f9c1"
   ✅ Asset Tag: "NAVAJO-02-P-0001"
   ✅ Timestamps: created_date, last_updated
   ✅ User: created_by = "admin@hfsinclair.com"

5. System Reports Result
   ✅ 1 asset created: NAVAJO-02-P-0001
```

## ⚙️ Override Option

**Don't want auto-generation?** You can still provide Asset_Tag manually:

```excel
| Asset_Tag        | Facility | Unit_ID  | Equipment_ID | Equipment_Type |
|------------------|----------|----------|--------------|----------------|
| MY-CUSTOM-TAG-01 | NAVAJO   | 02 CRUDE | 02-TOWER RFX | Pipe           |
```

System will use your provided Asset_Tag instead of generating one.

## 🎉 Benefits

### Before (Manual)
```
❌ You had to create Asset_Tags manually
❌ Risk of duplicates
❌ Risk of inconsistent naming
❌ More columns to manage
❌ More data entry work
```

### After (Auto-Generated)
```
✅ System creates Asset_Tags automatically
✅ Guaranteed unique (no duplicates)
✅ Consistent naming convention
✅ Fewer columns needed
✅ Less data entry work
✅ Automatic sequencing
```

## 📝 Summary

**What gets AUTO-GENERATED:**

1. ✅ **Asset_Tag** - `NAVAJO-02-P-0001` (NEW!)
2. ✅ **Document IDs** - `doc_1759580606978_jaz27f9c1`
3. ✅ **Metadata** - timestamps, user info, tenant
4. 🔍 **Lookups** - site_id, asset_group_id from codes
5. 📋 **Defaults** - status, tags, etc.

**What YOU provide:**

1. ❌ **Facility** - `NAVAJO`
2. ❌ **Unit_ID** - `02 CRUDE`
3. ❌ **Equipment_ID** - `02-TOWER RFX`
4. ❌ **Equipment_Type** - `Pipe`
5. ❌ **Description** - (optional)

**Result:** Complete asset with unique Asset_Tag and all relationships linked! 🎯

---

**Status**: ✅ Implemented & Ready to Use  
**Feature**: Auto-generates Asset_Tag from Facility + Unit + Type + Sequence  
**Format**: `[FACILITY]-[UNIT]-[TYPE]-[####]`

