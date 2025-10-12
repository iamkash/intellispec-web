# Tenant Admin Creation & Tenant-Scoped Access

## Overview

This document describes the tenant admin user creation system and tenant-scoped data access controls that ensure tenant admins can only access their own tenant's data.

---

## 🎯 Key Features

### **1. Tenant Admin User Creation**
- Super Admin sets **username** and **password** directly
- **No welcome emails** sent
- **No auto-generated passwords**
- User is immediately ready to log in
- User automatically assigned `tenant_admin` role
- User linked to tenant via membership

### **2. Tenant-Scoped Access**
- **Super Admin**: Full access to all tenants
- **Tenant Admin**: Access only to their assigned tenant(s)
- **Automatic filtering**: All queries automatically filtered by tenant
- **Permission enforcement**: Middleware validates tenant access
- **Audit logging**: All tenant admin actions logged

---

## 📁 Files Created

### **1. Tenant Creation API** (`api/routes/tenant-creation.js`)

Atomic tenant creation endpoint that creates:
- Tenant record
- Admin user (with password)
- Membership (links user to tenant)
- Subscription
- Entitlements
- Audit logs for all actions

**Endpoint**: `POST /api/tenants/create-with-admin`

**Features**:
- MongoDB transaction (all-or-nothing)
- Password validation (minimum 8 characters)
- Password confirmation check
- Duplicate email detection
- Duplicate slug detection
- Complete audit trail

### **2. Tenant Scope Middleware** (`api/middleware/tenant-scope.js`)

Middleware to enforce tenant-scoped access:

**Key Functions**:
- `enforceTenantScope()` - Middleware to filter queries by tenant
- `applyTenantFilter(query, request)` - Helper to add tenant filter to queries
- `requireTenantAdmin` - Middleware to require tenant admin role
- `getUserTenants(userId)` - Get all tenants user has access to
- `isSuperAdmin(user)` - Check if user is super admin
- `isTenantAdmin(userId, tenantId)` - Check if user is admin for specific tenant

### **3. Tenant Data Routes** (`api/routes/tenant-data.js`)

Example routes showing tenant-scoped data access:
- `GET /api/tenant-data/documents` - List documents (auto-filtered)
- `GET /api/tenant-data/documents/:id` - Get document (validates access)
- `POST /api/tenant-data/documents` - Create document (requires tenant admin)
- `PUT /api/tenant-data/documents/:id` - Update document (validates access)
- `DELETE /api/tenant-data/documents/:id` - Delete document (validates access)
- `GET /api/tenant-data/stats` - Get statistics (tenant-scoped)

### **4. Enhanced Tenant Form** (`public/data/workspaces/system-admin/tenant-document.json`)

Updated form with password fields:
- `admin.email` - Admin email address
- `admin.name` - Admin full name
- `admin.password` - Password (minimum 8 characters)
- `admin.confirmPassword` - Password confirmation
- Password strength indicator
- Conditional display (only shown when creating new admin)

---

## 🚀 Usage Guide

### **For Super Admin: Create Tenant with Admin User**

#### **Step 1: Navigate to Tenant Creation**
```
Navigate to: Tenant Management → Create New Tenant
```

#### **Step 2: Fill Basic Information**
- **Tenant Name**: "Acme Manufacturing"
- **Slug**: "acme-manufacturing"
- **Organization**: Optional
- **Status**: Active

#### **Step 3: Configure Plan**
- **Plan**: IntelliFlex or IntelliEnterprise
- **Type**: User-based, Facility-based, or Enterprise
- **Limits**: Set max users or facilities

#### **Step 4: Configure Trial** (Optional)
- **Enable Trial**: Toggle on/off
- **Trial Days**: e.g., 30
- **Start Mode**: Auto or Manual
- **Grace Period**: e.g., 7 days

#### **Step 5: Select Modules**
Check modules to enable:
- [x] IntelliInspect
- [x] IntelliPaint
- [x] IntelliTrack
- [ ] IntelliComply

#### **Step 6: Create Tenant Admin User**
1. Select **"Create New User"**
2. Enter **Email**: `admin@acme.com`
3. Enter **Name**: `John Admin`
4. Enter **Password**: `SecurePass123!`
5. Confirm **Password**: `SecurePass123!`

**Password Requirements**:
- Minimum 8 characters
- Must match confirmation
- Strength indicator shows password quality

