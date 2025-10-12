# 📁 Folder Organization & Architecture Guidelines

## 🎯 Purpose

This document defines the **correct folder structure** and what types of code belong in each folder. This ensures maintainability, scalability, and prevents architectural violations.

---

## 📂 Folder Structure

```
api/
├── core/               # ✅ FRAMEWORK SERVICES ONLY
├── services/           # ✅ DOMAIN/APPLICATION SERVICES
├── repositories/       # ✅ DATA ACCESS LAYER
├── models/             # ✅ DATA SCHEMAS
├── middleware/         # ✅ HTTP REQUEST/RESPONSE HANDLERS
├── routes/             # ✅ API ENDPOINTS
└── utils/              # ✅ UTILITY FUNCTIONS
```

---

## 📋 What Belongs Where

### 1. `api/core/` - Framework Services Only

**✅ SHOULD contain:**
- **Infrastructure services** (Logger, ErrorHandler, Metrics)
- **Framework utilities** (TenantContext, RequestContext, BaseRepository)
- **Cross-cutting concerns** (AuthService, AuthorizationService, FileStorage)
- **Framework middleware** (AuditTrail, RateLimiter, CacheManager, FeatureFlags)

**❌ SHOULD NOT contain:**
- Domain-specific business logic
- Application services
- Entity-specific services (WorkflowService, UserService, etc.)

**Rule:** If it's specific to your business domain (workflows, executions, invoices, etc.), it doesn't belong in core!

**Current files (15) - ALL CORRECT:**
```
✅ Logger.js                    - Framework logging
✅ ErrorHandler.js              - Framework error handling
✅ AuditTrail.js                - Framework audit trail
✅ Metrics.js                   - Framework metrics/observability
✅ RequestContext.js            - Framework request state
✅ TenantContext.js             - Framework tenant context
✅ TenantContextFactory.js     - Framework factory
✅ BaseRepository.js            - Framework base repository
✅ AuthService.js               - Framework authentication
✅ AuthorizationService.js      - Framework authorization
✅ FileStorage.js               - Framework file storage
✅ CacheManager.js              - Framework caching
✅ RateLimiter.js               - Framework rate limiting
✅ TenantUsageMonitoring.js    - Framework usage tracking
✅ FeatureFlags.js              - Framework feature toggles
```

---

### 2. `api/services/` - Domain/Application Services

**✅ SHOULD contain:**
- **Business logic** for specific entities
- **Domain services** (WorkflowService, ExecutionService, InvoiceService, etc.)
- **Application services** (NotificationService, ReportService, etc.)
- **Orchestration** between repositories and external systems

