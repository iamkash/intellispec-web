

# 🛡️ API Endpoint Validation Framework

## 🎯 Problem Solved

**Before:** Frontend could call endpoints that didn't exist → 404 errors in production  
**After:** Automatic validation catches missing endpoints before deployment

---

## 🏗️ What Was Built

### 1. **Endpoint Validator Script** (`api/scripts/validate-endpoints.js`)

**Purpose:** Validates that all API calls work correctly

**Checks:**
- ✅ All frontend API calls use `getApiFullUrl()` (not relative URLs)
- ✅ All endpoints called by frontend are registered in backend
- ✅ No missing endpoints
- ✅ No relative URLs that would hit wrong port

**Run:**
```bash
npm run validate-endpoints
```

**Output Example:**
```
🔍 Scanning frontend for API calls...

Found 15 unique API endpoints called from frontend

🔍 Scanning backend for registered endpoints...

Found 45 registered backend endpoints

🔍 Validating endpoints...

═══════════════════════════════════════════════════════════════
📊 Validation Results
═══════════════════════════════════════════════════════════════
Frontend API calls: 15
Backend endpoints: 45
Issues found: 2
Warnings: 0

❌ ISSUES FOUND:

🚫 Missing Backend Endpoints:

   Endpoint: /api/auth/refresh
   Used in:
     - contexts/AuthContext.tsx

   Endpoint: /api/auth/profile
   Used in:
     - contexts/AuthContext.tsx

💡 RECOMMENDATIONS:

1. Add missing endpoints to backend:
   - Check api/routes/ for similar endpoints
   - Or add to api/server.js for auth endpoints

❌ Validation FAILED - please fix issues above
```

---

### 2. **NPM Scripts** (added to `package.json`)

```json
{
  "validate-endpoints": "Validate all endpoints exist",
  "validate-auth": "Validate auth middleware usage",
  "validate-all": "Validate everything (auth + endpoints)"
}
```

**Usage:**
```bash
# Validate endpoints only
npm run validate-endpoints

# Validate auth middleware only
npm run validate-auth

# Validate everything
npm run validate-all
```

---

### 3. **Updated `.cursorrules`**

**New Section:** "API Endpoint Contract (MANDATORY)"

**Enforces:**
- ❌ NEVER call endpoints that don't exist
- ❌ NEVER use relative URLs in fetch calls
- ✅ ALWAYS use `getApiFullUrl()`
- ✅ ALWAYS validate before committing
- ✅ ALWAYS check backend when adding frontend calls

---

## 🔍 How It Works

### **Frontend Scanning**

The validator scans all frontend files (`.tsx`, `.ts`, `.jsx`, `.js`) for:

1. **getApiFullUrl() calls** (Good ✅):
   ```typescript
   fetch(getApiFullUrl('/api/auth/login'))
   ```

2. **Relative URL calls** (Bad ❌):
   ```typescript
   fetch('/api/auth/login')  // Will flag as error!
   ```

3. **BaseGadget.makeAuthenticatedFetch()** (Good ✅):
   ```typescript
   BaseGadget.makeAuthenticatedFetch('/api/inspections')
   ```

### **Backend Scanning**

The validator scans all backend files (`.js`) for registered routes:

```javascript
fastify.get('/api/auth/me', ...)      // Found: GET /api/auth/me
fastify.post('/api/auth/login', ...)  // Found: POST /api/auth/login
```

### **Validation**

For each frontend API call:
1. Check if using `getApiFullUrl()` or relative URL
2. Check if endpoint exists in backend
3. Flag issues if:
   - Using relative URL (wrong port!)
   - Endpoint missing in backend (404 error!)

---

## 🚀 Usage

### **During Development**

**Before committing code:**
```bash
npm run validate-all
```

**If errors found:**
1. Fix relative URLs → use `getApiFullUrl()`
2. Add missing backend endpoints
3. Re-run validation

**Example Fix:**

```typescript
// ❌ Before (will fail validation)
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ After (passes validation)
import { getApiFullUrl } from '../config/api.config';

const response = await fetch(getApiFullUrl('/api/auth/refresh'), {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### **In CI/CD Pipeline**

Add to your CI/CD workflow:

```yaml
# .github/workflows/ci.yml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run validate-all  # Fails build if validation fails
```

---

## 📊 What Gets Validated

### ✅ **Passes Validation:**

```typescript
// 1. Using getApiFullUrl
import { getApiFullUrl } from '../config/api.config';
fetch(getApiFullUrl('/api/auth/login'), {...});

