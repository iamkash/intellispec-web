# API Configuration Framework Guide

## 🎯 Overview

This project uses a **centralized API configuration system** to prevent port mismatch issues and ensure all parts of the application use the same API endpoint.

## 📋 Key Components

### 1. **Centralized Config** (`src/config/api.config.ts`)
- Single source of truth for all API endpoints
- Automatic port detection and validation
- Runtime diagnostics and error detection
- Debug utilities for troubleshooting

### 2. **BaseGadget Integration** (`src/components/library/gadgets/base.tsx`)
- All gadgets automatically use the centralized config
- Relative URLs (`/api/inspections`) are converted to absolute URLs
- No manual URL construction needed

### 3. **Diagnostics Component** (`src/components/diagnostics/ApiConfigDiagnostics.tsx`)
- Runs on app startup
- Detects configuration issues
- Shows warnings in development mode
- Validates API connectivity

## 🔧 Configuration Methods

### Method 1: Environment Variables (Recommended)

Create `.env` file in project root:

```env
REACT_APP_API_BASE=http://localhost:4000
```

**Why this works:**
- Explicit configuration
- Works across all environments
- Easy to change for different deployments

### Method 2: Auto-Detection (Fallback)

If no environment variable is set:
- **Development**: Automatically uses `http://localhost:4000`
- **Production**: Uses same origin (reverse proxy assumed)

## 🚀 Usage

### In Components

```typescript
import { apiConfig } from '@/config';

// Get base URL
const baseUrl = apiConfig.getBaseUrl(); // 'http://localhost:4000'

// Get full URL for API endpoints
const fullUrl = apiConfig.getFullUrl('/api/inspections'); 
// 'http://localhost:4000/api/inspections'

// Static files remain relative (served by frontend)
const dataUrl = apiConfig.getFullUrl('/data/mock-data/file.json');
// '/data/mock-data/file.json' (unchanged - served by frontend dev server)

// Test connection
const isOnline = await apiConfig.testConnection();
```

**Important:** The framework only converts `/api/*` paths to absolute URLs. Other paths like `/data/*`, `/images/*`, etc., remain relative and are served by the frontend dev server or CDN.

### In Gadgets (Automatic)

```typescript
// Just use relative URLs - they're automatically resolved!
const response = await BaseGadget.makeAuthenticatedFetch('/api/inspections');

// Or absolute URLs work too
const response = await BaseGadget.makeAuthenticatedFetch('http://localhost:4000/api/inspections');
```

### In Workspace Metadata (No Changes Needed)

```json
{
  "dataUrl": "/api/inspections",
  "optionsUrl": "/api/options/companies"
}
```

**API paths** (`/api/*`) are automatically converted to absolute URLs pointing to the API server.

**Static data paths** (`/data/*`) remain relative and are served from the frontend:

```json
{
  "dataUrl": "/data/mock-data/forms/inspection-quicklinks-data.json"
}
```

This will load from `public/data/mock-data/forms/inspection-quicklinks-data.json`.

## 🔍 Debugging

### Browser Console

```javascript
// Get debug information
window.__API_CONFIG__.getDebugInfo()

// Output:
// {
//   initialized: true,
//   config: { baseUrl: 'http://localhost:4000', port: 4000, ... },
//   environment: { NODE_ENV: 'development', REACT_APP_API_BASE: '...', ... },
//   window: { origin: 'http://localhost:3000', hostname: 'localhost', ... }
// }
```

### Check Configuration

```javascript
// Test if API is reachable
await window.__API_CONFIG__.testConnection()
```

## ⚠️ Common Issues & Solutions

### Issue: APIs hitting port 4001 instead of 4000

**Cause:** Stale React dev server configuration

**Solution:**
1. Stop React dev server (Ctrl+C)
2. Delete cache: `rm -rf node_modules/.cache`
3. Restart dev server: `npm start`
4. Clear browser storage and reload

### Issue: 404 errors on all API calls

**Cause:** API server not running or wrong base URL

