# 🔐 Centralized Authentication Middleware Framework

## 📋 Overview

**Problem Solved:** Prevents authentication bugs caused by custom/inconsistent middleware implementations across routes.

**Solution:** Single source of truth for ALL authentication logic in `api/core/AuthMiddleware.js`.

---

## 🎯 Core Principles

### 1. **Single Source of Truth**
- ✅ ALL authentication logic lives in `api/core/AuthMiddleware.js`
- ❌ NO custom auth implementations in route files
- ❌ NO JWT verification in routes
- ❌ NO database lookups for platform admin checks

### 2. **Trust the JWT**
- Platform admins have `platformRole: "platform_admin"` in JWT
- No database lookup needed - JWT is cryptographically signed
- Fast and secure

### 3. **Consistent Error Handling**
- Uses `AuthenticationError` (401) and `AuthorizationError` (403)
- Standard error codes and messages
- Proper logging

---

## 🚀 Usage

### Basic Authentication

```javascript
const { requireAuth } = require('../core/AuthMiddleware');

fastify.get('/api/data', { preHandler: requireAuth }, async (request, reply) => {
  // request.user is populated with:
  // {
  //   userId: string,
  //   email: string,
  //   tenantId: string,
  //   tenantSlug: string,
  //   platformRole: string,
  //   roles: string[]
  // }
  
  return reply.send({ data: 'protected data', user: request.user });
});
```

### Platform Admin Only

```javascript
const { requirePlatformAdmin } = require('../core/AuthMiddleware');

fastify.get('/api/admin/tenants/stats', { preHandler: requirePlatformAdmin }, async (request, reply) => {
  // Only users with platformRole: "platform_admin" can access
  // request.user.isPlatformAdmin === true
  
  return reply.send({ stats: {...} });
});
```

### Tenant Admin

```javascript
const { requireTenantAdmin } = require('../core/AuthMiddleware');

fastify.post('/api/tenant/settings', { preHandler: requireTenantAdmin }, async (request, reply) => {
  // Platform admins OR tenant admins can access
  // request.user.isTenantAdmin === true
  
  return reply.send({ success: true });
});
```

### Optional Authentication

```javascript
const { optionalAuth } = require('../core/AuthMiddleware');

fastify.get('/api/content', { preHandler: optionalAuth }, async (request, reply) => {
  // Works with or without authentication
  // request.user is populated if token provided, null otherwise
  
  const isAuthenticated = request.user !== null;
  return reply.send({ content: '...', isAuthenticated });
});
```

### Permission-Based

```javascript
const { requirePermission } = require('../core/AuthMiddleware');

// Single permission
fastify.get('/api/users', { 
  preHandler: requirePermission('users.view') 
}, async (request, reply) => {
  return reply.send({ users: [...] });
});

// Multiple permissions (any of)
fastify.delete('/api/users/:id', {
  preHandler: requirePermission(['users.delete', 'admin.all'])
}, async (request, reply) => {
  return reply.send({ success: true });
});
```

### Combine Multiple Checks

```javascript
const { combineMiddleware, requireAuth, checkRateLimit } = require('../core/AuthMiddleware');

const protect = combineMiddleware(requireAuth, checkRateLimit);

fastify.post('/api/action', { preHandler: protect }, async (request, reply) => {
  return reply.send({ success: true });
});
```

---

## 📚 Available Middleware

| Middleware | Purpose | JWT Required | Checks |
|------------|---------|--------------|--------|
| `requireAuth` | Basic authentication | ✅ | Token valid |
| `requirePlatformAdmin` | Platform admin only | ✅ | `platformRole === "platform_admin"` |
| `requireTenantAdmin` | Tenant or platform admin | ✅ | Tenant admin role OR platform admin |
| `optionalAuth` | Optional authentication | ❌ | Token valid (if provided) |
| `requirePermission(perms)` | Permission-based | ✅ | Has required permission(s) |
| `combineMiddleware(...fns)` | Multiple checks | Varies | All combined checks pass |

---

## 🔄 Migration Guide

### Step 1: Run Migration Script

```bash
node api/scripts/migrate-to-central-auth.js
```

This automatically:
- Adds AuthMiddleware imports
- Removes custom auth implementations
- Updates middleware references
- Creates backups of all modified files

### Step 2: Validate Changes

```bash
node api/scripts/validate-auth-middleware.js
```

This checks:
- All routes import from AuthMiddleware
- No custom auth implementations exist
- Routes have proper authentication
- Unknown middleware usage

### Step 3: Manual Review

Review files with warnings and fix any issues:
- Routes missing authentication
- Unknown middleware references
- Custom JWT verification code

### Step 4: Test

```bash
# Start API server
node api/server.js

# Test endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/admin/tenants/stats
```

---

## ❌ Anti-Patterns (Don't Do This!)

### ❌ Custom Auth Middleware

```javascript
// BAD - Custom implementation
const requireSuperAdmin = async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.verify(token, secret);
  
  if (decoded.platformRole !== 'platform_admin') {
    return reply.code(403).send({ error: 'Access denied' });
  }
  
  request.user = decoded;
};
```

### ❌ JWT Verification in Routes

```javascript
// BAD - Manual JWT handling
fastify.get('/route', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Do something...
});
```

### ❌ Database Lookups for Platform Admin

