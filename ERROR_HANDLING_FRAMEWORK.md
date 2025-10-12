# 🛡️ Framework-Level Error Handling

## 🎯 Problem
API errors showed cryptic technical messages or no feedback at all → Poor user experience

## ✅ Solution
Centralized error handling with user-friendly messages and graceful degradation

---

## 📦 **What Was Created**

### **1. Error Handler Framework** (`src/utils/errorHandler.ts`)

**Features:**
- ✅ User-friendly error messages
- ✅ Automatic error categorization (network, auth, server, etc.)
- ✅ Toast notifications with proper severity
- ✅ Automatic login redirect for auth errors
- ✅ Non-blocking for non-critical errors
- ✅ Development logging

---

## 🚀 **Usage**

### **Option 1: Wrap API Calls** (Recommended)

```typescript
import { safeApiCall } from '../utils/errorHandler';
import { getApiFullUrl } from '../config/api.config';

// Automatically handles all errors
const deleteDocument = async (id: string) => {
  const data = await safeApiCall(
    () => fetch(getApiFullUrl(`/api/documents/${id}`), {
      method: 'DELETE'
    }),
    'Delete document'  // Context shown in error message
  );
  
  return data;
};
```

**What happens:**
- ✅ Success → Returns data
- ❌ Network error → Shows "Unable to connect to server" notification
- ❌ 401/403 → Shows "Please log in" and redirects to login
- ❌ 404 → Shows "Resource not found"  
- ❌ 500 → Shows "Server error occurred"

---

### **Option 2: Manual Error Handling**

```typescript
import { errorHandler } from '../utils/errorHandler';
import { getApiFullUrl } from '../config/api.config';

const deleteDocument = async (id: string) => {
  try {
    const response = await fetch(getApiFullUrl(`/api/documents/${id}`), {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      await errorHandler.handleApiError(response, 'Delete document');
    }
    
    return await response.json();
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      errorHandler.handleNetworkError(error, 'Delete document');
    } else {
      errorHandler.handleError(error, 'Delete document');
    }
  }
};
```

---

### **Option 3: Hook for React Components**

```typescript
import { useErrorHandler } from '../utils/errorHandler';

function MyComponent() {
  const { handleError, showSuccess, showLoading } = useErrorHandler();
  
  const deleteDocument = async (id: string) => {
    const hide = showLoading('Deleting document...');
    
    try {
      const response = await fetch(getApiFullUrl(`/api/documents/${id}`), {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        await handleError(response, 'Delete document');
        return;
      }
      
      hide();
      showSuccess('Document deleted successfully!');
      
    } catch (error) {
      hide();
      handleError(error, 'Delete document');
    }
  };
  
  return (...);
}
```

---

## 📋 **Error Messages**

### **User Sees:**
- ❌ Network error → "Unable to connect to server. Please check your internet connection."
- ❌ 401 → "Please log in to continue." (then redirects)
- ❌ 403 → "You do not have permission to perform this action."
- ❌ 404 → "The requested item was not found."
- ❌ 500 → "An unexpected error occurred. Please try again."
- ❌ 429 → "Too many requests. Please slow down."

### **Developer Sees (Console):**
```javascript
[Error Handler] {
  context: 'Delete document',
  error: {
    message: 'An unexpected error occurred',
    code: 'HTTP_500',
    statusCode: 500,
    severity: 'error'
  },
  timestamp: '2025-10-04T19:30:00.000Z'
}
```

---

## 🎨 **Notification Styles**

### **Error (Red)**
```typescript
// For critical errors
notification.error({
  message: 'Error',
  description: 'An unexpected error occurred',
  duration: 5
});
```

### **Warning (Orange)**
```typescript
// For rate limits, etc.
notification.warning({
  message: 'Warning',
  description: 'Too many requests. Please slow down.',
  duration: 4
});
```

### **Info (Blue)**
```typescript
// For 404, informational messages
notification.info({
  message: 'Information',
  description: 'The requested item was not found.',
  duration: 3
});
```

### **Success (Green)**
```typescript
errorHandler.showSuccess('Operation completed successfully!');
```

---

## 🔧 **Customization**

### **Add Custom Error Messages**

Edit `src/utils/errorHandler.ts`:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  // ... existing messages
  'CUSTOM_CODE': 'Your custom user-friendly message',
};
```

### **Change Notification Duration**

```typescript
// In errorHandler.ts, modify:
notification.error({
  message: 'Error',
  description,
  duration: 10  // Show for 10 seconds
});
```

### **Disable Auto-Redirect on Auth Error**

```typescript
// Comment out in errorHandler.ts:
// if (error.code === 'NOT_AUTHENTICATED' || ...) {
//   setTimeout(() => {
//     window.location.href = '/login';
//   }, 2000);
// }
```

---

## 🛠️ **Integration with BaseGadget**

The framework can be integrated into `BaseGadget.makeAuthenticatedFetch`:

```typescript
static async makeAuthenticatedFetch(url: string, options: RequestInit = {}) {
  try {
    const resolvedUrl = getApiFullUrl(url);
    const response = await fetch(resolvedUrl, {
      ...options,
      headers: { /* auth headers */ }
    });
    
    // Auto-handle errors for critical calls
    if (!response.ok && response.status >= 500) {
      const { errorHandler } = await import('../../../utils/errorHandler');
      
      // Don't block for logging/analytics
      if (!url.includes('/logs/') && !url.includes('/analytics/')) {
        await errorHandler.handleApiError(response, `Request to ${url}`);
      }
    }
    
    return response;
  } catch (error) {
    // Network error
    const { errorHandler } = await import('../../../utils/errorHandler');
    errorHandler.handleNetworkError(error, `Request to ${url}`);
    throw error;
  }
}
```

---

## 📊 **Benefits**

### **Before:**
```typescript
// User sees: "Error 500" or nothing
fetch('/api/documents/123', { method: 'DELETE' })
  .then(r => r.json())
  .catch(e => console.error(e));  // User has no idea what happened
```

### **After:**
```typescript
// User sees: "An unexpected error occurred. Please try again."
// With nice red notification that auto-closes
await safeApiCall(
  () => fetch(getApiFullUrl('/api/documents/123'), { method: 'DELETE' }),
  'Delete document'
);
```

**Result:**
- ✅ User-friendly messages
- ✅ Proper error categorization
- ✅ Visual feedback (notifications)
- ✅ Automatic handling
- ✅ Development logging
- ✅ Graceful degradation

---

## 🎉 **Summary**

✅ **Created:** Centralized error handling framework  
✅ **Features:** User-friendly messages, notifications, auto-redirect  
✅ **Usage:** Wrap API calls with `safeApiCall()` or use hooks  
✅ **Benefits:** Better UX, graceful error handling, consistent feedback  

**Now users see helpful messages instead of cryptic errors!** 🎯




