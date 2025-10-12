# 🔍 Vector Service Logging Guide

**Complete visibility for vector embedding service startup and operation**

---

## 📊 **Startup Logs - Complete Flow**

### **Scenario 1: Service Starts Successfully** ✅

When `ENABLE_VECTOR_SERVICE !== 'false'` and all conditions are met:

```javascript
// Step 1: DatabaseManager connection
logger.info('Vector Update Service using DatabaseManager connection');

// Step 2: Document discovery
// (Internal processing - discovers document types)

// Step 3: Change streams started
// (Internal processing - sets up MongoDB change streams)

// Step 4: Service ready
logger.info('Monitoring X document types', { 
  // Where X = number of document types found
});

// Step 5: Server confirmation (NEW!)
logger.info('Vector Update Service started successfully', {
  embeddingModel: 'text-embedding-3-small',
  monitoring: true,
  healthEndpoint: '/api/vector-service/health',
  metricsEndpoint: '/api/vector-service/metrics'
});
```

**Example Output:**
```
[INFO] Vector Update Service using DatabaseManager connection
[INFO] Monitoring 8 document types
[INFO] Vector Update Service started successfully {
  embeddingModel: 'text-embedding-3-small',
  monitoring: true,
  healthEndpoint: '/api/vector-service/health',
  metricsEndpoint: '/api/vector-service/metrics'
}
```

---

### **Scenario 2: Service Disabled** 🚫

When `ENABLE_VECTOR_SERVICE === 'false'` in `.env`:

```javascript
logger.info('Vector Update Service disabled', { 
  reason: 'ENABLE_VECTOR_SERVICE environment variable set to false' 
});
```

**Example Output:**
```
[INFO] Vector Update Service disabled {
  reason: 'ENABLE_VECTOR_SERVICE environment variable set to false'
}
```

---

### **Scenario 3: Service Failed to Start** ❌

When service encounters an error during startup:

```javascript
logger.error('Failed to start Vector Update Service', {
  error: error.message,
  stack: error.stack
});
```

**Common Failure Reasons:**
1. **Missing OpenAI API Key**
   ```
   [ERROR] Failed to start Vector Update Service {
     error: 'OpenAI API key is required',
     stack: '...'
   }
   ```

2. **Database Not Healthy**
   ```
   [ERROR] Failed to start Vector Update Service {
     error: 'DatabaseManager is not healthy. Cannot start Vector Update Service.',
     stack: '...'
   }
   ```

3. **OpenAI API Error**
   ```
   [ERROR] Failed to start Vector Update Service {
     error: 'Invalid API key provided',
     stack: '...'
   }
   ```

---

## 🔄 **Runtime Logs**

### **Production Mode (`NODE_ENV=production`)**

When `monitoring: true`, the service logs metrics every 60 seconds:

```javascript
logger.info('📊 Vector Update Service Metrics:');
logger.info('  ⏱️  Uptime: 3600s');
logger.info('  📄 Documents processed: 150');
logger.info('  🤖 Embeddings generated: 150');
logger.info('  ❌ Errors: 0');
logger.info('  🕐 Last activity: 2024-10-04T12:30:00.000Z');
logger.info('  ⏳ Pending updates: 5');
```

### **Development Mode (`NODE_ENV=development`)**

Monitoring is **disabled** by default. Only startup logs are shown.

To enable monitoring in development:
```javascript
// In server.js
vectorService = new VectorUpdateService({
  openaiKey: process.env.OPENAI_API_KEY,
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  monitoring: true  // Force enable
});
```

---

## 🎯 **Document Processing Logs**

When a document is created/updated and triggers embedding generation:

```javascript
// Debug level (not shown in production unless LOG_LEVEL=debug)
logger.debug('Processing agent request', {
  agentType: 'inspection',
  hasVoice: true,
  imageCount: 3,
  hasContext: true
});
```

### **Error Logs During Processing**

**Duplicate Key Conflict (Retry):**
```javascript
logger.warn('⚠️ Duplicate key conflict for document 507f1f77bcf86cd799439011, retrying (1/3)...');
```

**Document Too Large:**
```javascript
logger.warn('⚠️ Document too large for change stream processing (documents). Skipping vector updates for large documents.');
```

**Semantic Text Truncated:**
```javascript
logger.warn('Semantic text truncated from 10000 to 8000 characters for document 507f1f77bcf86cd799439011');
```

**Embedding Generation Failed:**
```javascript
logger.error('❌ Embedding generation attempt 1 failed: Rate limit exceeded');
```

**Processing Failed (After Retries):**
```javascript
logger.error('❌ Failed to process document 507f1f77bcf86cd799439011 after 3 attempts');
```

---

## 🔧 **Troubleshooting**

### **"I don't see any vector service logs"**

