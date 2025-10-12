# Migration Checklist: Tenant-Aware Repository Pattern

This checklist helps you migrate existing services to the new repository pattern.

---

## ✅ Quick Reference

### What to Create
- [ ] Repository class in `api/repositories/`
- [ ] Update routes to use `TenantContextFactory`
- [ ] Replace service calls with repository calls
- [ ] Remove manual tenant filtering code

### What to Delete
- [ ] `getTenantAndUser()` functions in routes
- [ ] Manual `if (tenantId !== null)` checks
- [ ] Tenant parameter passing in service methods

---

## 📋 Step-by-Step Migration

### Step 1: Identify Services to Migrate

**Current services that need migration:**

Check these directories for services with tenant filtering:
- [ ] `api/services/` - Business logic services
- [ ] `api/routes/` - Route handlers with `getTenantAndUser()`

**How to identify:**
```bash
# Find all files with manual tenant filtering
grep -r "tenantId !== null" api/
grep -r "getTenantAndUser" api/routes/
grep -r "tenantId," api/services/
```

---

### Step 2: Create Repository

**Template:**

```javascript
// api/repositories/[EntityName]Repository.js

const BaseRepository = require('../core/BaseRepository');
const { [EntityName]Model } = require('../models/[EntityName]Model');

class [EntityName]Repository extends BaseRepository {
  constructor(tenantContext) {
    super([EntityName]Model, tenantContext);
  }

  /**
   * Override buildBaseQuery if entity needs type filtering
   */
  buildBaseQuery(additionalFilters = {}) {
    const query = super.buildBaseQuery(additionalFilters);
    
    // Add entity-specific filters (if needed)
    // query.type = 'entity_type';
    
    return query;
  }

  /**
   * Add entity-specific query methods here
   */
  async findByCustomCriteria(criteria) {
    return await this.find({ customField: criteria });
  }
}

module.exports = [EntityName]Repository;
```

**Example - Companies:**

```javascript
// api/repositories/CompanyRepository.js

const BaseRepository = require('../core/BaseRepository');
const { CompanyModel } = require('../models/CompanyModel');

class CompanyRepository extends BaseRepository {
  constructor(tenantContext) {
    super(CompanyModel, tenantContext);
  }

  buildBaseQuery(additionalFilters = {}) {
    const query = super.buildBaseQuery(additionalFilters);
    query.type = 'company';
    return query;
  }

  async findByIndustry(industry) {
    return await this.find({ industry });
  }
}

module.exports = CompanyRepository;
```

---

### Step 3: Update Routes

**Before:**
```javascript
// ❌ OLD PATTERN
const SomeService = require('../services/SomeService');

const getTenantAndUser = (request) => {
  const auth = request.headers['authorization'] || '';
  // ... complex extraction logic
  return { tenantId, userId };
};

fastify.get('/api/some-resource', async (request, reply) => {
  const { tenantId } = getTenantAndUser(request);
  const data = await SomeService.getData(tenantId, filters);
  return reply.send(data);
});
```

**After:**
```javascript
// ✅ NEW PATTERN
const TenantContextFactory = require('../core/TenantContextFactory');
const SomeRepository = require('../repositories/SomeRepository');

fastify.get('/api/some-resource', async (request, reply) => {
  // Extract tenant context (automatic JWT/header handling)
  const tenantContext = TenantContextFactory.fromRequest(request);
  
  // Create repository with tenant context
  const repository = new SomeRepository(tenantContext);
  
  // Query data (tenant filtering automatic!)
  const data = await repository.find(filters, options);
  
  return reply.send(data);
});
```

---

### Step 4: Update Services (If Needed)

**If service has NO business logic (just data access):**
- ✅ Delete service entirely
- ✅ Call repository directly from route

**If service HAS business logic:**
- ✅ Pass repository to service
- ✅ Keep business logic, remove data access

**Before:**
```javascript
// ❌ OLD - Service does data access AND business logic
class InspectionService {
  static async getStats(tenantId, filters) {
    // Data access (should be in repository)
    const query = { type: 'inspection' };
    if (tenantId !== null) {
      query.tenantId = tenantId;
    }
    const data = await InspectionModel.find(query);
    
    // Business logic (can stay in service)
    const stats = this.calculateStats(data);
    return stats;
  }
}
```

