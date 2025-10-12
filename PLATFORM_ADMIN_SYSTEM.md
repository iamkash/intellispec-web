# Platform Admin System

## 🎯 Overview

Implemented a **true platform-level super admin** system that allows designated users to manage the entire multi-tenant platform without requiring individual tenant memberships.

---

## 🏗️ Architecture

### Two-Tier Permission Model

```
┌───────────────────────────────────────────────────────────────┐
│                     PLATFORM LEVEL                            │
│  Role: platform_admin                                         │
│                                                               │
│  ✅ Access ALL tenants (no membership required)              │
│  ✅ Create/delete tenants                                    │
│  ✅ Manage organizations                                     │
│  ✅ View system-wide statistics                              │
│  ✅ Access platform admin routes (/api/platform/*)          │
│                                                               │
│  Users: superadmin@pksti.com, super_admin@intellispec.com    │
└───────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Tenant: HF   │ │ Tenant: PK   │ │ Tenant: SW   │
    │ Sinclair     │ │ Inspections  │ │              │
    │              │ │              │ │              │
    │ Roles:       │ │ Roles:       │ │ Roles:       │
    │ tenant_admin │ │ tenant_admin │ │ tenant_admin │
    │ manager      │ │ manager      │ │ manager      │
    │ user         │ │ user         │ │ user         │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔑 Key Features

### 1. Platform Role Field
- Added `platformRole` field to User schema
- Values: `'platform_admin'`, `'user'`, or `null`
- Platform admins have system-wide privileges

### 2. No Membership Requirement
- Platform admins **do NOT need tenant memberships**
- Can access any tenant directly
- Login works even with zero memberships

### 3. Tenant Discovery
- Platform admins see **ALL active tenants** in dropdown
- Regular users only see tenants they have membership to
- API endpoint: `GET /api/tenants/discover`

### 4. Protected Platform Routes
- New middleware: `requirePlatformAdmin`
- Routes under `/api/platform/*` require platform_admin role
- Verified via JWT token

### 5. Platform Management API
- `GET /api/platform/tenants` - List all tenants
- `POST /api/platform/tenants` - Create new tenant
- `PUT /api/platform/tenants/:id` - Update tenant
- `DELETE /api/platform/tenants/:id` - Delete/deactivate tenant
- `GET /api/platform/stats` - System-wide statistics

---

## 📁 Files Created/Modified

### Created Files

1. **`api/middleware/platform-admin.js`**
   - Middleware to verify platform_admin role
   - Checks JWT token for platformRole
   - Returns 403 if not platform admin

2. **`api/routes/platform-admin.js`**
   - Platform management routes
   - Create/update/delete tenants
   - View system statistics
   - All routes protected by platform admin middleware

### Modified Files

3. **`scripts/seed-multi-tenant-data.js`**
   - Added `platformRole` field to User model
   - Marked super admins with `platformRole: 'platform_admin'`
   - Updated seed summary message

4. **`api/server.js`**
   - Updated login authentication logic
   - Platform admins bypass membership checks
   - Auto-assign first tenant if none specified
   - Include `platformRole` and `isPlatformAdmin` in JWT and response
   - Updated `/api/auth/me` endpoint
   - Registered platform admin routes

5. **`api/routes/tenants.js`**
   - Updated tenant discovery endpoint
   - Platform admins see ALL active tenants
   - Regular users see only their memberships

---

## 🔐 Authentication Flow

### Platform Admin Login

```javascript
POST /api/auth/login
{
  "email": "superadmin@pksti.com",
  "password": "Admin@12345",
  "tenantSlug": null  // Optional - can be any tenant
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "u_superadmin_pksti",
    "email": "superadmin@pksti.com",
    "name": "PKSTI Super Admin",
    "platformRole": "platform_admin",   // ← Platform admin flag
    "isPlatformAdmin": true,            // ← Boolean for easy checking
    "tenantSlug": "hf-sinclair",        // First active tenant
    "tenantId": "t_hf_sinclair",
    "tenantName": "HF Sinclair"
  }
}
```

### Regular User Login

```javascript
POST /api/auth/login
{
  "email": "admin@hfsinclair.com",
  "password": "password123",
  "tenantSlug": "hf-sinclair"  // Must match membership
}

Response:
{
  "user": {
    "platformRole": "user",             // ← Regular user
    "isPlatformAdmin": false,
    "roles": ["tenant_admin"],          // Tenant-specific role
    "tenantSlug": "hf-sinclair"
  }
}
```

---

## 🚀 Platform Admin API Usage

### List All Tenants

```bash
GET /api/platform/tenants
Authorization: Bearer {platform_admin_jwt}

Response:
{
  "tenants": [
    {
      "id": "t_hf_sinclair",
      "name": "HF Sinclair",
      "slug": "hf-sinclair",
      "status": "active",
      "plan": "IntelliEnterprise",
      "subscription": { ... },
      "entitlements": { ... }
    },
    ...
  ],
  "pagination": {
    "total": 6,
    "limit": 100,
    "skip": 0,
    "hasMore": false
  }
}
```

### Create New Tenant

```bash
POST /api/platform/tenants
Authorization: Bearer {platform_admin_jwt}
Content-Type: application/json

{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "plan": "IntelliFlex",
  "tenantType": "facility-based",
  "maxFacilities": 10,
  "modules": ["system", "inspect", "track"],
  "trialEnabled": true,
  "trialDays": 30
}

Response:
{
  "message": "Tenant created successfully",
  "tenant": {
    "id": "t_1234567890_xyz",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "status": "active",
    "subscription": { ... },
    "entitlements": { ... }
  }
}
```

### Get Platform Statistics

```bash
GET /api/platform/stats
Authorization: Bearer {platform_admin_jwt}

Response:
{
  "tenants": {
    "total": 7,
    "active": 6,
    "suspended": 0,
    "inactive": 1
  },
  "users": {
    "total": 10,
    "platformAdmins": 2
  }
}
```

---

## 🧪 Testing

### Test Platform Admin Login

```bash
# Platform admin can login with ANY tenant or NO tenant
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@pksti.com",
    "password": "Admin@12345",
    "tenantSlug": "hf-sinclair"
  }'

# Or without specifying tenant
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@pksti.com",
    "password": "Admin@12345"
  }'
```

### Test Tenant Discovery

```bash
# Platform admin sees ALL tenants
curl http://localhost:4000/api/tenants/discover?email=superadmin@pksti.com

Response:
{
  "tenants": [
    { "slug": "demo-trial", "name": "Demo Trial Account" },
    { "slug": "hf-sinclair", "name": "HF Sinclair" },
    { "slug": "pk-industria", "name": "PK Industria" },
    { "slug": "pk-inspections", "name": "PK Inspections" },
    { "slug": "pk-safety", "name": "PK Safety" },
    { "slug": "sherwin-williams", "name": "Sherwin Williams" }
  ],
  "isPlatformAdmin": true
}
```

### Test Platform Admin Routes

```bash
# Get platform stats (requires platform_admin role)
curl http://localhost:4000/api/platform/stats \
  -H "Authorization: Bearer {jwt_token}"

# Regular user will get 403 Forbidden
```

---

## 🔒 Security

### JWT Token Contents

```javascript
{
  "userId": "u_superadmin_pksti",
  "tenantId": "t_hf_sinclair",
  "tenantSlug": "hf-sinclair",
  "email": "superadmin@pksti.com",
  "platformRole": "platform_admin",  // ← Used for authorization
  "iss": "intellispec-auth",
  "aud": "hf-sinclair",
  "exp": 1234567890
}
```

### Middleware Protection

```javascript
// Platform admin routes are protected
fastify.get('/platform/tenants', {
  preHandler: requirePlatformAdmin  // ← Verifies platformRole
}, async (request, reply) => {
  // Only platform admins can reach here
});
```

---

## 📊 Database Schema

### User Document (with platformRole)

```javascript
{
  "_id": ObjectId("..."),
  "id": "u_superadmin_pksti",
  "email": "superadmin@pksti.com",
  "password": "$2a$12$...",
  "name": "PKSTI Super Admin",
  "status": "active",
  "platformRole": "platform_admin",  // ← NEW FIELD
  "createdAt": ISODate("2025-10-04"),
  "updatedAt": ISODate("2025-10-04")
}
```

### No Memberships Required

```javascript
// Platform admins work WITHOUT any memberships
db.memberships.find({ userId: "u_superadmin_pksti" })
// Returns: [] (empty) - This is OK! ✅
```

---

## 🎯 Use Cases

### Platform Admin Can:
1. ✅ Login without specifying tenant
2. ✅ Login to ANY tenant (even without membership)
3. ✅ See ALL tenants in discovery dropdown
4. ✅ Create new tenants via API
5. ✅ Delete/suspend tenants
6. ✅ View system-wide statistics
7. ✅ Manage any tenant's data
8. ✅ Switch between tenants freely

### Regular User Can:
1. ✅ Login only to tenants they have membership in
2. ✅ See only their assigned tenants in dropdown
3. ❌ Cannot access platform admin routes
4. ❌ Cannot create tenants
5. ❌ Cannot view other tenants' data

---

## 🔄 Migration Summary

**What Changed:**
1. ✅ Added `platformRole` field to User schema
2. ✅ Updated authentication logic to bypass memberships for platform admins
3. ✅ Created platform admin middleware
4. ✅ Created platform management API
5. ✅ Updated tenant discovery for platform admins

**What Stayed the Same:**
- Regular users still use membership-based access
- Tenant-level roles (tenant_admin, manager, user) unchanged
- Existing authentication for regular users works as before

---

## 📝 Credentials

### Platform Admins (password: `Admin@12345`)
- `superadmin@pksti.com` - Access to ALL tenants
- `super_admin@intellispec.com` - Access to ALL tenants

### Tenant Users (password: `password123`)
- `admin@hfsinclair.com` - HF Sinclair only
- `admin@sherwin.com` - Sherwin Williams only
- `owner@pk.com` - 3 PK tenants only

---

## 🚨 IMPORTANT: Restart Backend Server

**All changes require server restart to take effect:**

```bash
# Stop current server
Ctrl+C

# Restart server
node api/server.js
```

---

## ✅ Verification Checklist

- [x] `platformRole` field added to User schema
- [x] Super admins marked with `platformRole: 'platform_admin'`
- [x] Authentication bypasses memberships for platform admins
- [x] Tenant discovery shows ALL tenants for platform admins
- [x] Platform admin middleware created
- [x] Platform management routes created
- [x] JWT includes platformRole
- [x] `/api/auth/me` returns isPlatformAdmin flag
- [x] Database updated with platform roles

---

*Implementation completed: October 4, 2025*

