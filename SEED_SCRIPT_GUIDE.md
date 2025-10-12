# Multi-Tenant Seed Script Guide

## ✅ Updated Behavior (SAFE by default!)

The seed script now uses **UPSERT mode by default** instead of destructive DELETE-and-CREATE.

---

## 🎯 Two Modes

### **1. UPSERT Mode (Default - SAFE)**

```bash
node scripts/seed-multi-tenant-data.js
```

**Behavior**:
- ✅ **Updates existing records** if they already exist (by `id`, `key`, etc.)
- ✅ **Creates new records** if they don't exist
- ✅ **Preserves existing data** that's not in the seed file
- ✅ **Safe to run multiple times**
- ✅ **Increments version** for entitlements on update

**Use Case**: 
- Adding new test data
- Updating seed data definitions
- Running multiple times during development
- Production/staging environments where you want to preserve data

---

### **2. CLEAR Mode (Destructive - USE WITH CAUTION)**

```bash
node scripts/seed-multi-tenant-data.js --clear
```

**Behavior**:
- ⚠️ **DELETES ALL** multi-tenant data first
- ⚠️ **Then creates** fresh data from seed definitions
- ⚠️ **Destructive** - cannot be undone
- ⚠️ **Use only** for clean slate scenarios

**Use Case**:
- Initial setup of new environment
- Resetting test environment to known state
- Fixing corrupted data by starting fresh
- When you explicitly need a clean slate

---

## 📊 What Gets Updated/Created

| Collection | Upsert Key | Behavior |
|------------|-----------|----------|
| **Modules** | `key` | Updates if exists, creates if not |
| **Organizations** | `id` | Updates if exists, creates if not |
| **Tenants** | `id` | Updates if exists, creates if not |
| **Subscriptions** | `tenantId` | Updates if exists, creates if not |
| **Entitlements** | `tenantId` | Updates + increments version |
| **Users** | `id` | Updates if exists, creates if not |
| **Memberships** | `userId + tenantId + role` | Creates only if doesn't exist (no update) |

---

## 🔄 Upsert Logic Examples

### **Modules (by `key`)**
```javascript
// If module with key="inspect" exists → UPDATE it
// If module with key="inspect" doesn't exist → CREATE it
await ModuleModel.updateOne(
  { key: "inspect" },
  { $set: { ...data, updatedAt: new Date() } },
  { upsert: true }
);
```

### **Tenants (by `id`)**
```javascript
// If tenant with id="t_pk_industria" exists → UPDATE it
// If tenant with id="t_pk_industria" doesn't exist → CREATE it
await TenantModel.updateOne(
  { id: "t_pk_industria" },
  { $set: { ...data, updatedAt: new Date() } },
  { upsert: true }
);
```

### **Entitlements (by `tenantId`, increments version)**
```javascript
// If entitlements exist for tenant → UPDATE and increment version
// If entitlements don't exist → CREATE with version 1
const existing = await TenantEntitlementsModel.findOne({ tenantId });
if (existing) {
  await TenantEntitlementsModel.updateOne(
    { tenantId },
    { $set: { ...data, version: existing.version + 1 } }
  );
} else {
  await TenantEntitlementsModel.create({ ...data, version: 1 });
}
```

### **Memberships (skip duplicates)**
```javascript
// Only creates if exact membership doesn't exist
// (userId + tenantId + role combo)
const existing = await MembershipModel.findOne({
  userId, tenantId, role
});
if (!existing) {
  await MembershipModel.create({ ...data });
}
```

---

## 🎬 Example Scenarios

### **Scenario 1: First Time Setup**

```bash
# Fresh database, no data
node scripts/seed-multi-tenant-data.js

# Result:
# - Creates all organizations, tenants, users, etc.
# - Database is populated with test data
```

### **Scenario 2: Adding New Test Tenant**

```bash
# Add new tenant to SEED_DATA in the script
# Run without --clear flag
node scripts/seed-multi-tenant-data.js

# Result:
# - Existing tenants are updated (not duplicated)
# - New tenant is created
# - All existing data is preserved
```

### **Scenario 3: Updating Entitlements**

```bash
# Change entitlements.modules in SEED_DATA
# Run without --clear flag
node scripts/seed-multi-tenant-data.js

# Result:
# - Entitlements for affected tenants are UPDATED
# - Version number is incremented
# - effectiveAt is set to current timestamp
# - Other tenants unchanged
```

### **Scenario 4: Corrupted Data - Need Fresh Start**

```bash
# Use --clear flag for destructive reset
node scripts/seed-multi-tenant-data.js --clear

# Result:
# - ALL multi-tenant data DELETED first
# - Fresh data created from seed definitions
# - Clean slate
```

### **Scenario 5: Running Multiple Times**

```bash
# Run once
node scripts/seed-multi-tenant-data.js

# Make changes to seed data
# Run again
node scripts/seed-multi-tenant-data.js

# Result:
# - Changed records are UPDATED
# - New records are CREATED
# - Unchanged records stay the same
# - Safe to run repeatedly!
```

---

## 📝 Console Output

