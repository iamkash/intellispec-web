# API Architecture Documentation

## 🏗️ Design Patterns & Principles

This API follows enterprise-grade architecture patterns with strict separation of concerns and SOLID principles.

---

## 📐 Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                      HTTP Layer                          │
│                   (Routes/Controllers)                   │
│  - Request validation                                    │
│  - Response formatting                                   │
│  - Error handling                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                          │
│                 (Business Logic)                         │
│  - Business rules                                        │
│  - Orchestration                                         │
│  - Domain logic                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 Repository Layer                         │
│                  (Data Access)                           │
│  - Database queries                                      │
│  - Data transformation                                   │
│  - Tenant filtering (automatic)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│              (Mongoose Models)                           │
│  - Schema definitions                                    │
│  - Validation rules                                      │
│  - Indexes                                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Design Patterns

### 1. Repository Pattern

**Purpose:** Abstract data access logic from business logic

**Benefits:**
- ✅ Single source of truth for data access
- ✅ Consistent query building
- ✅ Easy to test (mock repository)
- ✅ Centralized tenant filtering

**Implementation:**

```javascript
// Base repository with common operations
class BaseRepository {
  async find(filters, options) { }
  async findOne(filters, options) { }
  async findById(id) { }
  async create(data) { }
  async update(id, data) { }
  async delete(id) { }
}

// Domain-specific repository
class InspectionRepository extends BaseRepository {
  async findWithFilters(filters, options) { }
  async getStatistics(filters) { }
  async runAggregation(config) { }
}
```

**Usage:**
```javascript
// In route handler
const tenantContext = TenantContextFactory.fromRequest(request);
const repository = new InspectionRepository(tenantContext);
const inspections = await repository.find(filters, options);
```

---

### 2. Factory Pattern

**Purpose:** Centralized object creation with complex logic

**Implementation:**

```javascript
class TenantContextFactory {
  static fromRequest(request) {
    // Chain of Responsibility:
    // 1. Try JWT
    // 2. Try Headers
    // 3. Default
    return new TenantContext(...);
  }
}
```

**Benefits:**
- ✅ Single place to modify context extraction logic
- ✅ Consistent context creation across all routes
- ✅ Easy to add new authentication methods

---

### 3. Strategy Pattern

**Purpose:** Different behavior for platform admin vs regular users

**Implementation:**

```javascript
class TenantContext {
  getTenantFilter() {
    if (this._isPlatformAdmin) {
      return null; // Strategy: No filtering for admin
    }
    return { tenantId: this._tenantId }; // Strategy: Filter by tenant
  }
}
```

**Benefits:**
- ✅ Behavior changes based on user role
- ✅ No if/else in business logic
- ✅ Easy to add new strategies

---

### 4. Chain of Responsibility

**Purpose:** Try multiple authentication methods in sequence

**Implementation:**

```javascript
class TenantContextFactory {
  static fromRequest(request) {
    // Handler 1: Try JWT
    const jwtContext = this._tryExtractFromJWT(request);
    if (jwtContext) return jwtContext;
    
    // Handler 2: Try Headers
    const headerContext = this._tryExtractFromHeaders(request);
    if (headerContext) return headerContext;
    
    // Handler 3: Default
    return this._defaultContext();
  }
}
```

**Benefits:**
- ✅ Backward compatible
- ✅ Graceful fallback
- ✅ Easy to add new authentication methods

---

### 5. Value Object Pattern

**Purpose:** Immutable, self-validating domain objects

**Implementation:**

```javascript
class TenantContext {
  constructor(options) {
    this._userId = options.userId;
    this._tenantId = options.tenantId;
    Object.freeze(this); // Immutable
  }
  
  hasAccessToTenant(tenantId) {
    // Self-contained business logic
  }
}
```

**Benefits:**
- ✅ Immutable - no side effects
- ✅ Self-validating
- ✅ Thread-safe (for future async operations)

---

