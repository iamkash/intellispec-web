# Core Framework Components

This directory contains the foundational framework components for the tenant-aware repository pattern.

---

## 📦 Components

### TenantContext.js
**Pattern:** Value Object  
**Purpose:** Immutable object representing tenant access context

**Key Features:**
- Immutable (frozen object)
- Self-validating
- Contains user and tenant information
- Platform admin detection
- Multi-tenant access support

**Usage:**
```javascript
const context = new TenantContext({
  userId: 'user123',
  tenantId: 't_abc',
  isPlatformAdmin: false
});

const filter = context.getTenantFilter();
// → { tenantId: 't_abc' }
```

---

### TenantContextFactory.js
**Pattern:** Factory + Chain of Responsibility  
**Purpose:** Create TenantContext from various sources

**Key Features:**
- JWT token extraction
- Header-based extraction (legacy)
- Fallback chain
- Platform admin context creation

**Usage:**
```javascript
// From HTTP request
const context = TenantContextFactory.fromRequest(request);

// Manual creation
const adminContext = TenantContextFactory.createPlatformAdmin('admin123');
```

---

### BaseRepository.js
**Pattern:** Repository + Template Method  
**Purpose:** Abstract base class for all data access

**Key Features:**
- Automatic tenant filtering
- Soft delete support
- CRUD operations
- Pagination
- Aggregation support
- Audit trail (created_by, updated_by)

**Usage:**
```javascript
class InspectionRepository extends BaseRepository {
  constructor(tenantContext) {
    super(InspectionModel, tenantContext);
  }
}

const repository = new InspectionRepository(tenantContext);
const data = await repository.find(filters);
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         HTTP Request                     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  TenantContextFactory.fromRequest()      │
│  - Extracts JWT/Headers                  │
│  - Creates TenantContext                 │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Create Repository(tenantContext)        │
│  - Injects context into repository       │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Repository.find(filters)                │
│  - Builds query with tenant filtering    │
│  - Executes database query               │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Return Results                          │
│  - Platform Admin: All data              │
│  - Regular User: Tenant-scoped data      │
└──────────────────────────────────────────┘
```

---

## 🎯 Design Principles

### Single Responsibility
- **TenantContext:** Hold tenant info
- **TenantContextFactory:** Create contexts
- **BaseRepository:** Data access

### Open/Closed
- Extend BaseRepository for new entities
- No need to modify core components

### Dependency Inversion
- Repositories depend on TenantContext (abstraction)
- Not on JWT or authentication details

---

## 🔒 Security

### Tenant Isolation
- **Automatic:** All queries filtered by tenant (except platform admins)
- **Enforced:** At framework level, cannot be bypassed
- **Immutable:** Context cannot be modified after creation

### Soft Deletes
- All deletes are soft by default (`deleted: true`)
- Hard delete requires platform admin privileges

### Audit Trail
- Automatic tracking: `created_by`, `last_updated_by`
- Timestamps: `created_date`, `last_updated`

---

## 🧪 Testing

### Unit Test Template

```javascript
const TenantContext = require('./TenantContext');

describe('TenantContext', () => {
  it('creates context for regular user', () => {
    const context = new TenantContext({
      userId: 'user123',
      tenantId: 't_abc',
      isPlatformAdmin: false
    });
    
    expect(context.userId).toBe('user123');
    expect(context.tenantId).toBe('t_abc');
    expect(context.hasUnrestrictedAccess()).toBe(false);
  });
  
  it('creates platform admin context', () => {
    const context = TenantContext.platformAdmin('admin123');
    
    expect(context.hasUnrestrictedAccess()).toBe(true);
    expect(context.getTenantFilter()).toBeNull();
  });
});
```

---

## 📚 Related Documentation

- **`../ARCHITECTURE.md`** - Complete architecture overview
- **`../MIGRATION_CHECKLIST.md`** - Migration guide
- **`../repositories/InspectionRepository.js`** - Reference implementation

---

## ⚠️ Important Notes

### Do NOT:
- ❌ Modify these core files unless absolutely necessary
- ❌ Add business logic to core components
- ❌ Bypass BaseRepository for data access
- ❌ Create repository instances at module level

### Do:
- ✅ Extend BaseRepository for new entities
- ✅ Use TenantContextFactory in all routes
- ✅ Create repository instances per request
- ✅ Follow the patterns consistently

---

*Core framework version: 1.0.0*  
*Last updated: October 4, 2025*