### **Upsert Mode**:
```
🌱 IntelliSpec Multi-Tenant Seed Script
========================================

✅ UPSERT MODE: Updating existing records, inserting new ones
💡 Use --clear flag to delete all data before seeding

📦 Seeding modules (upsert mode)...
✅ Seeded 8 modules
🏢 Seeding organizations (upsert mode)...
✅ Seeded 3 organizations
🏬 Seeding tenants (upsert mode)...
✅ Seeded 6 tenants
📅 Seeding subscriptions (upsert mode)...
✅ Seeded 6 subscriptions
🎟️  Seeding entitlements (upsert mode)...
✅ Seeded 6 entitlements
👥 Seeding users (upsert mode)...
✅ Seeded 12 users
🔗 Seeding memberships (upsert mode)...
✅ Seeded 16 memberships (skipped duplicates)

========================================
[Summary of current database state]
✅ Seed process completed successfully!
```

### **Clear Mode**:
```
🌱 IntelliSpec Multi-Tenant Seed Script
========================================

⚠️  DESTRUCTIVE MODE: Clearing all existing data...

⚠️  WARNING: This will DELETE all multi-tenant data!
✅ All existing data cleared.

📦 Seeding modules (upsert mode)...
[... rest of seeding ...]
```

---

## 🔍 Checking What Changed

### **Before Running**:
```bash
# Check current tenant count
mongo
> use intellispec-dev
> db.tenants.countDocuments()
6

> db.tenants.find({}, {id: 1, name: 1, plan: 1})
```

### **After Running (Upsert Mode)**:
```bash
# Check if tenants were updated/added
> db.tenants.countDocuments()
6  # Same count (updated existing)
   # OR
8  # Increased (added new ones)

# Check specific tenant was updated
> db.tenants.findOne({id: "t_pk_industria"})
# Shows updated fields
```

---

## ⚠️ Important Notes

### **Upsert Mode (Default)**:
- ✅ Safe for development
- ✅ Safe for staging
- ✅ Safe to run multiple times
- ⚠️ May not detect removed records (only updates/adds)

### **Clear Mode (--clear)**:
- ⚠️ **DESTRUCTIVE** - deletes all data
- ⚠️ Cannot be undone
- ⚠️ Use only when you need a clean slate
- ⚠️ **NEVER use in production** without backup

### **Timestamp Behavior**:
- `createdAt`: Only set on first insert (`$setOnInsert`)
- `updatedAt`: Always updated on each run (`$set`)

### **Version Increments**:
- Entitlements version increments on each update
- Tracks entitlement change history
- `effectiveAt` timestamp updated

### **Membership Duplicates**:
- Script checks for existing memberships
- Skips if same `userId + tenantId + role` exists
- Prevents duplicate membership records

---

## 🚀 Recommended Usage

### **Development**:
```bash
# Always use upsert mode
node scripts/seed-multi-tenant-data.js
```

### **Staging**:
```bash
# Upsert to update test data
node scripts/seed-multi-tenant-data.js
```

### **Testing Environment Reset**:
```bash
# Clear mode for clean slate
node scripts/seed-multi-tenant-data.js --clear
```

### **Production**:
```bash
# NEVER run seed scripts in production
# Use proper migration/deployment scripts instead
```

---

## 🛠️ Customizing Seed Data

Edit the `SEED_DATA` object in `scripts/seed-multi-tenant-data.js`:

```javascript
const SEED_DATA = {
  organizations: [
    { id: "o_my_org", name: "My Organization", status: "active" }
  ],
  tenants: [
    { 
      id: "t_my_tenant", 
      orgId: "o_my_org",
      name: "My Tenant",
      plan: "IntelliFlex",
      tenantType: "user-based",
      maxUsers: 50
    }
  ],
  // ... etc
};
```

Then run:
```bash
node scripts/seed-multi-tenant-data.js
```

Your changes will be upserted into the database!

---

## 📊 Summary Table

| Operation | Default Mode | Clear Mode |
|-----------|-------------|------------|
| **Updates existing** | ✅ Yes | ⚠️ Deletes first |
| **Creates new** | ✅ Yes | ✅ Yes |
| **Preserves other data** | ✅ Yes | ❌ No |
| **Safe to re-run** | ✅ Yes | ⚠️ Destructive |
| **Use in development** | ✅ Yes | ⚠️ Caution |
| **Use in production** | ❌ No | ❌ Never |

---

## 🎯 Key Takeaway

**Default behavior is now SAFE**: 
- ✅ Updates existing records
- ✅ Adds new records
- ✅ Preserves other data
- ✅ Can run multiple times

**Use `--clear` only when you need a clean slate!**

---

## 🐛 Troubleshooting

### **Error: Duplicate key error**
```
Cause: Trying to insert with duplicate unique field
Solution: The upsert should handle this, check the script's upsert key
```

### **Records not updating**
```
Cause: Upsert key might not match
Solution: Check that your seed data IDs match existing records
```

### **Memberships not created**
```
Cause: Membership already exists with same userId+tenantId+role
Solution: This is expected behavior (prevents duplicates)
```

### **Version not incrementing**
```
Cause: Only entitlements have version tracking
Solution: Check TenantEntitlements collection specifically
```

---

## 📞 Support

If you need to:
- Add new seed data → Edit `SEED_DATA` object, run without `--clear`
- Update existing records → Edit `SEED_DATA` object, run without `--clear`
- Start fresh → Run with `--clear` flag
- Check what's in DB → Use MongoDB shell or Compass

**Default mode is SAFE! You can run the script repeatedly without losing data.** 🎉

