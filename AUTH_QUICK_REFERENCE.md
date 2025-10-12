# 🔐 Auth Services - Quick Reference Card

## 🎯 The Difference in One Sentence

**AuthService** = "WHO ARE YOU?" (verify tokens, load users)  
**AuthorizationService** = "WHAT CAN YOU DO?" (check permissions, validate access)

---

## 📋 When to Use Each

### Use **AuthService** when:
- ✅ Verifying JWT tokens
- ✅ Generating tokens
- ✅ Loading user context from database
- ✅ Handling login/authentication
- ✅ Refreshing tokens

### Use **AuthorizationService** when:
- ✅ Checking if user has permission
- ✅ Validating user roles
- ✅ Checking platform admin status
- ✅ Getting user's tenants
- ✅ Validating tenant access

---

## 💡 Simple Rule

```
Tokens? → AuthService
Permissions? → AuthorizationService
```

---

## 📝 Code Examples

### AuthService (Authentication)
```javascript
// Verify token
const result = await AuthService.authenticate(token);
if (!result.success) {
  return reply.code(401).send({ error: 'Unauthorized' });
}

// Generate token
const token = AuthService.generateToken({
  userId: user.id,
  tenantId: tenant.id
});

// Load user context
const user = await AuthService.loadUserContext(userId, tenantId);
```

### AuthorizationService (Authorization)
```javascript
// Check platform admin
if (AuthorizationService.isPlatformAdmin(user)) {
  // Grant access to all tenants
}

// Check permission
if (!AuthorizationService.hasPermission(user, 'delete_invoices')) {
  return reply.code(403).send({ error: 'Forbidden' });
}

// Check roles
if (AuthorizationService.hasAnyRole(user, ['admin', 'editor'])) {
  // Allow editing
}

// Get user's tenants
const tenants = await AuthorizationService.getUserTenants(userId);

// Check tenant access
const canAccess = await AuthorizationService.hasAccessToTenant(
  userId,
  tenantId
);
```

---

## 📊 Method Cheat Sheet

| Task | Service | Method |
|------|---------|--------|
| Verify JWT | AuthService | `authenticate(token)` |
| Generate token | AuthService | `generateToken(payload)` |
| Refresh token | AuthService | `refreshToken(oldToken)` |
| Load user | AuthService | `loadUserContext(userId, tenantId)` |
| Check admin | AuthorizationService | `isPlatformAdmin(user)` |
| Check permission | AuthorizationService | `hasPermission(user, perm)` |
| Check role | AuthorizationService | `hasAnyRole(user, roles)` |
| Get tenants | AuthorizationService | `getUserTenants(userId)` |
| Check access | AuthorizationService | `hasAccessToTenant(userId, tenantId)` |

---

## 🚫 Common Mistakes

### ❌ WRONG:
```javascript
// Don't use AuthService for permission checks!
if (AuthService.hasPermission(user, 'delete')) { ... }  // ❌ Method doesn't exist!

// Don't use AuthorizationService for tokens!
const token = AuthorizationService.generateToken(payload);  // ❌ Method doesn't exist!
```

### ✅ CORRECT:
```javascript
// Use AuthorizationService for permissions
if (AuthorizationService.hasPermission(user, 'delete')) { ... }  // ✅

// Use AuthService for tokens
const token = AuthService.generateToken(payload);  // ✅
```

---

## 🎓 Remember

**Authentication** = Proving who you are  
**Authorization** = Proving what you're allowed to do

**First authenticate, then authorize!**

---

## 📚 Full Documentation

- **AUTH_CLEANUP_SUMMARY.md** - Detailed guide
- **AUTH_SERVICES_COMPARISON.md** - Complete analysis
- **AUTH_CLEANUP_COMPLETE.md** - Cleanup report
- **AUTH_QUICK_REFERENCE.md** - This card

---

**Updated:** October 4, 2025  
**Status:** ✅ Clean separation achieved

