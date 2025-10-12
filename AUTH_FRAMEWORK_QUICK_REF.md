# 🛡️ Auth Framework - Quick Reference

## 📦 What Was Created

```
intellispec-web/
├── api/
│   ├── core/
│   │   └── AuthMiddleware.js           ⭐ Framework (use this!)
│   └── scripts/
│       ├── validate-auth-middleware.js  🔍 Validation tool
│       └── migrate-to-central-auth.js   🔄 Migration tool
├── AUTH_MIDDLEWARE_FRAMEWORK.md         📖 Complete guide
├── FRAMEWORK_LEVEL_AUTH_SOLUTION.md     📖 Implementation details
├── FRAMEWORK_SOLUTION_SUMMARY.md        📖 Summary
├── AUTH_FRAMEWORK_QUICK_REF.md          📋 This file
├── .cursorrules                         ⚙️ Updated (enforces patterns)
└── package.json                         ⚙️ Updated (added scripts)
```

---

## 🚀 Quick Start

### Import Framework
```javascript
const { requirePlatformAdmin } = require('../core/AuthMiddleware');
```

### Protect Route
```javascript
fastify.get('/admin/route', { preHandler: requirePlatformAdmin }, async (req, reply) => {
  // req.user.isPlatformAdmin === true
  return reply.send({ data: 'protected' });
});
```

### Validate
```bash
npm run validate-auth
```

---

## 🎯 Available Middleware

| Middleware | Auth Required | Use Case |
|------------|---------------|----------|
| `requireAuth` | ✅ | Any authenticated user |
| `requirePlatformAdmin` | ✅ | Platform admins only |
| `requireTenantAdmin` | ✅ | Tenant or platform admins |
| `optionalAuth` | ❌ | Optional (user may be null) |
| `requirePermission('users.view')` | ✅ | Permission-based |

---

## 📝 NPM Scripts

```bash
npm run validate-auth    # Check all routes
npm run migrate-auth     # Fix existing routes
```

---

## ❌ Don't Do This

```javascript
// ❌ Custom auth
const requireSuperAdmin = async (req, reply) => {
  const decoded = jwt.verify(token, secret);
  // ...
};

// ❌ Manual JWT check
const token = req.headers.authorization;
jwt.verify(token, secret);

// ❌ Old import
const { verifyPlatformAdmin } = require('../middleware/platform-admin');
```

---

## ✅ Do This

```javascript
// ✅ Use framework
const { requirePlatformAdmin } = require('../core/AuthMiddleware');

fastify.get('/admin/route', { preHandler: requirePlatformAdmin }, ...);
```

---

## 🔍 Debugging

**Check validation:**
```bash
npm run validate-auth
```

**Check logs:**
```
[Auth] User authenticated { userId, tenantId, platformRole }
[Auth] Platform admin authenticated { userId, email }
```

**Check JWT:**
```javascript
// In browser console
const token = localStorage.getItem('token');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(decoded.platformRole); // Should be "platform_admin"
```

---

## 📚 Full Docs

- **Usage Guide:** `AUTH_MIDDLEWARE_FRAMEWORK.md`
- **Implementation:** `FRAMEWORK_LEVEL_AUTH_SOLUTION.md`
- **Summary:** `FRAMEWORK_SOLUTION_SUMMARY.md`
- **Source Code:** `api/core/AuthMiddleware.js`

---

## 🎯 Pre-Commit

```bash
npm run validate-auth && git commit
```

---

## 🎉 That's It!

**Import → Protect → Validate → Commit**

Simple, secure, bulletproof! 🛡️✨