**Solution:**
1. Check API server is running: `netstat -ano | findstr 4000`
2. Verify `.env` file has correct `REACT_APP_API_BASE`
3. Check console for diagnostic warnings
4. Test connection: `await window.__API_CONFIG__.testConnection()`

### Issue: Mixed HTTP/HTTPS errors

**Cause:** Protocol mismatch between frontend and API

**Solution:**
- Set explicit protocol in `.env`:
  ```env
  REACT_APP_API_BASE=http://localhost:4000
  ```

## 📊 Validation Checks

The framework automatically validates:

✅ **Port Check**: Warns if port 4001 is detected (should be 4000)
✅ **Connectivity**: Tests `/api/health` endpoint
✅ **Environment**: Validates `.env` configuration
✅ **URL Format**: Checks for malformed URLs

## 🎓 Best Practices

### DO ✅

1. **Use relative URLs** in workspace metadata:
   ```json
   "dataUrl": "/api/inspections"
   ```

2. **Import from centralized config**:
   ```typescript
   import { getApiFullUrl } from '@/config';
   ```

3. **Set REACT_APP_API_BASE** in `.env` for clarity

4. **Test after configuration changes**:
   ```bash
   npm start
   # Then check console for diagnostics
   ```

### DON'T ❌

1. **Don't hardcode ports** in components:
   ```typescript
   // ❌ BAD
   fetch('http://localhost:4001/api/inspections')
   
   // ✅ GOOD
   fetch(getApiFullUrl('/api/inspections'))
   ```

2. **Don't use multiple API base utilities**:
   ```typescript
   // ❌ BAD (deprecated)
   import { getApiBase } from '../utils/apiBase';
   
   // ✅ GOOD
   import { getApiBaseUrl } from '@/config';
   ```

3. **Don't bypass BaseGadget.makeAuthenticatedFetch**:
   ```typescript
   // ❌ BAD
   fetch('/api/inspections', { headers: { ... } })
   
   // ✅ GOOD
   BaseGadget.makeAuthenticatedFetch('/api/inspections')
   ```

## 🔄 Migration from Old System

### Before

```typescript
// Multiple files with hardcoded URLs
const url = 'http://localhost:4001/api/inspections'; // ❌
fetch(url);
```

### After

```typescript
// Centralized configuration
import { getApiFullUrl } from '@/config';
const url = getApiFullUrl('/api/inspections'); // ✅
fetch(url);
```

## 🧪 Testing

### Manual Test

1. Start API server: `node api/server.js` (should see port 4000)
2. Start frontend: `npm start`
3. Open browser console
4. Check diagnostics: `window.__API_CONFIG__.getDebugInfo()`
5. Verify all API calls hit port 4000 (Network tab)

### Automated Test

The `ApiConfigDiagnostics` component runs automatically on app startup and:
- Validates configuration
- Tests connectivity
- Shows errors in development mode
- Logs all checks to console

## 🌐 Production Deployment

### Using Reverse Proxy (Recommended)

```nginx
# nginx configuration
location /api {
    proxy_pass http://backend:4000;
}
```

Set `.env` for production:
```env
REACT_APP_API_BASE=https://yourdomain.com
```

### Using Absolute URLs

Set `.env` to point to API server:
```env
REACT_APP_API_BASE=https://api.yourdomain.com
```

## 📚 Additional Resources

- **API Configuration**: `src/config/api.config.ts`
- **BaseGadget**: `src/components/library/gadgets/base.tsx`
- **Diagnostics**: `src/components/diagnostics/ApiConfigDiagnostics.tsx`
- **Cursor Rules**: `.cursorrules` (search for "API Configuration")

## 🆘 Getting Help

If you encounter issues:

1. Check console for diagnostic messages
2. Run `window.__API_CONFIG__.getDebugInfo()` in browser console
3. Verify `.env` file exists and has correct values
4. Ensure API server is running on correct port
5. Clear cache and restart dev servers

For persistent issues, refer to the **Troubleshooting** section above or contact the development team.

