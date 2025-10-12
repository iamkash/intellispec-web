# 📁 Core vs Services - What Belongs Where?

## 🎯 The Golden Rule

> **"Would another application use this exact code?"**
> - **YES** → It's framework code → Goes in `api/core/`
> - **NO** → It's domain code → Goes in `api/services/`

---

## ✅ What BELONGS in `api/core/` (Framework)

### **Authentication & Authorization**
- ✅ **AuthService** - JWT verification, token generation (ANY app needs auth)
- ✅ **AuthorizationService** - Permissions, roles, access control (ANY app needs authz)

### **Observability & Logging**
- ✅ **Logger** - Structured logging (ANY app needs logging)
- ✅ **Metrics** - Prometheus metrics (ANY app needs metrics)
- ✅ **AuditTrail** - Change tracking (ANY app needs audits)
- ✅ **TenantUsageMonitoring** - Usage tracking (ANY multi-tenant app needs this)

### **Data Access & Context**
- ✅ **BaseRepository** - Generic CRUD (ANY app needs data access)
- ✅ **TenantContext** - Tenant info holder (ANY multi-tenant app needs this)
- ✅ **TenantContextFactory** - Context creation (ANY multi-tenant app needs this)
- ✅ **RequestContext** - Request state (ANY app needs request tracking)

### **Storage & Caching**
- ✅ **FileStorage** - GridFS operations (ANY app needs file storage)
- ✅ **CacheManager** - Multi-level caching (ANY app needs caching)

### **Error Handling & Performance**
- ✅ **ErrorHandler** - Standardized errors (ANY app needs error handling)
- ✅ **RateLimiter** - Rate limiting (ANY app needs rate limiting)
- ✅ **FeatureFlags** - Feature toggles (ANY app needs feature flags)

**Common Theme:** All these services are **infrastructure/framework** concerns that **ANY application** would need!

---

## ✅ What BELONGS in `api/services/` (Domain)

### **Business Logic Services**
- ✅ **WorkflowService** - Workflow execution tracking (specific to YOUR workflow domain)
- ✅ **ExecutionService** - Execution state management (specific to YOUR execution domain)
- ✅ **InspectionService** - Inspection logic (specific to YOUR inspection domain)
- ✅ **vectorUpdateService** - Vector operations (specific to YOUR RAG/AI domain)

### **Examples of Other Domain Services:**
- ✅ **InvoiceService** - Invoice calculations (specific to accounting domain)
- ✅ **OrderService** - Order processing (specific to e-commerce domain)
- ✅ **PaymentService** - Payment handling (specific to payment domain)
- ✅ **NotificationService** - Business notifications (specific to YOUR notification rules)

**Common Theme:** All these services implement **business rules** that are **specific to YOUR application's domain**!

---

## 🔍 Decision Tree

