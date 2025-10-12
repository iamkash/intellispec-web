# Complete Cleanup & Fix for Port 4001 Issue

## 🔍 Problem Identified

A Node.js process is still running on port 4001, and your browser has cached the old JavaScript bundle that uses port 4001.

## ✅ Step-by-Step Fix

### Step 1: Stop ALL Node Processes

**Option A: Kill the specific process**
```powershell
# Kill the process on port 4001
Stop-Process -Id 29796 -Force

# Or kill all node processes (WARNING: This stops ALL Node apps)
Get-Process node | Stop-Process -Force
```

**Option B: Restart your computer** (cleanest option if unsure)

### Step 2: Clean Everything

```powershell
# Navigate to project folder
cd C:\Users\KashMohammed\intellispec-web

# Delete all caches
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force
```

### Step 3: Verify No Processes on 4000 or 4001

```powershell
# Check for processes on these ports
netstat -ano | findstr ":4000 :4001"

# Should return NOTHING
# If you see anything, kill those processes
```

### Step 4: Start ONLY the API Server (Port 4000)

```powershell
# Start API server on port 4000
node api/server.js

# You should see:
# "Server listening on port 4000"
```

### Step 5: In a NEW Terminal, Start Frontend

```powershell
# Start React dev server
npm start

# Wait for "Compiled successfully!"
```

### Step 6: Complete Browser Cleanup

**Open your browser and:**

1. **Open DevTools** (F12)
2. **Go to Application tab** (Chrome/Edge)
3. **Clear all storage:**
   - Local Storage → Right-click → Clear
   - Session Storage → Right-click → Clear
   - Cookies → Clear all
   - Cache Storage → Delete all

4. **Run in Console:**
```javascript
localStorage.clear();
sessionStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
```

5. **Close DevTools**

6. **Hard Refresh:**
   - Windows: `Ctrl + Shift + R`
   - Or: `Ctrl + F5`

### Step 7: Test the Configuration

**Before logging in, open browser console and run:**

```javascript
// Test URL resolution
if (window.__API_CONFIG__) {
  console.log('✅ API Config loaded!');
  console.log('Base URL:', window.__API_CONFIG__.getBaseUrl());
  console.log('Test URL:', window.__API_CONFIG__.getFullUrl('/api/inspections'));
  console.log('Full debug:', window.__API_CONFIG__.getDebugInfo());
} else {
  console.error('❌ API Config not found! Framework not loaded.');
}
```

**Expected output:**
```javascript
✅ API Config loaded!
Base URL: http://localhost:4000
Test URL: http://localhost:4000/api/inspections
```

**If you see port 4001 anywhere, the browser cache wasn't cleared properly.**

### Step 8: Log In Fresh

1. Go to login page
2. Login as `superadmin@pksti.com`
3. Tenant: `pksti`
4. Password: (your password)

### Step 9: Verify API Calls

1. Go to inspections dashboard
2. Open Network tab (F12)
3. Look at the `/api/inspections` request
4. **Request URL should be:** `http://localhost:4000/api/inspections`
5. **NOT:** `http://localhost:4001/api/inspections`

## 🔍 If Still Not Working

### Check 1: Verify API Config File Exists

```powershell
# Check if file exists
Test-Path src/config/api.config.ts

# Should return: True
```

### Check 2: Verify Import in base.tsx

```powershell
# Check for the import
Get-Content src/components/library/gadgets/base.tsx | Select-String "getApiFullUrl"

# Should show the import line
```

### Check 3: Check Console for Errors

Look for any errors in browser console related to:
- Import errors
- Module not found
- Compilation errors

### Check 4: Verify .env File

```powershell
# Check .env exists
Test-Path .env

# If not, create it:
Copy-Item env.sample .env

# Then edit .env and set:
# REACT_APP_API_BASE=http://localhost:4000
```

## 🎯 Root Cause

The issue was caused by:
1. **Old Node process on port 4001** still running
2. **Browser cached old JavaScript** that used port 4001
3. **React dev server not recompiling** the new code

The framework changes are correct, but the browser needs to load the new compiled code.

## 📞 Still Having Issues?

Run this diagnostic:

```javascript
// In browser console
console.log('=== DIAGNOSTIC ===');
console.log('1. API Config:', window.__API_CONFIG__ ? 'LOADED' : 'NOT LOADED');
console.log('2. Base URL:', window.__API_CONFIG__?.getBaseUrl());
console.log('3. Test Resolution:', window.__API_CONFIG__?.getFullUrl('/api/inspections'));
console.log('4. User Agent:', navigator.userAgent);
console.log('5. Location:', window.location.href);
```

Copy the output and we can debug further.




