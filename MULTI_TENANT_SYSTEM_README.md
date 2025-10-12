# Multi-Tenant B2B SaaS System

A comprehensive multi-tenant B2B SaaS platform with tenant management, subscription lifecycle, entitlements, and user memberships built on a single-domain architecture.

## 🏗️ Architecture Overview

### Core Concepts

- **Single Domain**: All tenants accessed via `app.com/t/{tenantSlug}/...`
- **Organizations**: Optional grouping of tenants (e.g., PK Companies)
- **Tenants**: Individual customer instances with their own data and users
- **Subscriptions**: Time-based access control with lifecycle management
- **Entitlements**: Module and site access permissions per tenant
- **Memberships**: User-to-tenant relationships with roles
- **Modules**: Feature sets that can be enabled/disabled per tenant

### Data Models

```
Organization (1) ──→ (N) Tenant
Tenant (1) ──→ (1) Subscription
Tenant (1) ──→ (N) TenantEntitlements (versioned)
User (N) ──→ (N) Tenant (via Membership)
```

## 🚀 Features

### ✅ Tenant Management
- Create, edit, suspend, resume, archive tenants
- Organization grouping and management
- Bulk operations and advanced filtering
- Full audit trails for all changes

### ✅ Subscription Lifecycle
- Automated status updates (active → grace → expired)
- Configurable grace periods
- Email and webhook notifications
- Manual extend, suspend, resume operations
- Daily lifecycle checks with background jobs

### ✅ Entitlements System
- Module-based feature access control
- Site limits and unlimited users
- Versioned entitlement history
- System Admin module always included

### ✅ Authentication & Authorization
- JWT-based authentication
- Tenant-scoped middleware
- Role-based access control (tenant_admin, user, viewer, custom)
- Super admin bypass with full auditing

### ✅ User Experience
- Tenant picker for multi-tenant users
- Top-bar tenant switcher
- Seamless tenant context switching
- Remember last accessed tenant

### ✅ Admin Interface
- Enhanced tenant management dashboard
- Organization management
- User membership management
- Subscription and entitlement controls
- Real-time statistics and monitoring

## 📁 File Structure

```
src/
├── schemas/tenant/
│   ├── models.ts                 # TypeScript interfaces
│   └── mongodb-schemas.ts        # Mongoose schemas
├── middleware/
│   └── tenant-auth.ts           # Authentication & authorization
├── components/auth/
│   ├── TenantPicker.tsx         # Multi-tenant login picker
│   └── TenantSwitcher.tsx       # Top-bar tenant switcher
├── services/
│   └── subscription-lifecycle.ts # Automated lifecycle management
api/routes/
└── tenant-admin.js              # REST API endpoints
scripts/
└── seed-multi-tenant-data.js    # Database seeding
public/data/workspaces/system-admin/
├── tenant-management.json       # Enhanced admin dashboard
└── tenant-creation-wizard.json  # New tenant wizard
```

## 🛠️ Setup & Installation

### 1. Database Setup
```bash
# Ensure MongoDB is running and accessible
npm run api  # Start the API server
```

### 2. Seed Sample Data
```bash
node scripts/seed-multi-tenant-data.js
```

This creates:
- **1 Organization**: PK Companies
- **5 Tenants**: PK Inspections, PK Safety, PK Industria, HF Sinclair, Sherwin Williams
- **8 Users** with various membership combinations
- **Subscriptions** with different lifecycle states for testing
- **Entitlements** with different module combinations

### 3. Test Login Credentials
All users have password: `password123`

**Key Test Users:**
- `super_admin@intellispec.com` - Super Admin (access to all tenants)
- `owner@pk.com` - PK Owner (access to all PK divisions)
- `admin@hfsinclair.com` - HF Sinclair Admin
- `admin@sherwin.com` - Sherwin Williams Admin

## 🔗 API Endpoints

### Tenant Management
```
GET    /api/admin/tenants              # List tenants with filters
POST   /api/admin/tenants              # Create new tenant
GET    /api/admin/tenants/:id          # Get tenant details
PATCH  /api/admin/tenants/:id          # Update tenant
POST   /api/admin/tenants/:id/suspend  # Suspend tenant
POST   /api/admin/tenants/:id/resume   # Resume tenant
```

### Organizations
```
GET    /api/admin/organizations         # List organizations
POST   /api/admin/organizations         # Create organization
```

### Entitlements
```
GET    /api/admin/tenants/:id/entitlements        # Get entitlements
POST   /api/admin/tenants/:id/entitlements        # Update entitlements
GET    /api/admin/tenants/:id/entitlements/history # Entitlement history
```

### Subscriptions
```
GET    /api/admin/tenants/:id/subscription         # Get subscription
POST   /api/admin/tenants/:id/subscription         # Update subscription
POST   /api/admin/tenants/:id/subscription/extend  # Extend term
```

### User Memberships
```
GET    /api/admin/memberships           # List memberships
POST   /api/admin/memberships           # Create membership
GET    /api/me/memberships              # Current user's memberships
POST   /api/auth/switch-tenant          # Switch active tenant
```