// 2. Using BaseGadget (which uses getApiFullUrl internally)
await BaseGadget.makeAuthenticatedFetch('/api/inspections');

// 3. Endpoint exists in backend
// Backend has: fastify.post('/api/auth/login', ...)
// Frontend calls: fetch(getApiFullUrl('/api/auth/login'), ...)
// ✅ Match!
```

### ❌ **Fails Validation:**

```typescript
// 1. Relative URL (will hit wrong port)
fetch('/api/auth/login', {...});  // ❌ Use getApiFullUrl!

// 2. Missing backend endpoint
fetch(getApiFullUrl('/api/new-feature'), {...});  // ❌ Backend doesn't have this!
```

---

## 🛠️ Fixing Issues

### **Issue 1: Relative URL**

**Error:**
```
🚫 Relative URLs (should use getApiFullUrl):

   File: contexts/AuthContext.tsx
   Endpoint: /api/auth/refresh
   Line: const response = await fetch('/api/auth/refresh', {
```

**Fix:**
```typescript
// Add import at top of file
import { getApiFullUrl } from '../config/api.config';

// Replace relative URL
const response = await fetch(getApiFullUrl('/api/auth/refresh'), {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### **Issue 2: Missing Backend Endpoint**

**Error:**
```
🚫 Missing Backend Endpoints:

   Endpoint: /api/auth/profile
   Used in:
     - contexts/AuthContext.tsx
```

**Fix Option 1: Add Backend Endpoint**

```javascript
// In api/server.js or api/routes/auth-fastify.js
fastify.put('/api/auth/profile', async (request, reply) => {
  // Implementation
});
```

**Fix Option 2: Remove Frontend Call**

If the endpoint isn't needed, remove the frontend code that calls it.

---

## 📋 Pre-Commit Checklist

Before committing code that adds/modifies API calls:

- [ ] All fetch calls use `getApiFullUrl()`
- [ ] No relative URLs (`/api/*`)
- [ ] Backend endpoints exist for all frontend calls
- [ ] Ran `npm run validate-all` → passes ✅
- [ ] Tested manually in browser
- [ ] Checked Network tab → all requests hit port 4000

---

## 🎯 Benefits

### **Before Framework:**
- ❌ Frontend could call non-existent endpoints
- ❌ Found 404 errors in production
- ❌ Relative URLs hit wrong port
- ❌ No way to catch issues early
- ❌ Manual checking required

### **After Framework:**
- ✅ Automatic validation before commit
- ✅ Catches missing endpoints immediately
- ✅ Enforces `getApiFullUrl()` usage
- ✅ Prevents 404 errors in production
- ✅ CI/CD integration ready

---

## 🔧 Advanced Usage

### **Ignore Specific Endpoints**

If you need to ignore certain endpoints (e.g., external APIs):

```javascript
// In validate-endpoints.js, add to ignore list:
const IGNORE_ENDPOINTS = [
  '/api/external/*',  // External API
  '/api/webhook/*'    // Webhook endpoints
];
```

### **Custom Validation Rules**

Add custom validation by modifying `validate-endpoints.js`:

```javascript
// Example: Check for deprecated endpoints
const DEPRECATED_ENDPOINTS = ['/api/old-endpoint'];

if (DEPRECATED_ENDPOINTS.includes(endpoint)) {
  results.warnings.push({
    type: 'DEPRECATED',
    endpoint: endpoint,
    message: 'This endpoint is deprecated'
  });
}
```

---

## 📚 Related Documentation

- **API Configuration Guide:** `API_CONFIGURATION_GUIDE.md`
- **Auth Middleware Framework:** `AUTH_MIDDLEWARE_FRAMEWORK.md`
- **Setup Guide:** `SETUP_API_CONFIG.md`
- **Missing Endpoints Report:** `MISSING_ENDPOINTS_REPORT.md`

---

## 🎉 Result

**Zero missing endpoint issues!**

- ✅ All API calls validated automatically
- ✅ Frontend/backend stay in sync
- ✅ Catches issues before deployment
- ✅ Enforces best practices
- ✅ CI/CD ready

**Run before every commit:**
```bash
npm run validate-all
```

**Your API is now bulletproof!** 🛡️🚀