### 6. Template Method Pattern

**Purpose:** Define algorithm skeleton in base class, allow customization in subclasses

**Implementation:**

```javascript
class BaseRepository {
  // Template method
  async find(filters, options) {
    const query = this.buildBaseQuery(filters); // Hook point
    return await this.model.find(query).exec();
  }
  
  // Hook method - override in subclass
  buildBaseQuery(filters) {
    return { deleted: { $ne: true }, ...filters };
  }
}

class InspectionRepository extends BaseRepository {
  // Override hook to add inspection-specific logic
  buildBaseQuery(filters) {
    const query = super.buildBaseQuery(filters);
    query.type = 'inspection'; // Add custom logic
    return query;
  }
}
```

**Benefits:**
- ✅ Consistent algorithm structure
- ✅ Customization points clearly defined
- ✅ No code duplication

---

## 🔐 Tenant Scoping Architecture

### Problem Solved

**Before:** Tenant filtering scattered everywhere
```javascript
// ❌ OLD CODE - Duplicated in every method
async getInspections(tenantId) {
  const query = { type: 'inspection' };
  if (tenantId !== null) {
    query.tenantId = tenantId;
  }
  return await InspectionModel.find(query);
}

async getStats(tenantId) {
  const query = { type: 'inspection' };
  if (tenantId !== null) {  // ❌ Duplicated!
    query.tenantId = tenantId;
  }
  return await InspectionModel.aggregate(...);
}
```

**After:** Tenant filtering in ONE place
```javascript
// ✅ NEW CODE - Repository handles it automatically
class BaseRepository {
  buildBaseQuery(filters) {
    const query = { deleted: { $ne: true }, ...filters };
    const tenantFilter = this.context.getTenantFilter();
    if (tenantFilter) {
      Object.assign(query, tenantFilter);
    }
    return query;
  }
}

// Usage - no tenant logic needed
async getInspections() {
  return await repository.find(); // Tenant filtering automatic!
}

async getStats() {
  return await repository.aggregate(...); // Tenant filtering automatic!
}
```

### Data Flow

```
HTTP Request
     │
     ↓
[TenantContextFactory.fromRequest()]
     │
     ├→ Extract JWT token
     ├→ Verify and decode
     ├→ Create TenantContext
     │   ├→ Platform Admin: tenantId = null
     │   └→ Regular User: tenantId = 't_abc123'
     │
     ↓
[Create Repository with TenantContext]
     │
     ↓
[Repository.find()]
     │
     ├→ buildBaseQuery()
     │   ├→ Get tenant filter from context
     │   │   ├→ Platform Admin: null → No filter added
     │   │   └→ Regular User: { tenantId: 't_abc123' }
     │   └→ Build final query
     │
     ↓
[MongoDB Query Executed]
     │
     ├→ Platform Admin: Sees ALL documents
     └→ Regular User: Sees only their tenant's documents
```

---

## 📝 SOLID Principles Applied

### Single Responsibility Principle (SRP)

Each class has ONE reason to change:

- **TenantContext:** Hold tenant information
- **TenantContextFactory:** Create TenantContext objects
- **BaseRepository:** Generic data access operations
- **InspectionRepository:** Inspection-specific data access
- **InspectionService:** Inspection business logic
- **Routes:** HTTP request/response handling

### Open/Closed Principle (OCP)

Open for extension, closed for modification:

```javascript
// ✅ Extend BaseRepository for new entities
class CompanyRepository extends BaseRepository {
  // Add company-specific methods
  async findByIndustry(industry) { }
}

// ✅ No need to modify BaseRepository
```

### Liskov Substitution Principle (LSP)

Subclasses can replace base classes:

```javascript
// ✅ Any repository can be used where BaseRepository is expected
function processData(repository: BaseRepository) {
  return repository.find(); // Works with InspectionRepository, CompanyRepository, etc.
}
```

### Interface Segregation Principle (ISP)

