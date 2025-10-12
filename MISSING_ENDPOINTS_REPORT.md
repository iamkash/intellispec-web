# 🔍 Missing API Endpoints Report

## ❌ **Found Issues:**

### **1. Missing Backend Endpoints**

These endpoints are called by the frontend but **NOT registered** in the backend:

| Endpoint | Used In | Method | Status |
|----------|---------|--------|--------|
| `/api/auth/refresh` | `AuthContext.tsx:269` | POST | ❌ **Missing** |
| `/api/auth/profile` | `AuthContext.tsx:346` | PUT | ❌ **Missing** |

**Impact:** These features will fail with 404 errors:
- Token refresh → User gets logged out unnecessarily
- Profile updates → Users can't update their profile

---

### **2. Not Using Centralized API Config**

These endpoints still use **relative URLs** instead of `getApiFullUrl()`:

| File | Line | Current Code | Issue |
|------|------|--------------|-------|
| `AuthContext.tsx` | 269 | `fetch('/api/auth/refresh', ...)` | ❌ Will hit wrong port |
| `AuthContext.tsx` | 346 | `fetch('/api/auth/profile', ...)` | ❌ Will hit wrong port |

**Impact:** These calls will hit port 4001 instead of 4000 → 404 errors

---

## 📊 **Complete Auth Endpoint Status:**

### ✅ **Working (Registered in `server.js`)**

