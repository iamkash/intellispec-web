# Tenant Discovery Implementation

## 🎯 Overview

Implemented email-based tenant discovery with dropdown fallback and localStorage persistence for the login flow. This provides a seamless multi-tenant login experience where users don't need to know their tenant slug upfront.

---

## ✨ Features Implemented

### 1. **Email-Based Tenant Discovery**
   - When user enters email and tabs out, system automatically discovers their tenant(s)
   - Looks up user by email and finds all tenants they have access to
   - Falls back to domain-based matching if direct user lookup fails

### 2. **localStorage Persistence**
   - Remembers tenant selection per email address
   - Key format: `intellispec_tenant_{email}`
   - Next time user logs in with same email, dropdown is skipped

### 3. **Smart Dropdown Selector**
   - Only shows if user has access to multiple tenants
   - Auto-selects if only one tenant found
   - Beautiful UI with organization names and slugs

### 4. **Visual Feedback**
   - "Finding your organization..." loading indicator during discovery
   - Success indicator showing selected organization
   - Clean, professional styling using shadcn tokens

### 5. **Fallback Strategies**
   - Subdomain detection for production (`tenant.intellispec.com`)
   - Query parameter for development (`localhost:3000?tenant=hf-sinclair`)
   - Email domain matching for enterprise customers

---

## 📁 Files Modified

### Frontend
1. **`src/components/auth/LoginShell.tsx`**
   - Added tenant discovery state management
   - Added `discoverTenantByEmail()` function
   - Added `getRememberedTenant()` and `rememberTenant()` for localStorage
   - Added tenant selector dropdown UI
   - Added loading and success indicators
   - Added CSS styles for all new components

2. **`src/styles/globals.css`**
   - Added `--success` and `--warning` color variables
   - Added `--success-foreground` and `--warning-foreground` for text

### Backend
3. **`api/routes/tenants.js`** (NEW)
   - `/api/tenants/discover` - Discovers tenant(s) by email
   - `/api/tenants` - Lists all tenants
   - `/api/tenants/:slugOrId` - Gets specific tenant details
   - Implements three discovery strategies:
     1. User email lookup → find memberships → find tenants
     2. Email domain matching (e.g., @hfsinclair.com → hf-sinclair)
     3. 404 if no tenant found

4. **`api/server.js`**
   - Registered tenant routes at `/api/tenants/*`

5. **`scripts/seed-multi-tenant-data.js`**
   - Fixed: Added `password` field to UserModel schema
   - Users now properly store hashed passwords

---

## 🔄 Discovery Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters email                                         │
│    admin@hfsinclair.com                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check localStorage                                        │
│    Key: intellispec_tenant_admin@hfsinclair.com             │
└──────────────────────┬──────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
         Found                 Not Found
            │                     │
            ▼                     ▼
   ┌────────────────┐   ┌────────────────────────┐
   │ Auto-select    │   │ Call API:              │
   │ remembered     │   │ GET /api/tenants/      │
   │ tenant         │   │     discover           │
   └────────────────┘   │ ?email=admin@hf...     │
                        └───────────┬─────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
            Single Tenant    Multiple Tenants    No Tenant
                  │                 │                 │
                  ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ Auto-select  │  │ Show dropdown│  │ Show error   │
          │ Save to      │  │ Let user     │  │ Contact      │
          │ localStorage │  │ choose       │  │ admin        │
          └──────────────┘  └──────┬───────┘  └──────────────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ User selects   │
                          │ Save to        │
                          │ localStorage   │
                          └────────────────┘
```

---

## 🧪 Testing

### Test Data Available

According to your seed script, these users are available:

| Email | Password | Tenant Access | Tenant Slug |
|-------|----------|---------------|-------------|
| `admin@hfsinclair.com` | `password123` | HF Sinclair | `hf-sinclair` |
| `admin@sherwin.com` | `password123` | Sherwin Williams | `sherwin-williams` |
| `super_admin@intellispec.com` | `password123` | All tenants (6) | Multiple |
| `owner@pk.com` | `password123` | PK Inspections, PK Safety, PK Industria | Multiple |

### Test Scenarios

#### ✅ Scenario 1: Single Tenant User
```
1. Navigate to http://localhost:3000
2. Enter email: admin@hfsinclair.com
3. Tab out of email field
4. ✅ Should show "Finding your organization..."
5. ✅ Should auto-select "HF Sinclair" tenant
6. ✅ Should show success indicator
7. Enter password: password123
8. Click Sign In
9. ✅ Should login successfully
```

#### ✅ Scenario 2: Multiple Tenant User
```
1. Navigate to http://localhost:3000
2. Enter email: owner@pk.com
3. Tab out of email field
4. ✅ Should show dropdown with:
   - PK Inspections
   - PK Safety
   - PK Industria
