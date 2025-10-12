# Quick Setup: API Configuration Framework

## ✅ Step 1: Create `.env` file

Create `.env` in the project root:

```env
# API Configuration
REACT_APP_API_BASE=http://localhost:4000

# Copy other settings from env.sample
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
```

## ✅ Step 2: Wrap App with Diagnostics (Optional but Recommended)

Edit `src/App.tsx` or `src/index.tsx`:

```typescript
import { ApiConfigDiagnostics } from './components/diagnostics/ApiConfigDiagnostics';

function App() {
  return (
    <ApiConfigDiagnostics>
      {/* Your existing app code */}
      <Router>
        ...
      </Router>
    </ApiConfigDiagnostics>
  );
}
```

## ✅ Step 3: Restart Servers

```bash
# Stop both servers (Ctrl+C)

# Clear cache
rm -rf node_modules/.cache

# Restart API server
node api/server.js

# In another terminal, restart frontend
npm start
```

## ✅ Step 4: Verify Configuration

1. Open browser console
2. Look for: `[API Config] ✅ API Configuration loaded`
3. Run: `window.__API_CONFIG__.getDebugInfo()`
4. Should show port 4000 (not 4001)

## ✅ Step 5: Clear Browser Storage

In browser console:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## ✅ Step 6: Test

1. Log in as `superadmin@pksti.com`
2. Navigate to inspections dashboard
3. Open Network tab (F12)
4. Verify all API calls go to `localhost:4000` (not 4001)
5. Inspections should now load correctly

## 🎉 Done!

Your API configuration is now centralized and all gadgets will use the correct port automatically.

## 🔍 Troubleshooting

If you still see port 4001:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check `.env` file exists and has correct value
3. Ensure dev server was fully restarted
4. Check console for diagnostic errors

For more details, see `API_CONFIGURATION_GUIDE.md`.