```javascript
// BAD - Unnecessary DB query
const user = await UserModel.findOne({ userId: decoded.userId });
if (!user.isPlatformAdmin) {
  return reply.code(403).send({ error: 'Access denied' });
}
```

### ❌ Using Decorators

```javascript
// BAD - Decorator not registered
const requireSuperAdmin = fastify.verifySuperAdmin || (() => {
  logger.warn('Middleware not loaded');
});
```

---

## ✅ Best Practices

### 1. **Import at Top of File**

```javascript
const { requireAuth, requirePlatformAdmin, requireTenantAdmin } = require('../core/AuthMiddleware');
const { logger } = require('../core/Logger');
// ... other imports

async function registerMyRoutes(fastify) {
  // Use middleware here
}
```

### 2. **Use preHandler**

```javascript
// ✅ GOOD
fastify.get('/route', { preHandler: requireAuth }, async (req, reply) => {...});

// ❌ BAD - Manual check
fastify.get('/route', async (req, reply) => {
  if (!req.headers.authorization) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  // ...
});
```

### 3. **Don't Check platformRole Manually**

```javascript
// ✅ GOOD - Middleware handles it
fastify.get('/admin/route', { preHandler: requirePlatformAdmin }, async (req, reply) => {
  // Platform admin guaranteed here
});

// ❌ BAD - Manual check
fastify.get('/admin/route', { preHandler: requireAuth }, async (req, reply) => {
  if (req.user.platformRole !== 'platform_admin') {
    return reply.code(403).send({ error: 'Access denied' });
  }
  // ...
});
```

### 4. **Use Appropriate Error Types**

```javascript
const { AuthenticationError, AuthorizationError } = require('../core/ErrorHandler');

// ✅ GOOD
if (!user) {
  throw new AuthenticationError('Invalid credentials');
}

if (!hasPermission) {
  throw new AuthorizationError('Insufficient privileges');
}

// ❌ BAD
if (!user) {
  return reply.code(401).send({ error: 'Invalid credentials' });
}
```

---

## 🧪 Testing

### Unit Test Example

```javascript
const { requirePlatformAdmin } = require('../core/AuthMiddleware');
const jwt = require('jsonwebtoken');

describe('AuthMiddleware', () => {
  it('should allow platform admin', async () => {
    const token = jwt.sign(
      { userId: 'admin', platformRole: 'platform_admin' },
      process.env.JWT_SECRET
    );
    
    const request = {
      headers: { authorization: `Bearer ${token}` }
    };
    
    const reply = { code: jest.fn(() => reply), send: jest.fn() };
    
    await requirePlatformAdmin(request, reply);
    
    expect(request.user).toBeDefined();
    expect(request.user.isPlatformAdmin).toBe(true);
    expect(reply.code).not.toHaveBeenCalled();
  });
  
  it('should reject non-admin', async () => {
    const token = jwt.sign(
      { userId: 'user', platformRole: 'user' },
      process.env.JWT_SECRET
    );
    
    const request = {
      headers: { authorization: `Bearer ${token}` }
    };
    
    const reply = { code: jest.fn(() => reply), send: jest.fn() };
    
    await requirePlatformAdmin(request, reply);
    
    expect(reply.code).toHaveBeenCalledWith(403);
  });
});
```

### Integration Test

```javascript
// In your test file
const response = await fastify.inject({
  method: 'GET',
  url: '/api/admin/tenants/stats',
  headers: {
    authorization: `Bearer ${platformAdminToken}`
  }
});

expect(response.statusCode).toBe(200);
expect(response.json()).toHaveProperty('stats');
```

---

## 📋 Pre-Commit Checklist

Before committing route changes:

- [ ] All routes import from `api/core/AuthMiddleware.js`
- [ ] No custom auth implementations
- [ ] No JWT verification in routes
- [ ] No database lookups for platform admin checks
- [ ] Validation script passes: `node api/scripts/validate-auth-middleware.js`
- [ ] All tests pass
- [ ] Manual testing completed

---

## 🔧 Troubleshooting

### Issue: 401 Unauthorized

**Check:**
1. JWT token is valid and not expired
2. `Authorization: Bearer <token>` header format correct
3. JWT_SECRET matches between login and verification
4. Token contains required fields (userId, platformRole, etc.)

### Issue: 403 Forbidden

**Check:**
1. User has correct `platformRole` in JWT
2. Using appropriate middleware (`requirePlatformAdmin` vs `requireAuth`)
3. User has required permissions (if using `requirePermission`)

### Issue: Routes not using centralized middleware

**Run:**
```bash
node api/scripts/validate-auth-middleware.js
```

**Then fix issues:**
```bash
node api/scripts/migrate-to-central-auth.js
```

---

## 📞 Support

**Questions?** Check:
1. This document
2. `.cursorrules` - Authentication Middleware section
3. `api/core/AuthMiddleware.js` - Source code with JSDoc
4. `api/scripts/validate-auth-middleware.js` - Validation logic

**Report Issues:**
- Add to project issue tracker
- Include: route file, error message, JWT payload (redacted)

---

## 🎉 Benefits

✅ **Consistency** - All routes use same auth logic  
✅ **Security** - No bugs from custom implementations  
✅ **Performance** - No unnecessary DB lookups  
✅ **Maintainability** - Single place to update auth logic  
✅ **Testability** - Centralized middleware easy to test  
✅ **Debugging** - Standard error messages and logging  

**Result: Zero authentication bugs in the future!** 🚀