#### **Step 7: Set Subscription**
- **Start Date**: 2025-01-01
- **End Date**: 2026-01-01
- **Auto-Renew**: Toggle
- **Grace Period**: 7 days

#### **Step 8: Submit**
- Click **Submit**
- System creates everything atomically:
  - ✅ Tenant created
  - ✅ Admin user created with password
  - ✅ User assigned tenant_admin role
  - ✅ Membership created
  - ✅ Subscription created
  - ✅ Entitlements created
  - ✅ All actions logged to audit trail

---

### **For Tenant Admin: Accessing Tenant Data**

#### **Login**
Tenant admin logs in with:
- **Email**: `admin@acme.com`
- **Password**: `SecurePass123!` (set by Super Admin)

#### **Automatic Tenant Filtering**
When tenant admin accesses data:

**Example: View Documents**
```javascript
// Tenant Admin makes request:
GET /api/tenant-data/documents

// Middleware automatically filters to their tenant:
query = {
  tenantId: "t_acme_manufacturing"  // Automatically added
}

// Returns only Acme Manufacturing documents
// Cannot see other tenants' data
```

**Example: Super Admin vs Tenant Admin**

| User Type | Request | Result |
|-----------|---------|--------|
| **Super Admin** | `GET /api/tenant-data/documents` | Returns **all** documents from **all** tenants |
| **Tenant Admin** | `GET /api/tenant-data/documents` | Returns only documents from **their tenant** |

---

## 🔐 Security Model

### **Access Levels**

#### **Super Admin**
```javascript
{
  role: 'super_admin',
  tenantScoped: false,
  allowedTenants: 'all'
}
```

**Permissions**:
- ✅ Create/edit/delete any tenant
- ✅ Create/edit tenant admin users
- ✅ View all audit logs
- ✅ Access data from all tenants
- ✅ Change tenant status
- ✅ Modify subscriptions and entitlements

#### **Tenant Admin**
```javascript
{
  role: 'tenant_admin',
  tenantScoped: true,
  allowedTenants: ['t_acme_manufacturing']
}
```

**Permissions**:
- ✅ View their tenant's data only
- ✅ Create/edit documents in their tenant
- ✅ Manage users in their tenant
- ✅ View their tenant's reports
- ❌ Cannot access other tenants
- ❌ Cannot create tenants
- ❌ Cannot view audit logs (system-wide)

---

## 🛡️ Middleware Usage

### **Enforce Tenant Scope**

Automatically filters queries to user's tenant(s):

```javascript
const { enforceTenantScope, applyTenantFilter } = require('../middleware/tenant-scope');

// Apply middleware to route
fastify.get('/data', { preHandler: enforceTenantScope() }, async (request, reply) => {
  // Build query
  let query = { deleted: false };
  
  // Apply tenant filter (automatic)
  query = applyTenantFilter(query, request);
  
  // Super Admin: query = { deleted: false }
  // Tenant Admin: query = { deleted: false, tenantId: "t_acme" }
  
  const data = await DataModel.find(query);
  return reply.send({ data });
});
```

### **Require Tenant Admin Role**

Ensures only tenant admins (or super admin) can perform action:

```javascript
const { requireTenantAdmin } = require('../middleware/tenant-scope');

// Require tenant admin for this route
fastify.post('/data', { 
  preHandler: [enforceTenantScope(), requireTenantAdmin] 
}, async (request, reply) => {
  // Only tenant admins and super admins can reach this code
  // Tenant is already validated
  
  const { tenantId, data } = request.body;
  
  // Create data (tenant access already validated by middleware)
  const result = await DataModel.create({ tenantId, data });
  
  return reply.send({ result });
});
```

### **Check User's Tenants**

Get all tenants a user has access to:

```javascript
const { getUserTenants } = require('../middleware/tenant-scope');

const tenants = await getUserTenants('u_john_admin');
// Returns: ['t_acme_manufacturing']

const superAdminTenants = await getUserTenants('u_super_admin');
// Returns: ['t_tenant1', 't_tenant2', 't_tenant3', ...]
```

---

## 📊 Request Flow

### **Tenant Admin Request**