```
┌─────────────────────────────────────────────────┐
│  "Where should my service go?"                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Q1: Is it about infrastructure/framework?      │
│  (Auth, logging, caching, errors, metrics)      │
│                                                 │
│  ├─ YES → api/core/                            │
│  └─ NO → Continue...                            │
│                                                 │
│  Q2: Would another application use this         │
│      EXACT code without changes?                │
│                                                 │
│  ├─ YES → api/core/                            │
│  └─ NO → Continue...                            │
│                                                 │
│  Q3: Does it implement business rules for       │
│      a specific entity or domain?               │
│  (Workflows, invoices, orders, inspections)     │
│                                                 │
│  ├─ YES → api/services/                        │
│  └─ NO → api/utils/ or reconsider design       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 Comparison Table

| Service | Framework or Domain? | Folder | Reason |
|---------|---------------------|--------|---------|
| **AuthService** | 🟢 Framework | `api/core/` | JWT/token management - ANY app needs auth |
| **AuthorizationService** | 🟢 Framework | `api/core/` | Permission checks - ANY app needs authz |
| **Logger** | 🟢 Framework | `api/core/` | Structured logging - ANY app needs logging |
| **CacheManager** | 🟢 Framework | `api/core/` | Caching - ANY app needs caching |
| **ErrorHandler** | 🟢 Framework | `api/core/` | Error handling - ANY app needs errors |
| **WorkflowService** | 🔴 Domain | `api/services/` | Workflow business logic - specific to YOUR domain |
| **ExecutionService** | 🔴 Domain | `api/services/` | Execution state - specific to YOUR domain |
| **InspectionService** | 🔴 Domain | `api/services/` | Inspection logic - specific to YOUR domain |
| **InvoiceService** | 🔴 Domain | `api/services/` | Invoice calculations - specific to YOUR domain |

---

## 💡 Examples to Clarify

### Example 1: Why AuthService is Framework (Core)

**Question:** Would an e-commerce app, a CRM app, and a blog app all need JWT authentication?

**Answer:** YES! They all need to:
- Verify tokens ✅
- Generate tokens ✅
- Load users ✅
- Manage sessions ✅

**Conclusion:** AuthService is **framework code** → `api/core/` ✅

---

### Example 2: Why WorkflowService is Domain (Services)

**Question:** Would an e-commerce app, a CRM app, and a blog app all need YOUR specific workflow execution tracking logic?

**Answer:** NO! They have different workflows:
- E-commerce: Order fulfillment workflows ❌
- CRM: Sales pipeline workflows ❌
- Blog: Content publishing workflows ❌

**Conclusion:** WorkflowService is **domain code** → `api/services/` ✅

---

## 🎓 Test Your Understanding

### Test Case 1: UserService

**Question:** Does `UserService` (user profile management, settings) belong in core or services?

**Answer:** 🔴 **api/services/** (Domain)

**Reason:** While users are common, the specific business rules for managing users, user profiles, user preferences, etc., are domain-specific. The framework provides authentication (AuthService), but user management is business logic.

---

### Test Case 2: EmailService

**Question:** Does `EmailService` (sending emails via SendGrid/SMTP) belong in core or services?

**Answer:** 🟢 **api/core/** (Framework)

**Reason:** Sending emails is infrastructure. The HOW (SMTP, API) is framework. The WHAT (email templates, business rules) might be in services, but the email sending mechanism is framework.

---

### Test Case 3: PaymentService

**Question:** Does `PaymentService` (Stripe integration, payment processing) belong in core or services?

**Answer:** 🔴 **api/services/** (Domain)

**Reason:** Payment processing contains business rules specific to YOUR application (pricing, discounts, refunds, etc.). Even if you use Stripe, the business logic is domain-specific.

---

## ✅ Current State of Your Project

### **api/core/ (15 files) - ALL CORRECT! ✅**

```
✅ AuthService.js              - Framework (JWT, tokens)
✅ AuthorizationService.js      - Framework (permissions)
✅ Logger.js                    - Framework (logging)
✅ ErrorHandler.js              - Framework (errors)
✅ AuditTrail.js                - Framework (audits)
✅ Metrics.js                   - Framework (observability)
✅ RequestContext.js            - Framework (request state)
✅ TenantContext.js             - Framework (tenant context)
✅ TenantContextFactory.js     - Framework (context factory)
✅ BaseRepository.js            - Framework (data access)
✅ FileStorage.js               - Framework (file operations)
✅ CacheManager.js              - Framework (caching)
✅ RateLimiter.js               - Framework (rate limiting)
✅ TenantUsageMonitoring.js    - Framework (usage tracking)
✅ FeatureFlags.js              - Framework (feature toggles)
```

**Status:** 🟢 100% Framework services - PERFECT! ✅

---

### **api/services/ (4 files) - ALL CORRECT! ✅**

```
✅ WorkflowService.js        - Domain (workflow business logic)
✅ ExecutionService.js       - Domain (execution state management)
✅ InspectionService.js      - Domain (inspection business logic)
✅ vectorUpdateService.js    - Domain (vector/RAG operations)
```

**Status:** 🟢 100% Domain services - PERFECT! ✅

---

## 🎯 Key Takeaways

### 1. Framework (core) = Infrastructure
- Authentication, logging, caching, metrics, errors
- Reusable across ANY application
- No business rules

### 2. Domain (services) = Business Logic
- Workflows, orders, invoices, inspections
- Specific to YOUR application
- Contains business rules

### 3. Simple Test
**Ask yourself:** "Would a completely different app (e-commerce, blog, CRM) use this EXACT code?"
- **YES** → Framework → `api/core/`
- **NO** → Domain → `api/services/`

---

## 📚 Real-World Analogy

Think of building a house:

**Framework (core/) = Foundation & Utilities**
- Plumbing (pipes, water system) - ANY house needs this
- Electrical (wiring, circuits) - ANY house needs this
- HVAC (heating, cooling) - ANY house needs this
- Foundation (concrete, supports) - ANY house needs this

**Domain (services/) = House Design & Features**
- Kitchen layout (specific to YOUR house)
- Bedroom arrangement (specific to YOUR house)
- Interior design (specific to YOUR taste)
- Custom features (specific to YOUR needs)

You wouldn't put your custom kitchen layout in the "foundation" folder, right? Same logic!

---

## ✅ Final Answer to Your Question

### **Do AuthService & AuthorizationService belong in core/?**

**YES! ABSOLUTELY! ✅**

**Reasons:**
1. ✅ They are **framework/infrastructure** services
2. ✅ They are **NOT domain-specific** (not about workflows, invoices, etc.)
3. ✅ They are **reusable in ANY application**
4. ✅ They provide **cross-cutting concerns** (auth is needed everywhere)
5. ✅ They follow the **same pattern** as other core services (Logger, ErrorHandler, etc.)

---

## 🚀 Your Architecture is PERFECT!

```
api/core/     (15 files) → 100% Framework ✅
api/services/ (4 files)  → 100% Domain ✅
```

**No changes needed!** Your folder organization is now exemplary! 🎉

---

**Last Updated:** October 4, 2025  
**Status:** ✅ Architecture validated and confirmed