Clients only depend on methods they use:

```javascript
// ✅ TenantContext only exposes what's needed
class TenantContext {
  getTenantFilter() { }  // Only method repositories need
  hasAccessToTenant() { } // Only method authorization needs
}
```

### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions:

```javascript
// ✅ Repository depends on TenantContext (abstraction), not JWT details
class BaseRepository {
  constructor(tenantContext: TenantContext) {
    // Doesn't know how context was created
  }
}
```

---

## 🔄 Atomicity & Transactions

### Current State

Each repository operation is atomic at the MongoDB level.

### Future Enhancement: Multi-Document Transactions

```javascript
class BaseRepository {
  async withTransaction(callback) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// Usage
await repository.withTransaction(async (session) => {
  await repository.create(data1, { session });
  await repository.create(data2, { session });
  // Both or neither
});
```

---

## ♻️ Reusability

### Creating New Repositories

**Step 1:** Create repository class

```javascript
// api/repositories/CompanyRepository.js
const BaseRepository = require('../core/BaseRepository');
const { CompanyModel } = require('../models/CompanyModel');

class CompanyRepository extends BaseRepository {
  constructor(tenantContext) {
    super(CompanyModel, tenantContext);
  }
  
  // Add company-specific methods
  async findByIndustry(industry) {
    return await this.find({ industry });
  }
}

module.exports = CompanyRepository;
```

**Step 2:** Use in routes

```javascript
// api/routes/companies.js
const TenantContextFactory = require('../core/TenantContextFactory');
const CompanyRepository = require('../repositories/CompanyRepository');

fastify.get('/api/companies', async (request, reply) => {
  const tenantContext = TenantContextFactory.fromRequest(request);
  const repository = new CompanyRepository(tenantContext);
  const companies = await repository.find();
  return reply.send(companies);
});
```

**That's it!** Tenant filtering is automatic. ✅

---

## 🧪 Testability

### Unit Testing Repositories

```javascript
// tests/repositories/InspectionRepository.test.js
const InspectionRepository = require('../repositories/InspectionRepository');
const TenantContext = require('../core/TenantContext');

describe('InspectionRepository', () => {
  it('filters by tenant for regular users', async () => {
    const context = new TenantContext({
      userId: 'user123',
      tenantId: 't_abc',
      isPlatformAdmin: false
    });
    
    const repository = new InspectionRepository(context);
    const query = repository.buildBaseQuery();
    
    expect(query.tenantId).toBe('t_abc');
  });
  
  it('does not filter for platform admins', async () => {
    const context = TenantContext.platformAdmin('admin123');
    
    const repository = new InspectionRepository(context);
    const query = repository.buildBaseQuery();
    
    expect(query.tenantId).toBeUndefined();
  });
});
```

### Mocking Repositories in Service Tests

```javascript
// tests/services/InspectionService.test.js
const InspectionService = require('../services/InspectionService');

describe('InspectionService', () => {
  it('calculates statistics correctly', async () => {
    const mockRepository = {
      find: jest.fn().mockResolvedValue([
        { status: 'completed' },
        { status: 'in_progress' }
      ])
    };
    
    const service = new InspectionService(mockRepository);
    const stats = await service.calculateStats();
    
    expect(stats.total).toBe(2);
  });
});
```

---

## 🚀 Performance Considerations

### 1. Repository Instance Caching (Optional)

For high-throughput scenarios:

```javascript
// Middleware to create repository once per request
fastify.decorateRequest('getRepository', null);

fastify.addHook('preHandler', async (request) => {
  const tenantContext = TenantContextFactory.fromRequest(request);
  const cache = new Map();
  
  request.getRepository = (RepositoryClass) => {
    if (!cache.has(RepositoryClass)) {
      cache.set(RepositoryClass, new RepositoryClass(tenantContext));
    }
    return cache.get(RepositoryClass);
  };
});

// Usage
const repository = request.getRepository(InspectionRepository);
```