```
1. Tenant Admin Login
   ↓
   User: { id: "u_john_admin", email: "admin@acme.com" }

2. Make Request: GET /api/tenant-data/documents
   ↓
   
3. enforceTenantScope() Middleware
   ↓
   - Check: Is user Super Admin? → NO
   - Query memberships: userId = "u_john_admin"
   - Found: tenantId = "t_acme_manufacturing"
   - Set: request.allowedTenants = ["t_acme_manufacturing"]
   - Set: request.tenantScoped = true
   - Continue →

4. Route Handler
   ↓
   query = { deleted: false }
   query = applyTenantFilter(query, request)
   → query = { deleted: false, tenantId: "t_acme_manufacturing" }

5. Database Query
   ↓
   DocumentModel.find({ 
     deleted: false, 
     tenantId: "t_acme_manufacturing"  // Auto-added!
   })

6. Return Results
   ↓
   Only Acme Manufacturing documents returned
   ✅ Tenant isolation enforced
```

### **Super Admin Request**

```
1. Super Admin Login
   ↓
   User: { id: "u_super_admin", role: "super_admin" }

2. Make Request: GET /api/tenant-data/documents
   ↓
   
3. enforceTenantScope() Middleware
   ↓
   - Check: Is user Super Admin? → YES
   - Set: request.allowedTenants = 'all'
   - Set: request.tenantScoped = false
   - Continue →

4. Route Handler
   ↓
   query = { deleted: false }
   query = applyTenantFilter(query, request)
   → query = { deleted: false }  // No tenant filter!

5. Database Query
   ↓
   DocumentModel.find({ deleted: false })

6. Return Results
   ↓
   ALL documents from ALL tenants returned
   ✅ Super Admin has full access
```

---

## 🧪 Testing

### **Test Scenario 1: Create Tenant with Admin**

```bash
POST /api/tenants/create-with-admin
Content-Type: application/json

{
  "tenant": {
    "name": "Test Company",
    "slug": "test-company",
    "status": "active",
    "plan": "IntelliFlex",
    "tenantType": "user-based",
    "maxUsers": 10,
    "trial": {
      "enabled": true,
      "trialDays": 30,
      "startMode": "auto",
      "gracePeriodDays": 7
    },
    "notes": "Test tenant"
  },
  "admin": {
    "createNew": "create",
    "email": "admin@testcompany.com",
    "name": "Test Admin",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  },
  "subscription": {
    "termStartAt": "2025-01-01",
    "termEndAt": "2026-01-01",
    "autoRenew": false,
    "gracePeriodDays": 7
  },
  "entitlements": {
    "modules": ["system", "inspect", "track"]
  }
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Tenant created successfully with admin user",
  "data": {
    "tenantId": "t_1234567890_abc123",
    "adminUserId": "u_1234567890_xyz789",
    "tenant": { ... }
  }
}
```

**Audit Logs Created**:
1. `create_tenant` - Tenant creation
2. `create_user` - Admin user creation
3. `assign_tenant_admin` - Admin role assignment
4. `create_subscription` - Subscription creation
5. `create_entitlements` - Entitlements creation

### **Test Scenario 2: Tenant Admin Access**

```bash
# Login as tenant admin
POST /api/auth/login
{
  "email": "admin@testcompany.com",
  "password": "SecurePass123!"
}

# Get documents (should only return Test Company documents)
GET /api/tenant-data/documents
Authorization: Bearer <token>

# Response will be automatically filtered:
{
  "success": true,
  "data": [
    { "id": "doc1", "tenantId": "t_test_company", ... }
    // Only Test Company documents
  ],
  "meta": {
    "tenantScoped": true,
    "allowedTenants": 1
  }
}

# Try to access another tenant's document (should fail)
GET /api/tenant-data/documents/doc_other_tenant
Authorization: Bearer <token>

# Response:
{
  "success": false,
  "error": "Document not found or access denied"
}
```

### **Test Scenario 3: Super Admin Access**

```bash
# Login as super admin
POST /api/auth/login
{
  "email": "super_admin@intellispec.com",
  "password": "admin_password"
}

# Get documents (returns all tenants)
GET /api/tenant-data/documents
Authorization: Bearer <token>

# Response includes ALL tenants:
{
  "success": true,
  "data": [
    { "id": "doc1", "tenantId": "t_test_company", ... },
    { "id": "doc2", "tenantId": "t_acme", ... },
    { "id": "doc3", "tenantId": "t_other", ... }
    // All tenants visible
  ],
  "meta": {
    "tenantScoped": false,
    "allowedTenants": "all"
  }
}
```

---

