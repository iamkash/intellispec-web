# Platform Admin Data Access Fix

## 🎯 Problem

When logging in as `superadmin@pksti.com` (platform admin), you couldn't see previously created documents because:

1. **Tenant Scoping Middleware** was filtering all queries by tenant
2. **Platform Admin Detection** wasn't recognizing `platformRole: 'platform_admin'`
3. **Request User Object** wasn't including platform admin flags

---

## ✅ Solution Applied

### 1. Updated Tenant Scope Middleware

**File:** `api/middleware/tenant-scope.js`

**Before:**
```javascript
function isSuperAdmin(user) {
  return user?.role === 'super_admin' || 
         user?.roles?.includes('super_admin') ||
         user?.email?.endsWith('@intellispec.com');
}
```

**After:**
```javascript
function isSuperAdmin(user) {
  return user?.role === 'super_admin' || 
         user?.roles?.includes('super_admin') ||
         user?.platformRole === 'platform_admin' ||  // ✅ NEW
         user?.isPlatformAdmin === true ||            // ✅ NEW
         user?.email?.endsWith('@intellispec.com');
}
```

### 2. Updated Auth Middleware

**File:** `api/middleware/fastify-auth.js`

**Before:**
```javascript
request.user = {
  id: userDoc._id.toString(),
  userId: userDoc.userId,
  tenantId: userDoc.tenantId.toString(),
  email: userDoc.email,
  roles: roles,
  permissions: [...new Set(permissions)]
};
```

**After:**
```javascript
request.user = {
  id: userDoc._id.toString(),
  userId: userDoc.userId,
  tenantId: userDoc.tenantId.toString(),
  email: userDoc.email,
  platformRole: userDoc.platformRole || 'user',           // ✅ NEW
  isPlatformAdmin: userDoc.platformRole === 'platform_admin',  // ✅ NEW
  roles: roles,
  permissions: [...new Set(permissions)]
};
```

---

## 🚀 How It Works Now

### Platform Admin Flow

```
1. Login as superadmin@pksti.com
   ↓
2. JWT includes: platformRole: 'platform_admin'
   ↓
3. Auth middleware populates:
   request.user.platformRole = 'platform_admin'
   request.user.isPlatformAdmin = true
   ↓
4. Tenant scope middleware checks isSuperAdmin()
   ↓
5. Recognizes platform admin → Sets:
   request.tenantScoped = false
   request.allowedTenants = 'all'
   ↓
6. Route handlers DON'T filter by tenant
   ↓
7. ✅ Platform admin sees ALL documents from ALL tenants!
```

### Regular User Flow

```
1. Login as admin@hfsinclair.com
   ↓
2. JWT includes: tenantSlug: 'hf-sinclair'
   ↓
3. Auth middleware populates:
   request.user.platformRole = 'user'
   request.user.isPlatformAdmin = false
   ↓
4. Tenant scope middleware checks isSuperAdmin()
   ↓
5. NOT a platform admin → Gets user memberships
   ↓
6. Sets:
   request.tenantScoped = true
   request.allowedTenants = ['t_hf_sinclair']
   ↓
7. Route handlers FILTER by tenant
   ↓
8. ✅ Regular user sees ONLY their tenant's documents
```

---

## 📊 Example: Fetching Documents

### Platform Admin Query

```javascript
// Platform admin makes request
GET /api/tenant-scoped/documents

// Middleware sets:
request.tenantScoped = false
request.allowedTenants = 'all'

// Route handler query:
const query = {}; // NO tenant filter!

// Result: Returns ALL documents from ALL tenants
```

### Regular User Query

```javascript
// Regular user makes request
GET /api/tenant-scoped/documents

// Middleware sets:
request.tenantScoped = true
request.allowedTenants = ['t_hf_sinclair']

// Route handler query:
const query = { tenantId: { $in: ['t_hf_sinclair'] } };

// Result: Returns ONLY documents from hf-sinclair tenant
```

---

## 🔒 Routes Protected by Tenant Scoping

These routes now properly recognize platform admins:

1. `GET /api/tenant-scoped/documents` - List documents
2. `GET /api/tenant-scoped/documents/:id` - Get document
3. `POST /api/tenant-scoped/documents` - Create document
4. `PUT /api/tenant-scoped/documents/:id` - Update document
5. `DELETE /api/tenant-scoped/documents/:id` - Delete document
6. `GET /api/tenant-scoped/stats` - Tenant statistics

**Platform admins** now have **unrestricted access** to all of these! ✅

---

## 🧪 Testing

### Test 1: Platform Admin Sees All Data

```bash
# Login as platform admin
POST /api/auth/login
{
  "email": "superadmin@pksti.com",
  "password": "Admin@12345"
}

# Get documents - should see ALL tenants' data
GET /api/tenant-scoped/documents
Authorization: Bearer {token}

# Response should include documents from:
# - t_pk_inspections
# - t_hf_sinclair
# - t_sherwin_williams
# - etc.
```

### Test 2: Regular User Sees Only Their Data

```bash
# Login as regular user
POST /api/auth/login
{
  "email": "admin@hfsinclair.com",
  "password": "password123"
}

# Get documents - should see ONLY hf-sinclair data
GET /api/tenant-scoped/documents
Authorization: Bearer {token}

# Response should include ONLY documents from:
# - t_hf_sinclair
```

---

## 📝 Important Notes

### 1. Backward Compatibility

The system now handles BOTH:
- **Old schema**: `role: 'super_admin'`
- **New schema**: `platformRole: 'platform_admin'`

### 2. Fallback Check

Email addresses ending in `@intellispec.com` are **automatically** treated as platform admins (safety fallback).

### 3. Multi-Tenant Users

Regular users with access to **multiple tenants** will see documents from **all their tenants**, not just one:

```javascript
// User with memberships to 3 tenants
request.allowedTenants = ['t_pk_inspections', 't_pk_safety', 't_pk_industria']

// Query filters by ALL three tenants
{ tenantId: { $in: ['t_pk_inspections', 't_pk_safety', 't_pk_industria'] } }
```

### 4. Platform Admin Routes

Platform admin routes (`/api/platform/*`) use **different middleware** that ONLY allows platform admins:

```javascript
// Platform admin middleware (more restrictive)
fastify.get('/platform/tenants', {
  preHandler: requirePlatformAdmin  // ONLY platform admins
}, handler);

// Tenant-scoped routes (platform admins + regular users)
fastify.get('/tenant-scoped/documents', {
  preHandler: enforceTenantScope()  // Platform admins see all, users see their tenants
}, handler);
```

---

## 🚨 After Making Changes

**MUST restart the backend server:**

```bash
# Stop server
Ctrl+C

# Start server
node api/server.js
```

Then login again as `superadmin@pksti.com` - you should now see **ALL** documents! 🎉

---

## ✅ Summary

**What was fixed:**
1. ✅ Tenant scope middleware now recognizes `platformRole: 'platform_admin'`
2. ✅ Auth middleware now includes `isPlatformAdmin` in `request.user`
3. ✅ Platform admins bypass all tenant filtering
4. ✅ Regular users still properly scoped to their tenants

**Result:**
- ✅ Platform admins see **ALL data across ALL tenants**
- ✅ Regular users see **ONLY their tenant's data**
- ✅ Multi-tenant users see **ALL their tenants' data**

---

*Implementation completed: October 4, 2025*