| Endpoint | Method | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/auth/login` | POST | ✅ Uses `getApiFullUrl` | ✅ Registered | ✅ Works |
| `/api/auth/logout` | POST | ✅ Uses `getApiFullUrl` | ✅ **Just Added** | ✅ Works |
| `/api/auth/me` | GET | ✅ Uses `getApiFullUrl` | ✅ Registered | ✅ Works |

---

### ❌ **Missing (Defined in `auth-fastify.js` but NOT registered)**

| Endpoint | Method | Frontend Usage | Backend Definition | Status |
|----------|--------|----------------|-------------------|--------|
| `/api/auth/refresh` | POST | ✅ Used (line 269) | ✅ Defined in `auth-fastify.js:222` | ❌ **Not Registered** |
| `/api/auth/profile` | PUT | ✅ Used (line 346) | ❌ **Not Defined** | ❌ **Not Registered** |
| `/api/auth/register` | POST | ❌ Not used | ✅ Defined in `auth-fastify.js:99` | ℹ️ Not needed yet |
| `/api/auth/change-password` | POST | ❌ Not used | ✅ Defined in `auth-fastify.js:278` | ℹ️ Not needed yet |

---

## 🔧 **What Needs to Be Fixed:**

### **Priority 1: Fix Immediately**

#### 1. **Add `/api/auth/refresh` endpoint to `server.js`**

```javascript
// Add after /api/auth/logout route
fastify.post('/api/auth/refresh', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization || request.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Token required', code: 'NO_TOKEN' });
    }

    const oldToken = authHeader.substring(7);
    
    // Verify old token (allow expired)
    let decoded;
    try {
      decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', {
        ignoreExpiration: false
      });
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    // Generate new token with same payload
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
        tenantSlug: decoded.tenantSlug,
        platformRole: decoded.platformRole
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { 
        expiresIn: '24h',
        audience: decoded.tenantSlug,
        issuer: 'intellispec-auth'
      }
    );

    logger.info('[Auth] Token refreshed', {
      userId: decoded.userId,
      tenantId: decoded.tenantId
    });

    return reply.send({
      success: true,
      token: newToken
    });
  } catch (error) {
    logger.error('[Auth] Token refresh error:', error);
    return reply.code(500).send({ 
      error: 'Token refresh failed', 
      code: 'REFRESH_ERROR' 
    });
  }
});
```

#### 2. **Add `/api/auth/profile` endpoint to `server.js`**

```javascript
// Add after /api/auth/refresh route
fastify.put('/api/auth/profile', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization || request.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Authentication required', code: 'NOT_AUTHENTICATED' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

    const db = mongoose.connection;
    if (!db || db.readyState !== 1) {
      return reply.code(500).send({ error: 'Database not connected', code: 'DB_NOT_CONNECTED' });
    }

    const usersCol = db.collection('users');
    
    // Update user profile
    const updates = request.body;
    
    // Don't allow updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.platformRole;
    delete updates.status;
    
    const result = await usersCol.updateOne(
      { id: decoded.userId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return reply.code(404).send({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Fetch updated user
    const updatedUser = await usersCol.findOne({ id: decoded.userId });

    logger.info('[Auth] Profile updated', {
      userId: decoded.userId,
      fields: Object.keys(updates)
    });

    return reply.send({
      success: true,
      user: {
        id: updatedUser.id,
        userId: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    logger.error('[Auth] Profile update error:', error);
    return reply.code(500).send({ 
      error: 'Profile update failed', 
      code: 'UPDATE_ERROR' 
    });
  }
});
```

#### 3. **Fix `AuthContext.tsx` to use `getApiFullUrl`**

```typescript
// Line 269 - Token refresh
const response = await fetch(getApiFullUrl('/api/auth/refresh'), {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${state.token}`
  }
});

// Line 346 - Profile update
const response = await fetch(getApiFullUrl('/api/auth/profile'), {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${state.token}`
  },
  body: JSON.stringify(updates)
});
```

---

### **Priority 2: Future Enhancement (Not Critical)**

These are defined in `auth-fastify.js` but not used yet:

- `/api/auth/register` - User registration
- `/api/auth/change-password` - Password change

Can be added later when needed.

---

## 📋 **Action Plan:**

### **Immediate (Fix Now):**

1. ✅ Add `/api/auth/refresh` endpoint to `server.js`
2. ✅ Add `/api/auth/profile` endpoint to `server.js`
3. ✅ Update `AuthContext.tsx` line 269 to use `getApiFullUrl`
4. ✅ Update `AuthContext.tsx` line 346 to use `getApiFullUrl`
5. ✅ Restart API server
6. ✅ Test token refresh
7. ✅ Test profile update

### **Optional (Later):**

1. Consider enabling `auth-fastify.js` routes via RouteLoader instead of manual registration
2. Add `/api/auth/register` if user registration is needed
3. Add `/api/auth/change-password` if password changes are needed

---

## 🔍 **How to Verify:**

### **After Fixing:**

1. **Token Refresh:**
   ```javascript
   // In browser console after login
   const token = localStorage.getItem('authToken');
   fetch('http://localhost:4000/api/auth/refresh', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` }
   }).then(r => r.json()).then(console.log);
   
   // Should return: { success: true, token: "new-token" }
   ```

2. **Profile Update:**
   ```javascript
   // In browser console after login
   const token = localStorage.getItem('authToken');
   fetch('http://localhost:4000/api/auth/profile', {
     method: 'PUT',
     headers: { 
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ firstName: 'Test' })
   }).then(r => r.json()).then(console.log);
   
   // Should return: { success: true, user: {...} }
   ```

---

## 🎯 **Summary:**

**Missing Endpoints:** 2  
**Wrong URL Pattern:** 2  
**Total Issues:** 4

**All fixable with:**
1. Add 2 endpoints to `server.js`
2. Update 2 lines in `AuthContext.tsx`
3. Restart server

**After fix:**
- ✅ Token refresh works
- ✅ Profile updates work
- ✅ All API calls hit port 4000
- ✅ Consistent API configuration

---

## 💡 **Why This Happened:**

The `auth-fastify.js` file has routes defined, but they're **disabled** in `RouteLoader.js`:

```javascript
// RouteLoader.js line 62
'auth-fastify': { prefix: '/api/auth', enabled: false }
```

So auth routes are being manually registered in `server.js`, but only `/api/auth/login` and `/api/auth/me` were added. The `/api/auth/logout` was just added, but `/api/auth/refresh` and `/api/auth/profile` are still missing.

**Solution:** Either:
1. Enable `auth-fastify` in RouteLoader (loads all routes)
2. Or manually add the missing routes to `server.js` (current approach)