**Check 1: Is it enabled?**
```bash
# In .env
ENABLE_VECTOR_SERVICE=true  # or don't set it (defaults to enabled)
```

**Check 2: Did it fail to start?**
Search logs for:
```
Failed to start Vector Update Service
```

**Check 3: Missing OpenAI API Key?**
```bash
# In .env
OPENAI_API_KEY=sk-your-key-here
```

**Check 4: Database not connected?**
Vector service starts AFTER database connection. Look for:
```
DatabaseManager connected successfully
```

---

### **"I see 'using DatabaseManager connection' but nothing else"**

This means:
1. ✅ Service connected to database
2. ⏳ Currently discovering document types
3. ⏳ Setting up change streams

**Wait a moment, then you should see:**
```
Monitoring X document types
Vector Update Service started successfully
```

**If stuck here for >10 seconds:**
- Check database has documents
- Check database permissions
- Look for errors in logs

---

### **"Service started but no embedding logs"**

**Expected Behavior:**
- Service only logs when documents are created/updated
- No documents changing = no logs (this is normal)

**To trigger embeddings:**
1. Create/update a document via API
2. Wait 2 seconds (debounce delay)
3. Check for processing logs

**Verify service is running:**
```bash
curl http://localhost:4000/api/vector-service/health

# Should return:
{
  "status": "healthy",
  "metrics": {
    "documentsProcessed": 0,
    "embeddingsGenerated": 0,
    "errors": 0,
    "isRunning": true,
    "documentTypes": 8,
    "activeChangeStreams": 1,
    "pendingUpdates": 0
  }
}
```

---

### **"Monitoring logs not showing"**

**Check 1: Environment**
```bash
NODE_ENV=production  # Monitoring only enabled in production by default
```

**Check 2: Force Enable**
```javascript
// In server.js
monitoring: true  // Instead of: process.env.NODE_ENV === 'production'
```

**Check 3: Wait 60 seconds**
Monitoring logs appear every 60 seconds, not immediately.

---

## 📋 **Complete Startup Log Sequence**

### **Successful Startup (All Logs):**

```
[INFO] Framework components initialized successfully
[INFO] Route registration summary { registered: 23, failed: 0 }
[INFO] DatabaseManager connecting to MongoDB...
[INFO] DatabaseManager connected successfully {
  maxPoolSize: 50,
  minPoolSize: 5,
  currentConnections: 5
}
[INFO] Vector Update Service using DatabaseManager connection
[INFO] Monitoring 8 document types
[INFO] Vector Update Service started successfully {
  embeddingModel: 'text-embedding-3-small',
  monitoring: true,
  healthEndpoint: '/api/vector-service/health',
  metricsEndpoint: '/api/vector-service/metrics'
}
[INFO] Server started successfully {
  port: 4000,
  host: '0.0.0.0',
  env: 'production',
  endpoints: {
    health: 'http://0.0.0.0:4000/health',
    metrics: 'http://0.0.0.0:4000/metrics',
    api: 'http://0.0.0.0:4000/api'
  }
}
```

---

## ✅ **Verification Checklist**

After server starts, you should see:

- [ ] `"Framework components initialized successfully"`
- [ ] `"Route registration summary"`
- [ ] `"DatabaseManager connected successfully"`
- [ ] `"Vector Update Service using DatabaseManager connection"`
- [ ] `"Monitoring X document types"` (where X > 0)
- [ ] `"Vector Update Service started successfully"` **← NEW!**
- [ ] `"Server started successfully"`

**All present?** ✅ Service is running correctly!

---

## 🎯 **Quick Reference**

| Log Message | Meaning | Action |
|------------|---------|--------|
| `"Vector Update Service started successfully"` | ✅ Service running | None - all good! |
| `"Vector Update Service disabled"` | 🚫 Service off | Enable if needed |
| `"Failed to start Vector Update Service"` | ❌ Startup failed | Check error details |
| `"Monitoring X document types"` | ✅ Service ready | X should be > 0 |
| `"using DatabaseManager connection"` | ⏳ Starting up | Wait for "started successfully" |

---

## 🚀 **What Changed**

### **Before:**
```javascript
await vectorService.start();
// No confirmation log!

// Only internal logs:
// "Vector Update Service using DatabaseManager connection"
// "Monitoring 8 document types"
```

### **After:**
```javascript
await vectorService.start();

logger.info('Vector Update Service started successfully', {
  embeddingModel: 'text-embedding-3-small',
  monitoring: true,
  healthEndpoint: '/api/vector-service/health',
  metricsEndpoint: '/api/vector-service/metrics'
});
```

**Benefit:** Clear, unambiguous confirmation that the service is ready!

---

**Last Updated:** 2025-10-04  
**Status:** ✅ Complete visibility for all scenarios