## 🔧 Configuration

### **Identify Super Admin**

The middleware identifies super admins by checking:

```javascript
function isSuperAdmin(user) {
  return user?.role === 'super_admin' || 
         user?.roles?.includes('super_admin') ||
         user?.email?.endsWith('@intellispec.com');
}
```

**Methods**:
1. User has `role: 'super_admin'`
2. User has 'super_admin' in `roles` array
3. User email ends with `@intellispec.com` (fallback)

### **Multi-Tenant Users**

Users can belong to multiple tenants:

```javascript
// User is admin of 3 different tenants
const user = {
  id: "u_multi_tenant_admin",
  tenants: ["t_acme", "t_globex", "t_initech"]
};

// Request will filter to ANY of these tenants:
query.tenantId = { $in: ["t_acme", "t_globex", "t_initech"] };
```

---

## ✅ Summary

### **What's Implemented**

✅ Tenant admin user creation with Super Admin-set passwords  
✅ No welcome emails (passwords set directly)  
✅ Password validation and confirmation  
✅ Atomic tenant creation (all-or-nothing)  
✅ Tenant-scoped data access middleware  
✅ Automatic query filtering by tenant  
✅ Permission validation for tenant admins  
✅ Complete audit trail of all actions  
✅ Example routes showing tenant-scoped access  
✅ Support for multi-tenant users  

### **Security Features**

✅ Tenant admins can only access their tenant's data  
✅ Super Admin has unrestricted access  
✅ All queries automatically filtered by tenant  
✅ Middleware validates tenant access on every request  
✅ Password hashing with bcrypt (12 rounds)  
✅ Transaction support (atomic operations)  
✅ Audit logging of all tenant admin actions  

### **Developer Experience**

✅ Simple middleware: `{ preHandler: enforceTenantScope() }`  
✅ Helper function: `applyTenantFilter(query, request)`  
✅ Clear access levels (Super Admin vs Tenant Admin)  
✅ Example routes provided  
✅ Comprehensive documentation  

---

## 🎯 Next Steps (Optional Enhancements)

1. **Email Verification** (if needed in future):
   - Add email verification flag
   - Send verification email
   - Require verification before login

2. **Password Reset** (for tenant admins):
   - "Forgot password" flow
   - Reset link generation
   - Email delivery

3. **Session Management**:
   - Track active sessions
   - Force logout
   - Session timeout

4. **IP Whitelisting** (enterprise feature):
   - Allow tenant admins only from specific IPs
   - IP range configuration
   - Geographic restrictions

5. **MFA/2FA** (Two-Factor Authentication):
   - TOTP support
   - SMS verification
   - Backup codes

---

## 📝 Complete Example

### **Full Tenant Creation Flow**

```javascript
// 1. Super Admin creates tenant with admin
POST /api/tenants/create-with-admin
{
  "tenant": {
    "name": "Acme Corp",
    "slug": "acme-corp",
    "plan": "IntelliEnterprise",
    "tenantType": "enterprise"
  },
  "admin": {
    "createNew": "create",
    "email": "admin@acme.com",
    "name": "Jane Admin",
    "password": "SecureP@ss2025",
    "confirmPassword": "SecureP@ss2025"
  },
  "subscription": {
    "termStartAt": "2025-01-01",
    "termEndAt": "2026-01-01"
  },
  "entitlements": {
    "modules": ["system", "inspect", "paint"]
  }
}

// 2. Tenant admin logs in
POST /api/auth/login
{
  "email": "admin@acme.com",
  "password": "SecureP@ss2025"
}
// Returns JWT token

// 3. Tenant admin accesses data
GET /api/tenant-data/documents
Authorization: Bearer <token>

// Middleware automatically:
// - Validates token
// - Extracts user ID
// - Queries memberships
// - Finds tenant: "t_acme_corp"
// - Filters query: { tenantId: "t_acme_corp" }
// - Returns only Acme Corp data

// 4. Tenant admin creates document
POST /api/tenant-data/documents
Authorization: Bearer <token>
{
  "tenantId": "t_acme_corp",
  "type": "invoice",
  "title": "Invoice 001",
  "data": { ... }
}

// Middleware validates:
// - User is tenant admin? ✅
// - User has access to t_acme_corp? ✅
// - Create document ✅
// - Log to audit trail ✅
```

**Result**: Complete tenant isolation with full audit trail!

