# Lookup vs Reference Data - Explained

## 🤔 Your Question: "Why do some fields need lookup and others don't?"

Great question! The answer is: **Relationships need lookup, Classifications don't.**

## 🔗 Type 1: RELATIONSHIPS (Need Lookup)

These fields **link one document to another document** in your database.

### Examples of Relationship Fields

| Your Excel | What It Really Means | Database Needs |
|------------|---------------------|----------------|
| Site: "NAVAJO" | "This asset belongs to NAVAJO Refinery" | `site_id: "doc_175958..."` (ID of NAVAJO site document) |
| Unit: "02 CRUDE" | "This asset belongs to 02 CRUDE unit" | `asset_group_id: "doc_284736..."` (ID of 02 CRUDE group document) |
| Company: "HF Sinclair" | "This site belongs to HF Sinclair company" | `company_id: "comp_hf_sinclair"` (ID of HF Sinclair company document) |

### Why Lookup Is Needed

```
🗂️ DATABASE DOCUMENTS (Separate entities)

Company Document:
┌─────────────────────────────────┐
│ id: "comp_hf_sinclair"          │ ← This ID is what we need!
│ type: "company"                 │
│ name: "HF Sinclair"             │
│ code: "HF_SINCLAIR"             │
│ industry: "oil_gas"             │
└─────────────────────────────────┘
         ↑ Linked by company_id
         │
Site Document:
┌─────────────────────────────────┐
│ id: "site_navajo_abc123"        │ ← This ID is what we need!
│ type: "site"                    │
│ name: "NAVAJO Refinery"         │
│ code: "NAVAJO"                  │
│ company_id: "comp_hf_sinclair"  │ ← Points to company above
└─────────────────────────────────┘
         ↑ Linked by site_id
         │
Asset Group Document:
┌─────────────────────────────────┐
│ id: "ag_02_crude_xyz789"        │ ← This ID is what we need!
│ type: "asset_group"             │
│ name: "02 CRUDE Unit"           │
│ code: "02 CRUDE"                │
│ site_id: "site_navajo_abc123"   │ ← Points to site above
└─────────────────────────────────┘
         ↑ Linked by asset_group_id
         │
Asset Document:
┌─────────────────────────────────┐
│ id: "doc_175958..."             │
│ type: "asset"                   │
│ name: "02-TOWER RFX"            │
│ asset_tag: "NAVAJO-02-P-0002"   │
│ asset_group_id: "ag_02_crude_xyz789"  ← Points to group above
│ site_id: "site_navajo_abc123"   │      ← Points to site above
└─────────────────────────────────┘
```

**The Lookup Process:**
```javascript
// Your Excel says: "NAVAJO"
// 
// System does this:
1. Query: "Find site document where code = 'NAVAJO'"
2. Result: { id: "site_navajo_abc123", name: "NAVAJO Refinery", code: "NAVAJO" }
3. Extract: site_id = "site_navajo_abc123"
4. Store: asset.site_id = "site_navajo_abc123"
```

## 📋 Type 2: CLASSIFICATIONS (No Lookup)

These fields are just **text labels** or **category names** from dropdown lists.

### Examples of Classification Fields

| Your Excel | Database Stores | No Document Exists |
|------------|-----------------|-------------------|
| Equipment Type: "Pipe" | `asset_type: "Pipe"` | ❌ No "Pipe" document |
| Status: "active" | `status: "active"` | ❌ No "active" document |
| Industry: "oil_gas" | `industry: "oil_gas"` | ❌ No "oil_gas" document |
| Manufacturer: "Cameron" | `manufacturer: "Cameron"` | ❌ No "Cameron" document |
| Model: "API-610" | `model: "API-610"` | ❌ No "API-610" document |

### Why No Lookup Is Needed

```
🏷️ JUST TEXT VALUES (Not separate documents)

Asset Document:
┌─────────────────────────────────┐
│ asset_type: "Pipe"              │ ← Just stores "Pipe" as text
│ status: "active"                │ ← Just stores "active" as text
│ manufacturer: "Cameron"         │ ← Just stores "Cameron" as text
│ model: "API-610"                │ ← Just stores "API-610" as text
└─────────────────────────────────┘

NO separate documents for:
- "Pipe" ❌
- "active" ❌
- "Cameron" ❌
- "API-610" ❌

These are just dropdown options!
```

## 🎯 Real Example from Your Data

### Your Excel Row
```
Asset_Tag: NAVAJO-02-P-0002
Name: 02-TOWER RFX
Equipment_Type: Pipe              ← Classification (no lookup)
Facility: NAVAJO                  ← Relationship (needs lookup)
Unit_ID: 02 CRUDE                 ← Relationship (needs lookup)
Manufacturer: Cameron             ← Classification (no lookup)
Status: active                    ← Classification (no lookup)
```

### What Happens During Import

**1. Classifications (Direct Copy):**
```javascript
asset_type: "Pipe"        ← Copy from Excel "Pipe"
manufacturer: "Cameron"   ← Copy from Excel "Cameron"
status: "active"          ← Copy from Excel "active"
```