**❌ SHOULD NOT contain:**
- Framework-level code
- HTTP handling (that's middleware)
- Direct database queries (use repositories)

**Rule:** If it implements business rules for a specific entity or use case, it belongs in services!

**Current files (4) - ALL CORRECT:**
```
✅ WorkflowService.js        - Workflow business logic (MOVED HERE)
✅ ExecutionService.js       - Execution state management (MOVED HERE)
✅ InspectionService.js      - Inspection business logic
✅ vectorUpdateService.js    - Vector update orchestration
```

**Examples of what should be here:**
- `UserService.js` - User management logic
- `NotificationService.js` - Notification sending logic
- `ReportService.js` - Report generation logic
- `InvoiceService.js` - Invoice calculation logic

---

### 3. `api/repositories/` - Data Access Layer

**✅ SHOULD contain:**
- **CRUD operations** for entities
- **Database queries**
- **Aggregations**
- All classes extending BaseRepository

**❌ SHOULD NOT contain:**
- Business logic
- HTTP handling
- Calculations or transformations (use services)

**Rule:** If it touches the database, it belongs in repositories!

**Current files (4) - ALL CORRECT:**
```
✅ BaseRepository.js          - Framework base repository
✅ DocumentRepository.js      - Generic document CRUD
✅ MembershipRepository.js    - Membership data access
✅ WorkflowRepository.js      - Workflow queries
✅ ExecutionRepository.js     - Execution queries
✅ InspectionRepository.js    - Inspection queries
```

---

### 4. `api/models/` - Data Schemas

**✅ SHOULD contain:**
- **Mongoose schemas**
- **Simple getter methods** (no database operations)
- **Schema-level hooks** (pre-save, etc.)
- **Indexes**

**❌ SHOULD NOT contain:**
- Database queries (.find(), .aggregate())
- Business logic
- State transitions with .save()
- Static methods with database operations

**Rule:** Models define what data looks like, not how to manipulate it!

**Current files (4) - ALL CORRECT:**
```
✅ Membership.js           - Pure schema (91% schema, 9% getters)
✅ Workflow.js             - Pure schema (88% schema, 12% getters)
✅ Execution.js            - Pure schema (92% schema, 8% getters)
✅ DocumentVectors.js      - Pure schema (100% schema)
```

---

### 5. `api/middleware/` - HTTP Request/Response Handlers

**✅ SHOULD contain:**
- **HTTP middleware** functions (request, reply parameters)
- **Authentication checks**
- **Authorization checks**
- **Request validation**
- **Response transformation**

**❌ SHOULD NOT contain:**
- Business logic (use services)
- Database queries (use repositories)
- Complex calculations

**Rule:** Middleware handles HTTP concerns only!

**Current files (4) - ALL CORRECT:**
```
✅ fastify-auth.js         - Authentication middleware
✅ platform-admin.js       - Platform admin authorization
✅ tenant-scope.js         - Tenant scope enforcement
✅ tenant-security.js      - Tenant security validation
```

---

### 6. `api/routes/` - API Endpoints

**✅ SHOULD contain:**
- **Fastify route definitions**
- **Request validation**
- **Response formatting**
- **Calls to services and repositories**

**❌ SHOULD NOT contain:**
- Business logic (use services)
- Database queries (use repositories)
- Authentication logic (use middleware)

**Rule:** Routes orchestrate the flow, they don't implement it!

---

## 🎯 Decision Tree: Where Does My Code Belong?

### Step 1: What does it do?

```
Is it framework/infrastructure code?
├─ YES → api/core/
└─ NO → Continue to Step 2

Is it business logic for a specific entity?
├─ YES → api/services/
└─ NO → Continue to Step 3

Does it access the database?
├─ YES → api/repositories/
└─ NO → Continue to Step 4

Is it a data structure definition?
├─ YES → api/models/
└─ NO → Continue to Step 5

Does it handle HTTP requests/responses?
├─ YES → api/middleware/ or api/routes/
└─ NO → api/utils/
```

### Step 2: Ask these questions

**Should it go in `api/core/`?**
- ❓ Would another application use this exact code?
- ❓ Is it related to logging, errors, metrics, caching, etc.?
- ❓ Is it completely independent of business domain?
- ✅ If YES to all → `api/core/`

**Should it go in `api/services/`?**
- ❓ Does it implement business rules?
- ❓ Is it specific to your application domain?
- ❓ Does it orchestrate multiple repositories/external systems?
- ✅ If YES to any → `api/services/`

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Domain Services in Core
```javascript
// WRONG: api/core/WorkflowService.js
// Workflows are domain-specific!

// RIGHT: api/services/WorkflowService.js
```

### ❌ Mistake 2: Business Logic in Repositories
```javascript
// WRONG: In repository
async calculateInvoiceTotal(invoiceId) {
  const invoice = await this.findById(invoiceId);
  // Complex calculation logic...
  return total;
}

// RIGHT: In service
class InvoiceService {
  async calculateTotal(invoiceId) {
    const invoice = await InvoiceRepository.findById(invoiceId);
    // Complex calculation logic...
    return total;
  }
}
```

### ❌ Mistake 3: Database Operations in Models
```javascript
// WRONG: In model
WorkflowSchema.methods.incrementCount = async function() {
  this.count += 1;
  await this.save(); // ❌ Database operation in model!
}

// RIGHT: In service
class WorkflowService {
  async incrementCount(workflowId) {
    const workflow = await WorkflowRepository.findById(workflowId);
    workflow.count += 1;
    return await WorkflowRepository.update(workflowId, workflow);
  }
}
```

### ❌ Mistake 4: Business Logic in Middleware
```javascript
// WRONG: In middleware
async function processOrder(request, reply) {
  const order = request.body;
  // Complex order processing logic...
  // Calculations...
  // Database updates...
}

// RIGHT: In service + middleware
// Middleware:
async function processOrder(request, reply) {
  const order = request.body;
  const result = await OrderService.process(order);
  reply.send(result);
}

// Service:
class OrderService {
  async process(order) {
    // Complex order processing logic...
  }
}
```

---

## 📊 Dependency Rules

### Allowed Dependencies:
```
Routes      →  Services, Repositories, Middleware
Middleware  →  Services
Services    →  Repositories, Core, Other Services
Repositories→  Core, Models
Models      →  Nothing (pure data schemas)
Core        →  Nothing (except other core components)
```

### Forbidden Dependencies:
```
Core        ❌→  Services (core can't depend on domain)
Models      ❌→  Services (models can't have business logic)
Models      ❌→  Repositories (models can't query database)
Repositories❌→  Services (repositories can't have business logic)
```

---

## ✅ Checklist: Is My File in the Right Place?

### For `api/core/` files:
- [ ] Can this be reused in ANY application?
- [ ] Is it completely domain-agnostic?
- [ ] Does it provide infrastructure/framework functionality?
- [ ] Does it NOT contain business rules?

### For `api/services/` files:
- [ ] Does this implement business logic for a specific entity?
- [ ] Is it specific to this application's domain?
- [ ] Does it orchestrate multiple repositories?
- [ ] Does it NOT touch the database directly?

### For `api/repositories/` files:
- [ ] Does this perform database operations?
- [ ] Does it extend BaseRepository?
- [ ] Does it contain ONLY data access logic?
- [ ] Does it NOT contain business rules?

### For `api/models/` files:
- [ ] Is this just a schema definition?
- [ ] Does it contain NO database operations?
- [ ] Does it contain NO business logic?
- [ ] Are methods just simple getters?

---

## 🎓 Key Principles

1. **Framework vs Domain:**
   - Core = Framework (reusable anywhere)
   - Services = Domain (specific to this app)

2. **Separation of Concerns:**
   - Routes = HTTP
   - Services = Business Logic
   - Repositories = Data Access
   - Models = Data Structure

3. **Single Responsibility:**
   - Each file has ONE clear purpose
   - No mixing of concerns

4. **Dependency Direction:**
   - Always flows inward (Routes → Services → Repositories → Models)
   - Core is independent of everything

---

## 📈 Benefits of Proper Organization

✅ **Maintainability** - Easy to find and modify code  
✅ **Testability** - Each layer can be tested independently  
✅ **Scalability** - Clear structure as app grows  
✅ **Reusability** - Framework code can be extracted  
✅ **Onboarding** - New developers understand structure  
✅ **Refactoring** - Safe to modify without side effects  

---

## 🔄 Migration Guide

### If you find code in the wrong place:

1. **Identify the correct location** using the decision tree
2. **Move the file** to the correct folder
3. **Update import paths** in the moved file
4. **Update all files** that import the moved file
5. **Test** to ensure nothing broke
6. **Document** the change

### Example: Moving WorkflowService

```bash
# 1. Move file
mv api/core/WorkflowService.js api/services/WorkflowService.js

# 2. Update imports in WorkflowService.js
# Change: require('./Logger') 
# To:     require('../core/Logger')

# 3. Update all files importing WorkflowService
# Change: require('../core/WorkflowService')
# To:     require('../services/WorkflowService')

# 4. Test
npm test (or start server and verify)
```

---

## 🎯 Summary

| Folder | Purpose | Examples |
|--------|---------|----------|
| **core/** | Framework infrastructure | Logger, ErrorHandler, AuthService |
| **services/** | Domain business logic | WorkflowService, ExecutionService |
| **repositories/** | Database queries | WorkflowRepository, UserRepository |
| **models/** | Data schemas | Workflow, Execution, User |
| **middleware/** | HTTP handlers | Authentication, Authorization |
| **routes/** | API endpoints | /api/workflows, /api/users |

---

**Last Updated:** October 4, 2025  
**Status:** ✅ Enforced - All files now in correct locations