5. Select "PK Inspections"
6. Enter password: password123
7. Click Sign In
8. ✅ Should login successfully
```

#### ✅ Scenario 3: Remember Tenant (localStorage)
```
1. Login as admin@hfsinclair.com (first time)
2. Logout
3. Return to login page
4. Enter email: admin@hfsinclair.com
5. Tab out
6. ✅ Should INSTANTLY show "HF Sinclair" (no API call)
7. ✅ No dropdown shown
8. Complete login
```

#### ✅ Scenario 4: Development Mode with Query Param
```
1. Navigate to http://localhost:3000?tenant=hf-sinclair
2. ✅ Tenant should be pre-selected
3. Enter credentials
4. Login
```

#### ✅ Scenario 5: Clear localStorage
```
1. Open DevTools → Application → Local Storage
2. Find key: intellispec_tenant_admin@hfsinclair.com
3. Delete it
4. Refresh page
5. Enter email: admin@hfsinclair.com
6. ✅ Should trigger API call again
7. ✅ Should show dropdown again
```

---

## 🔐 API Endpoints

### `GET /api/tenants/discover`

**Query Params:**
- `email` (required) - User's email address
- `domain` (optional) - Email domain

**Response Formats:**

**Single Tenant Found:**
```json
{
  "tenantSlug": "hf-sinclair",
  "tenantName": "HF Sinclair"
}
```

**Multiple Tenants:**
```json
{
  "tenants": [
    { "slug": "pk-inspections", "name": "PK Inspections" },
    { "slug": "pk-safety", "name": "PK Safety" },
    { "slug": "pk-industria", "name": "PK Industria" }
  ]
}
```

**No Tenant Found:**
```json
{
  "error": "No organization found for this email address",
  "suggestion": "Please contact your administrator for access"
}
```

---

## 🎨 UI Components

### Tenant Discovery Indicator
```tsx
{isDiscoveringTenant && (
  <div className="tenant-discovery-indicator">
    <span className="discovery-spinner"></span>
    <span className="discovery-text">Finding your organization...</span>
  </div>
)}
```

### Tenant Selector Dropdown
```tsx
{showTenantSelector && availableTenants.length > 0 && (
  <div className="tenant-selector-container">
    <label htmlFor="tenant-selector">Select Your Organization</label>
    <select
      id="tenant-selector"
      value={tenantDiscovered || ''}
      onChange={(e) => handleTenantSelect(e.target.value)}
    >
      <option value="">-- Select Organization --</option>
      {availableTenants.map((tenant) => (
        <option key={tenant.slug} value={tenant.slug}>
          {tenant.name}
        </option>
      ))}
    </select>
    <p className="tenant-selector-hint">
      You have access to multiple organizations. Please select one to continue.
    </p>
  </div>
)}
```

### Success Indicator
```tsx
{tenantDiscovered && !showTenantSelector && formData['email'] && (
  <div className="tenant-confirmed-indicator">
    <svg className="tenant-icon">...</svg>
    <span className="tenant-name">
      Organization: <strong>{availableTenants.find(...)?.name}</strong>
    </span>
  </div>
)}
```

---

## 📝 localStorage Keys

| Key Pattern | Value | Example |
|-------------|-------|---------|
| `intellispec_tenant_{email}` | Tenant slug | `hf-sinclair` |

**Example:**
```javascript
localStorage.setItem(
  'intellispec_tenant_admin@hfsinclair.com',
  'hf-sinclair'
);
```

---

## 🐛 Troubleshooting

### Issue: "Invalid credentials" error
**Solution:** User model was missing `password` field. This has been fixed in the seed script. Re-run:
```bash
node scripts/seed-multi-tenant-data.js
```

### Issue: Dropdown doesn't show
**Cause:** User has access to only one tenant (expected behavior)  
**Solution:** Use a multi-tenant user like `owner@pk.com` or `super_admin@intellispec.com`

### Issue: Tenant not discovered
**Causes:**
1. User doesn't exist in database
2. User has no memberships
3. Email domain doesn't match any tenant

**Solution:** Check database:
```javascript
db.users.findOne({ email: "admin@hfsinclair.com" })
db.memberships.find({ userId: "u_hf_admin" })
db.tenants.find({ id: "t_hf_sinclair" })
```

### Issue: localStorage not working
**Cause:** Browser privacy/incognito mode  
**Solution:** Use normal browsing mode or check browser settings

---

## 🚀 Next Steps / Future Enhancements

1. **Add "Change Organization" link** in the UI for multi-tenant users
2. **Add tenant branding** - Load tenant-specific logos/colors
3. **Add SSO support** - SAML/OAuth integration per tenant
4. **Add tenant invite system** - Allow admins to invite users
5. **Add tenant switcher** in the app (after login) for multi-tenant users
6. **Add audit logging** for tenant discovery attempts
7. **Add rate limiting** on discovery endpoint
8. **Add analytics** - Track which discovery method is most used

---

## 📚 Related Documentation

- [Multi-Tenant System README](MULTI_TENANT_SYSTEM_README.md)
- [Authentication Setup](AUTHENTICATION_SETUP.md)
- [Tenant Admin Creation and Scoping](TENANT_ADMIN_CREATION_AND_SCOPING.md)

---

## ✅ Summary

**What was fixed:**
1. ✅ Added `password` field to User model schema
2. ✅ Implemented email-based tenant discovery
3. ✅ Added dropdown for multi-tenant users
4. ✅ Implemented localStorage persistence
5. ✅ Added visual feedback (loading, success indicators)
6. ✅ Created backend API endpoints
7. ✅ Added proper styling using shadcn tokens
8. ✅ Added success/warning color variables to theme

**You can now login as:**
- `admin@hfsinclair.com` / `password123` ✅
- `admin@sherwin.com` / `password123` ✅
- `owner@pk.com` / `password123` (will show dropdown) ✅

**Development URL:**
```
http://localhost:3000?tenant=hf-sinclair
```

**Production URL (future):**
```
https://hf-sinclair.intellispec.com
```

---

*Implementation completed: October 4, 2025*