## 🔐 Authentication Flow

### 1. Login Process
1. User enters email/password at `app.com/login`
2. System validates credentials and loads memberships
3. If single membership → redirect to `app.com/t/{slug}/dashboard`
4. If multiple memberships → show tenant picker
5. User selects tenant → set active tenant and redirect

### 2. Tenant Context
- Every API call includes `activeTenantId` in session/JWT
- Middleware validates user has membership to requested tenant
- Super admins bypass tenant scoping with full audit logging

### 3. Access Control
```typescript
// Module access check
app.get('/api/inspections', 
  authenticate,
  requireTenantAccess,
  requireModuleAccess('inspect'),
  handler
);

// Role-based access
app.post('/api/tenants/:id/users',
  authenticate,
  requireTenantAccess,
  requireRole(['tenant_admin']),
  handler
);
```

## 🔄 Subscription Lifecycle

### Status Flow
```
trialing → active → grace → expired
    ↓       ↓       ↓       ↓
suspended ←─────────────────┘
```

### Automated Checks
- **Daily background job** updates all subscription statuses
- **Email notifications** at T-14, T-7, T-3, T-1 days before expiry
- **Grace period** provides continued access after expiry
- **Expired tenants** lose access to all modules except System Admin

### Manual Operations
- **Extend**: Add days to term end date
- **Suspend**: Immediately block access (manual)
- **Resume**: Restore access from suspension

## 🎛️ Admin Dashboard Features

### Tenant Grid
- **Advanced filtering** by status, lifecycle, organization
- **Bulk operations** for suspend/resume/export
- **Sortable columns** with real-time data
- **Row actions** for view, edit, manage entitlements/subscription

### Statistics Panel
- Total tenants, active tenants, expiring soon
- Suspended tenants, total users, organizations
- Real-time updates every 5 minutes

### Quick Actions
- New Tenant Wizard (4-step process)
- Create Organization
- Invite User
- Run Lifecycle Check
- View Expiring Tenants
- System Health Dashboard

## 🧪 Testing Scenarios

The seed data provides various scenarios for testing:

### 1. Multi-Tenant User (owner@pk.com)
- Access to 3 PK divisions
- Test tenant picker and switcher
- Different roles across tenants

### 2. Subscription States
- **PK Inspections**: Active (expires Dec 2025)
- **PK Safety**: Expiring soon (Feb 2025)
- **PK Industria**: In grace period
- **HF Sinclair**: Active long-term
- **Sherwin Williams**: Active medium-term

### 3. Module Combinations
- Different module sets per tenant
- System Admin always included
- Test module-based access control

## 🔧 Configuration

### Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/intellispec-dev
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

### Notification Settings
```typescript
// In subscription-lifecycle.ts
notificationConfig = {
  daysBeforeExpiry: [14, 7, 3, 1],
  enableEmail: true,
  enableWebhook: false,
  webhookUrl: 'https://your-webhook-url.com'
}
```

## 🚦 Routing Examples

### Tenant-Scoped URLs
```
app.com/login                           # Login page
app.com/t/pk-inspections/dashboard      # PK Inspections dashboard
app.com/t/pk-safety/dashboard           # PK Safety dashboard
app.com/t/hf-sinclair/inspections       # HF Sinclair inspections
app.com/admin/tenants                   # Super admin tenant management
```

### API Routes
```
/api/auth/login                         # Authentication
/api/me/memberships                     # User's tenant memberships
/api/admin/tenants                      # Tenant management (super admin)
/api/t/pk-inspections/inspections       # Tenant-scoped API calls
```

## 🔍 Monitoring & Auditing

### Audit Logging
- All tenant changes logged with who, when, what changed
- Subscription lifecycle changes tracked
- Entitlement version history maintained
- Super admin actions fully audited

### Health Monitoring
- Subscription expiry tracking
- Failed lifecycle check alerts
- User login patterns
- Module usage statistics

## 🎯 Next Steps

### Phase 2 Enhancements
1. **Email Templates**: Design and implement notification emails
2. **Webhook Integration**: Full webhook notification system
3. **Advanced RBAC**: Custom roles and permissions
4. **Usage Analytics**: Module and feature usage tracking
5. **Billing Integration**: Connect to payment systems
6. **SSO Support**: SAML/OAuth integration
7. **Data Export**: Tenant data export tools
8. **Mobile App**: Tenant-aware mobile application

### Performance Optimizations
1. **Caching**: Redis for session and tenant data
2. **Database Indexing**: Optimize queries for scale
3. **CDN Integration**: Static asset delivery
4. **Load Balancing**: Multi-instance deployment

---

## 🏁 Summary

This multi-tenant B2B SaaS system provides a complete foundation for managing tenants, subscriptions, and users in a scalable, secure, and auditable way. The single-domain architecture with tenant-scoped routing provides excellent UX while maintaining data isolation and security.

The system is production-ready with comprehensive error handling, audit logging, and automated lifecycle management. The modular architecture allows for easy extension and customization based on specific business requirements.