**After:**
```javascript
// ✅ NEW - Service only has business logic
class InspectionService {
  constructor(repository) {
    this.repository = repository;
  }
  
  async getStats(filters) {
    // Data access (delegated to repository)
    const data = await this.repository.find(filters);
    
    // Business logic (stays in service)
    const stats = this.calculateStats(data);
    return stats;
  }
  
  calculateStats(data) {
    // Business logic here
  }
}

// Usage in route
const tenantContext = TenantContextFactory.fromRequest(request);
const repository = new InspectionRepository(tenantContext);
const service = new InspectionService(repository);
const stats = await service.getStats(filters);
```

---

### Step 5: Remove Duplicate Code

**Delete these patterns:**

```javascript
// ❌ DELETE #1: Custom getTenantAndUser functions
const getTenantAndUser = (request) => {
  // DELETE THIS ENTIRE FUNCTION
};

// ❌ DELETE #2: Manual tenant filtering
if (tenantId !== null && tenantId !== undefined) {
  query.tenantId = tenantId;
}

// ❌ DELETE #3: Tenant parameter passing
async function getData(tenantId, filters) {  // Remove tenantId parameter
  const query = { tenantId };  // Remove this line
  // ...
}

// ❌ DELETE #4: Duplicate JWT verification
const auth = request.headers['authorization'];
const token = auth.slice(7);
const payload = jwt.verify(token, JWT_SECRET);
// Use TenantContextFactory instead
```

---

## 🎯 Services to Migrate (Checklist)

### High Priority (Data APIs)

- [x] **InspectionService** - ✅ COMPLETED (Reference implementation)
- [ ] **CompanyService** - Create `CompanyRepository`
- [ ] **SiteService** - Create `SiteRepository`
- [ ] **PaintInvoiceService** - Create `PaintInvoiceRepository`
- [ ] **PaintSpecService** - Create `PaintSpecRepository`
- [ ] **AssetService** - Create `AssetRepository`
- [ ] **UserService** - Create `UserRepository`

### Medium Priority (Aggregations)

- [ ] **AnalyticsService** - Use repository aggregation methods
- [ ] **ReportService** - Use repository aggregation methods
- [ ] **DashboardService** - Use repository aggregation methods

### Low Priority (Non-tenant-scoped)

- [ ] **AuthService** - May not need tenant filtering
- [ ] **SystemService** - Platform admin only

---

## 🧪 Testing Checklist

### Per Service Migration

- [ ] Unit tests pass for repository
- [ ] Integration tests pass for routes
- [ ] Platform admin can see all data
- [ ] Regular users only see their tenant data
- [ ] Backward compatibility (headers still work)
- [ ] No tenant ID leaks in responses
- [ ] Soft deletes work correctly

### Test Script Template

```javascript
// tests/repositories/YourRepository.test.js
const YourRepository = require('../repositories/YourRepository');
const TenantContext = require('../core/TenantContext');

describe('YourRepository', () => {
  describe('Tenant Filtering', () => {
    it('filters by tenant for regular users', async () => {
      const context = new TenantContext({
        userId: 'user123',
        tenantId: 't_abc',
        isPlatformAdmin: false
      });
      
      const repository = new YourRepository(context);
      const query = repository.buildBaseQuery();
      
      expect(query).toHaveProperty('tenantId', 't_abc');
      expect(query).toHaveProperty('deleted', { $ne: true });
    });
    
    it('does not filter for platform admins', async () => {
      const context = TenantContext.platformAdmin('admin123');
      
      const repository = new YourRepository(context);
      const query = repository.buildBaseQuery();
      
      expect(query).not.toHaveProperty('tenantId');
      expect(query).toHaveProperty('deleted', { $ne: true });
    });
  });
  
  describe('CRUD Operations', () => {
    it('creates with tenant assignment', async () => {
      const context = new TenantContext({
        userId: 'user123',
        tenantId: 't_abc',
        isPlatformAdmin: false
      });
      
      const repository = new YourRepository(context);
      const doc = await repository.create({ name: 'Test' });
      
      expect(doc.tenantId).toBe('t_abc');
      expect(doc.created_by).toBe('user123');
    });
    
    it('updates with audit trail', async () => {
      const context = new TenantContext({
        userId: 'user123',
        tenantId: 't_abc',
        isPlatformAdmin: false
      });
      
      const repository = new YourRepository(context);
      const doc = await repository.update('doc-123', { name: 'Updated' });
      
      expect(doc.last_updated_by).toBe('user123');
      expect(doc.last_updated).toBeInstanceOf(Date);
    });
  });
});
```