### 2. Query Optimization

BaseRepository supports projections and indexes:

```javascript
// Only fetch needed fields
await repository.find({}, {
  projection: { id: 1, title: 1, status: 1 }
});
```

### 3. Pagination

Built-in pagination support:

```javascript
const result = await repository.findWithPagination(filters, {
  page: 1,
  limit: 20,
  sort: { created_date: -1 }
});
// Returns: { data, total, page, totalPages }
```

---

## 🛡️ Security

### 1. Automatic Tenant Isolation

**Platform admins** see all data (by design).  
**Regular users** are automatically restricted to their tenant.

```javascript
// ✅ Enforced at repository level - cannot be bypassed
const repository = new InspectionRepository(tenantContext);
await repository.find(); // Always tenant-filtered for non-admins
```

### 2. Soft Deletes

All deletes are soft by default:

```javascript
await repository.delete(id); // Sets deleted: true
await repository.hardDelete(id); // Platform admin only
```

### 3. Audit Trail

Automatic audit fields:

```javascript
await repository.create(data);
// Adds: created_by, created_date, last_updated, last_updated_by

await repository.update(id, data);
// Updates: last_updated, last_updated_by
```

---

## 📚 Migration Guide

### Migrating Existing Services

**Step 1:** Create repository

```javascript
// api/repositories/YourRepository.js
const BaseRepository = require('../core/BaseRepository');
const { YourModel } = require('../models/YourModel');

class YourRepository extends BaseRepository {
  constructor(tenantContext) {
    super(YourModel, tenantContext);
  }
  
  buildBaseQuery(filters) {
    const query = super.buildBaseQuery(filters);
    query.type = 'your_type'; // If needed
    return query;
  }
}

module.exports = YourRepository;
```

**Step 2:** Update routes

```javascript
// BEFORE
const getTenantAndUser = (request) => { /* ... */ };
fastify.get('/api/your-resource', async (request) => {
  const { tenantId } = getTenantAndUser(request);
  const data = await YourService.getData(tenantId);
  return reply.send(data);
});

// AFTER
const TenantContextFactory = require('../core/TenantContextFactory');
const YourRepository = require('../repositories/YourRepository');

fastify.get('/api/your-resource', async (request) => {
  const tenantContext = TenantContextFactory.fromRequest(request);
  const repository = new YourRepository(tenantContext);
  const data = await repository.find();
  return reply.send(data);
});
```

**Step 3:** Update service (optional)

```javascript
// If you have complex business logic
class YourService {
  constructor(repository) {
    this.repository = repository;
  }
  
  async processData() {
    const data = await this.repository.find();
    // Business logic here
    return processedData;
  }
}
```

**Step 4:** Remove old tenant filtering code

```javascript
// ❌ DELETE THIS - No longer needed
if (tenantId !== null && tenantId !== undefined) {
  query.tenantId = tenantId;
}
```

---

## 📖 Summary

### Key Benefits

1. **DRY** - Tenant filtering logic in ONE place
2. **SOLID** - Follows all SOLID principles
3. **Testable** - Easy to mock and unit test
4. **Maintainable** - Clear separation of concerns
5. **Extensible** - Easy to add new entities
6. **Secure** - Tenant isolation enforced automatically
7. **Performant** - Optimized query building
8. **Backward Compatible** - Supports JWT and header auth

### Core Components

- **TenantContext** - Value object holding tenant info
- **TenantContextFactory** - Creates context from requests
- **BaseRepository** - Abstract data access with tenant filtering
- **Domain Repositories** - Extend base for specific entities

### Usage Pattern

```javascript
// 1. Extract context
const tenantContext = TenantContextFactory.fromRequest(request);

// 2. Create repository
const repository = new InspectionRepository(tenantContext);

// 3. Query data (tenant filtering automatic!)
const data = await repository.find(filters, options);
```

---

*Documentation last updated: October 4, 2025*