**2. Relationships (Lookup + Replace):**
```javascript
// Excel has: "NAVAJO"
// System does:
1. Query database: "Find site where code = 'NAVAJO'"
2. Found: { id: "site_navajo_abc123", ... }
3. Replace: site_id = "site_navajo_abc123"

// Excel has: "02 CRUDE"
// System does:
1. Query database: "Find asset_group where code = '02 CRUDE'"
2. Found: { id: "ag_02_crude_xyz789", ... }
3. Replace: asset_group_id = "ag_02_crude_xyz789"
```

**3. Final Database Record:**
```javascript
{
  id: "doc_175958...",  // Auto-generated
  type: "asset",
  tenantId: "t_hf_sinclair",  // Auto-generated
  
  // From Excel (Classifications - no lookup)
  asset_tag: "NAVAJO-02-P-0002",
  name: "02-TOWER RFX",
  asset_type: "Pipe",           ← Direct from Excel
  manufacturer: "Cameron",       ← Direct from Excel
  status: "active",              ← Direct from Excel
  
  // Looked up (Relationships - needed lookup)
  site_id: "site_navajo_abc123",        ← Looked up from "NAVAJO"
  asset_group_id: "ag_02_crude_xyz789", ← Looked up from "02 CRUDE"
  
  // Auto-generated
  created_date: "2025-10-04...",
  created_by: "admin@hfsinclair.com"
}
```

## 📊 Complete Field Breakdown

### ✅ Your Excel Columns (Recommended)

| Column Name | Field Type | Needs Lookup? | Why? |
|-------------|------------|---------------|------|
| **Asset_Tag** | Identifier | ❌ No | Your unique ID (not a relationship) |
| **Name** | Text | ❌ No | Just a description |
| **Equipment_Type** | Classification | ❌ No | Dropdown value (Pipe, Valve, Tank) |
| **Facility** | **Relationship** | ✅ **Yes** | Links to Site document |
| **Unit_ID** | **Relationship** | ✅ **Yes** | Links to Asset Group document |
| **Manufacturer** | Classification | ❌ No | Text value (Cameron, GE, Siemens) |
| **Model** | Classification | ❌ No | Text value (API-610, 7FA.05) |
| **Status** | Classification | ❌ No | Dropdown value (active, inactive) |
| **Description** | Text | ❌ No | Free text notes |

## 🧠 How to Know If Field Needs Lookup

**Ask yourself:** *"Does this field point to another item that exists separately in my system?"*

### ✅ **YES** = Needs Lookup (Relationship)
- "Which **facility** does this belong to?" → Yes, facilities exist separately → **Lookup needed**
- "Which **unit** is this in?" → Yes, units exist separately → **Lookup needed**
- "Which **company** owns this?" → Yes, companies exist separately → **Lookup needed**

### ❌ **NO** = No Lookup (Classification)
- "What **type** of equipment is this?" → No, "Pipe" is just a category → **No lookup**
- "What **status** is it?" → No, "active" is just a state → **No lookup**
- "Who **manufactured** it?" → No, "Cameron" is just a name → **No lookup**

## 🎓 Database Design Principle

This follows **normalized database design**:

### Relationships (Foreign Keys)
```sql
-- Assets table
asset_group_id → FOREIGN KEY → asset_groups.id
site_id        → FOREIGN KEY → sites.id

-- Can JOIN to get full data:
SELECT assets.*, sites.name AS site_name
FROM assets
JOIN sites ON assets.site_id = sites.id
```

### Classifications (Enumerations)
```sql
-- Assets table
asset_type     → ENUM or STRING (no join needed)
status         → ENUM or STRING (no join needed)
manufacturer   → STRING (no join needed)
```

## 💡 Key Takeaway

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  RELATIONSHIPS = Links between documents            │
│  → Need Lookup to get document IDs                 │
│                                                     │
│  CLASSIFICATIONS = Categories and labels            │
│  → Just copy the value, no lookup needed           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 📝 Your Import Workflow

### Step 1: Create Parent Documents (if needed)
```javascript
// Create Company (if doesn't exist)
POST /api/documents
{ type: "company", name: "HF Sinclair", code: "HF_SINCLAIR" }

// Create Site (if doesn't exist)
POST /api/documents
{ type: "site", name: "NAVAJO Refinery", code: "NAVAJO", company_id: "..." }

// Create Asset Group (if doesn't exist)
POST /api/documents
{ type: "asset_group", name: "02 CRUDE Unit", code: "02 CRUDE", site_id: "..." }
```

### Step 2: Import Assets
```excel
| Asset_Tag        | Name         | Equipment_Type | Facility | Unit_ID  | Manufacturer | Status |
|------------------|--------------|----------------|----------|----------|--------------|--------|
| NAVAJO-02-P-0002 | 02-TOWER RFX | Pipe           | NAVAJO   | 02 CRUDE | Cameron      | active |
```

**System automatically:**
- ✅ Copies: Equipment_Type, Manufacturer, Status
- 🔍 Looks up: Facility → site_id, Unit_ID → asset_group_id
- ✅ Creates: Complete asset with all relationships linked

---

**Summary**: 
- **Relationships** (site, unit, company) = Need lookup to get IDs
- **Classifications** (type, status, manufacturer) = Just copy the text value

Does this make sense now? 🎯