---

## 🚨 Common Pitfalls

### ❌ Pitfall #1: Passing tenantId to repositories

**Don't do this:**
```javascript
const repository = new InspectionRepository(tenantContext);
await repository.find({ tenantId: 'some-tenant' }); // ❌ WRONG
```

**Do this:**
```javascript
const repository = new InspectionRepository(tenantContext);
await repository.find({}); // ✅ CORRECT - Automatic filtering
```

### ❌ Pitfall #2: Creating repository outside request context

**Don't do this:**
```javascript
// ❌ WRONG - Repository created at module level
const repository = new InspectionRepository(someContext);

fastify.get('/api/inspections', async (request) => {
  return await repository.find(); // Will use wrong tenant!
});
```

**Do this:**
```javascript
// ✅ CORRECT - Repository created per request
fastify.get('/api/inspections', async (request) => {
  const tenantContext = TenantContextFactory.fromRequest(request);
  const repository = new InspectionRepository(tenantContext);
  return await repository.find();
});
```

### ❌ Pitfall #3: Bypassing repository

**Don't do this:**
```javascript
// ❌ WRONG - Direct model access bypasses tenant filtering
const data = await InspectionModel.find({ type: 'inspection' });
```

**Do this:**
```javascript
// ✅ CORRECT - Use repository
const repository = new InspectionRepository(tenantContext);
const data = await repository.find();
```

### ❌ Pitfall #4: Forgetting to extend BaseRepository

**Don't do this:**
```javascript
// ❌ WRONG - No tenant filtering
class MyRepository {
  async find() {
    return await MyModel.find();
  }
}
```

**Do this:**
```javascript
// ✅ CORRECT - Extends BaseRepository
class MyRepository extends BaseRepository {
  constructor(tenantContext) {
    super(MyModel, tenantContext);
  }
}
```

---

## 📊 Migration Progress Tracking

### How to Track

Create a file `api/MIGRATION_STATUS.md`:

```markdown
# Migration Status

Last updated: [DATE]

## Completed ✅
- [x] InspectionService → InspectionRepository

## In Progress 🚧
- [ ] CompanyService → CompanyRepository (50% done)

## Pending ⏳
- [ ] SiteService
- [ ] PaintInvoiceService
- [ ] PaintSpecService

## Blocked 🚫
- [ ] LegacyService (waiting for schema update)
```

---

## 🎓 Learning Resources

### Read These Files

1. **`api/ARCHITECTURE.md`** - Complete architecture overview
2. **`api/core/TenantContext.js`** - Value object pattern
3. **`api/core/BaseRepository.js`** - Repository pattern
4. **`api/repositories/InspectionRepository.js`** - Reference implementation
5. **`api/routes/inspections-fastify.js`** - Updated routes example

### Key Concepts

- **Repository Pattern** - Data access abstraction
- **Factory Pattern** - Object creation
- **Strategy Pattern** - Different behaviors (admin vs user)
- **Chain of Responsibility** - Authentication fallback
- **Value Object** - Immutable domain objects

---

## 🆘 Need Help?

### Decision Tree

```
Q: Does this service access the database?
├─ Yes → Create Repository
└─ No → Keep as-is

Q: Does this service have complex business logic?
├─ Yes → Keep Service + Use Repository
└─ No → Delete Service, use Repository directly

Q: Is this a multi-tenant resource?
├─ Yes → Must use Repository pattern
└─ No → Can use Repository or direct access

Q: Does this need platform admin access?
├─ Yes → Repository will handle automatically
└─ No → Repository will still work
```

---

## ✅ Sign-Off Checklist

Before considering migration complete:

- [ ] All routes use `TenantContextFactory`
- [ ] All data access goes through repositories
- [ ] No manual tenant filtering in code
- [ ] Tests pass (unit + integration)
- [ ] Platform admin can access all data
- [ ] Regular users properly scoped
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Deployed to staging
- [ ] Smoke tests pass

---

*Migration checklist last updated: October 4, 2025*

