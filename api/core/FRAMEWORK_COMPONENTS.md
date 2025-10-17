# Framework-Level Components

Complete guide to cross-cutting concerns: logging, auditing, error handling, session management, and state management.

---

## 🎯 Overview

The framework provides enterprise-grade components that handle:

1. **Logging** - Structured, contextual logging
2. **Audit Trail** - Compliance-ready change tracking
3. **Request Context** - Request-scoped state management
4. **Error Handling** - Standardized error responses
5. **Session Management** - User session tracking (via request context)

---

## 📝 1. Logging System

### Logger.js

**Purpose:** Centralized, structured logging with context

**Features:**
- ✅ Contextual logging (tenant, user, request ID)
- ✅ Log levels (debug, info, warn, error)
- ✅ Structured JSON output for production
- ✅ Colorized console output for development
- ✅ Performance tracking
- ✅ Child loggers with inherited context

### Usage

**Basic Logging:**
```javascript
const { logger } = require('./core/Logger');

logger.info('Application started');
logger.warn('Slow query detected', { duration: 5000 });
logger.error('Database connection failed', error);
logger.debug('Processing item', { itemId: 123 });
```

**Contextual Logging:**
```javascript
const { createRequestLogger } = require('./core/Logger');

// In route handler
const requestLogger = createRequestLogger(request, tenantContext);

requestLogger.info('Processing inspection', {
  inspectionId: '123'
});
// Automatically includes: requestId, userId, tenantId, method, url
```

**Child Loggers:**
```javascript
const childLogger = logger.child({
  component: 'InspectionService',
  version: '1.0.0'
});

childLogger.info('Service initialized');
// Includes parent context + component info
```

**Performance Tracking:**
```javascript
const { withPerformanceTracking } = require('./core/Logger');

const trackedFunction = withPerformanceTracking(
  myFunction,
  'myOperation',
  logger
);

await trackedFunction(); // Logs duration automatically
```

### Configuration

**Environment Variables:**
```bash
LOG_LEVEL=debug      # debug, info, warn, error
NODE_ENV=production  # production = JSON, development = colorized
```

---

## 📊 2. Audit Trail System

### AuditTrail.js

**Purpose:** Compliance-ready change tracking

**Features:**
- ✅ Automatic event logging
- ✅ Who, What, When, Where tracking
- ✅ Change history with before/after
- ✅ Configurable retention policies
- ✅ Query capabilities

### Event Types

```javascript
'CREATE'           // Document created
'READ'             // Document accessed (optional)
'UPDATE'           // Document updated
'DELETE'           // Soft delete
'HARD_DELETE'      // Permanent delete (admin only)
'LOGIN'            // User login
'LOGOUT'           // User logout
'AUTH_FAILURE'     // Failed login attempt
'PERMISSION_DENIED'// Access denied
'DATA_EXPORT'      // Data exported
'SYSTEM_CHANGE'    // System configuration changed
```

### Usage

**Automatic Audit Logging:**
```javascript
// BaseRepository automatically logs all CRUD operations
const repository = new InspectionRepository(tenantContext);

await repository.create(data);  // Logs CREATE event
await repository.update(id, data);  // Logs UPDATE event with changes
await repository.delete(id);  // Logs DELETE event
```

**Manual Audit Logging:**
```javascript
const { AuditTrail } = require('./core/AuditTrail');

// Log authentication
await AuditTrail.logAuth(
  'user123',
  true,  // success
  {
    email: 'user@example.com',
    tenantId: 't_abc',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    requestId: 'req-123'
  }
);

// Log permission denied
await AuditTrail.logPermissionDenied(
  tenantContext,
  'inspection',
  'insp-123',
  'delete',
  { requestId: 'req-456' }
);

// Custom event
await AuditTrail.log({
  eventType: 'DATA_EXPORT',
  userId: 'user123',
  tenantId: 't_abc',
  action: 'Exported inspection data',
  metadata: { format: 'CSV', recordCount: 1000 }
});
```

### Querying Audit Trail

**Get resource history:**
```javascript
const history = await AuditTrail.getHistory('inspection', 'insp-123', {
  tenantId: 't_abc',
  limit: 50
});
```

**Get user activity:**
```javascript
const activity = await AuditTrail.getUserActivity('user123', {
  eventType: 'UPDATE',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  limit: 100
});
```

**Get tenant activity:**
```javascript
const activity = await AuditTrail.getTenantActivity('t_abc', {
  startDate: '2025-01-01',
  limit: 1000
});
```

### Retention Policy

```javascript
// Set retention when logging
await AuditTrail.log({
  ...event,
  retentionDays: 365  // Keep for 1 year
});

// Cleanup expired events
await AuditTrail.cleanup();
```

### Audit Event Structure

```javascript
{
  eventId: 'uuid',
  eventType: 'UPDATE',
  
  // Actor
  userId: 'user123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  isPlatformAdmin: false,
  
  // Context
  tenantId: 't_abc',
  requestId: 'req-123',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2025-10-04T12:00:00Z',
  
  // Target
  resourceType: 'inspection',
  resourceId: 'insp-123',
  
  // Changes
  action: 'Updated inspection insp-123',
  changes: {
    before: { status: 'draft' },
    after: { status: 'completed' }
  },
  
  // Result
  success: true,
  errorMessage: null
}
```

---

## 🔄 3. Request Context Management

### RequestContext.js

**Purpose:** Request-scoped state and session management

**Features:**
- ✅ Request metadata (ID, method, URL, IP, user agent)
- ✅ Tenant context integration
- ✅ Contextual logger
- ✅ Custom data storage
- ✅ AsyncLocalStorage for access anywhere
- ✅ Automatic request/response logging

### Usage

**In Route Handlers:**
```javascript
// Context automatically available via Fastify decorator
fastify.get('/api/documents', async (request, reply) => {
  const context = request.context;
  
  // Access context properties
  console.log(context.requestId);      // UUID
  console.log(context.userId);         // From JWT
  console.log(context.tenantId);       // From JWT
  console.log(context.isPlatformAdmin);// Boolean
  console.log(context.ipAddress);      // Client IP
  console.log(context.userAgent);      // Browser info
  
  // Use contextual logger
  context.logger.info('Processing request');
  
  // Store custom data
  context.set('startTime', Date.now());
  
  // Get custom data
  const startTime = context.get('startTime');
  
  // Get audit metadata
  const metadata = context.getAuditMetadata();
});
```

**Access Context Anywhere (AsyncLocalStorage):**
```javascript
const { RequestContextManager } = require('./core/RequestContext');

// In any function (repository, service, utility)
function someFunction() {
  const context = RequestContextManager.getCurrentContext();
  
  if (context) {
    context.logger.info('Doing something');
    console.log('User:', context.userId);
  }
}
```

**Middleware Registration:**
```javascript
const { RequestContextManager } = require('./core/RequestContext');

// In server.js
RequestContextManager.registerMiddleware(fastify);
```

### Request Context Properties

```javascript
{
  // Identification
  requestId: 'uuid',
  startTime: 1234567890,
  
  // HTTP Details
  method: 'GET',
  url: '/api/documents',
  path: '/api/documents',
  query: { page: 1 },
  params: {},
  headers: { ... },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  
  // Authentication
  tenantContext: TenantContext,
  userId: 'user123',
  tenantId: 't_abc',
  isPlatformAdmin: false,
  
  // Logging
  logger: ContextLogger,
  
  // Session
  session: { ... },
  
  // Custom Data
  data: Map,
  
  // Methods
  getDuration(): number,
  set(key, value): void,
  get(key): any,
  has(key): boolean,
  getAuditMetadata(): object,
  toJSON(): object
}
```

### Automatic Logging

**Request Started:**
```json
{
  "level": "info",
  "message": "Request started",
  "requestId": "uuid",
  "method": "GET",
  "url": "/api/documents",
  "userId": "user123",
  "tenantId": "t_abc"
}
```

**Request Completed:**
```json
{
  "level": "info",
  "message": "Request completed",
  "requestId": "uuid",
  "statusCode": 200,
  "duration": 45
}
```

**Slow Request:**
```json
{
  "level": "warn",
  "message": "Slow request",
  "requestId": "uuid",
  "statusCode": 200,
  "duration": 1500
}
```

---

## ⚠️ 4. Error Handling

### ErrorHandler.js

**Purpose:** Standardized error responses

**Features:**
- ✅ Standard error codes
- ✅ User-friendly messages
- ✅ Detailed logging
- ✅ Stack trace management
- ✅ Automatic error handling middleware

### Error Classes

```javascript
const {
  ValidationError,       // 400
  AuthenticationError,   // 401
  AuthorizationError,    // 403
  NotFoundError,         // 404
  ConflictError,         // 409
  RateLimitError,        // 429
  InternalServerError,   // 500
  DatabaseError          // 503
} = require('./core/ErrorHandler');
```

### Usage

**Throw Errors:**
```javascript
// Validation error
throw new ValidationError('Email is required', {
  field: 'email'
});

// Not found
throw new NotFoundError('Inspection', 'insp-123');

// Authorization
throw new AuthorizationError('Cannot access this resource', {
  resourceType: 'inspection',
  resourceId: 'insp-123',
  action: 'delete'
});

// Custom error
throw new AppError('Something went wrong', 'CUSTOM_ERROR', 400, {
  custom: 'data'
});
```

**Error Response Format:**
```json
{
  "error": "Inspection insp-123 not found",
  "code": "NOT_FOUND",
  "details": {
    "resource": "Inspection",
    "id": "insp-123"
  },
  "stack": "..."  // Only in development
}
```

**Validation Helpers:**
```javascript
const { ErrorHandler } = require('./core/ErrorHandler');

// Assert condition
ErrorHandler.assert(user.age >= 18, 'Must be 18 or older');

// Validate required fields
ErrorHandler.validateRequired(data, ['email', 'password', 'name']);
// Throws ValidationError with missing fields
```

**Async Handler Wrapper:**
```javascript
const { ErrorHandler } = require('./core/ErrorHandler');

fastify.get('/api/resource', ErrorHandler.asyncHandler(async (request, reply) => {
  // Any errors thrown here are automatically handled
  throw new NotFoundError('Resource', 'id-123');
}));
```

**Middleware Registration:**
```javascript
const { ErrorHandler } = require('./core/ErrorHandler');

// In server.js
ErrorHandler.registerMiddleware(fastify);
```

### Automatic Error Handling

**Mongoose Validation:**
```javascript
// Automatically converted to ValidationError with field details
```

**JWT Errors:**
```javascript
// JsonWebTokenError → 401 Invalid token
// TokenExpiredError → 401 Token expired
```

**Duplicate Key:**
```javascript
// MongoDB duplicate key → 409 Conflict
```

**Cast Error:**
```javascript
// Invalid ObjectId → 400 Invalid ID format
```

---

## 🔗 Integration Example

### Complete Route Handler

```javascript
const TenantContextFactory = require('../core/TenantContextFactory');
const InspectionRepository = require('../repositories/InspectionRepository');
const { NotFoundError, ValidationError } = require('../core/ErrorHandler');

fastify.get('/api/documents/:id', async (request, reply) => {
  // 1. Context automatically created by middleware
  const context = request.context;
  
  // 2. Log request
  context.logger.info('Fetching inspection', {
    inspectionId: request.params.id
  });
  
  // 3. Validate
  if (!request.params.id) {
    throw new ValidationError('Inspection ID is required');
  }
  
  // 4. Create repository (tenant filtering automatic)
  const tenantContext = TenantContextFactory.fromRequest(request);
  const repository = new InspectionRepository(tenantContext);
  
  // 5. Query data (audit trail automatic)
  const inspection = await repository.findById(request.params.id);
  
  // 6. Handle not found
  if (!inspection) {
    throw new NotFoundError('Inspection', request.params.id);
  }
  
  // 7. Log success
  context.logger.info('Inspection fetched successfully', {
    inspectionId: inspection.id
  });
  
  // 8. Return response
  return reply.send(inspection);
});
```

### What Happens Automatically

1. **Request Context Created** - Middleware creates context with metadata
2. **Logging Started** - "Request started" logged automatically
3. **Tenant Context** - Extracted from JWT/headers
4. **Repository Created** - With tenant context
5. **Query Executed** - Tenant filtering automatic
6. **Audit Trail** - All CRUD operations logged
7. **Logging Completed** - "Request completed" logged with duration
8. **Error Handling** - Any errors caught and formatted

---

## 🎯 Best Practices

### 1. Always Use Request Context

```javascript
// ✅ GOOD
async function processInspection(request) {
  const context = request.context;
  context.logger.info('Processing...');
}

// ❌ BAD
async function processInspection() {
  console.log('Processing...'); // No context
}
```

### 2. Use Contextual Loggers

```javascript
// ✅ GOOD
context.logger.info('Processing inspection', {
  inspectionId: '123'
});
// Includes: requestId, userId, tenantId, timestamp

// ❌ BAD
logger.info('Processing inspection 123');
// Missing context
```

### 3. Throw Proper Errors

```javascript
// ✅ GOOD
throw new NotFoundError('Inspection', id);

// ❌ BAD
throw new Error('Not found');
```

### 4. Let Framework Handle Auditing

```javascript
// ✅ GOOD - Automatic
await repository.create(data);  // Audit logged automatically

// ❌ BAD - Manual
await Model.create(data);
await AuditTrail.logCreate(...);  // Duplicate work
```

### 5. Access Context Anywhere

```javascript
// ✅ GOOD
const context = RequestContextManager.getCurrentContext();
if (context) {
  context.logger.debug('In utility function');
}

// ❌ BAD
// Pass logger/context as parameter everywhere
```

---

## 📊 Monitoring & Observability

### Log Aggregation

**Production Setup:**
```javascript
// Logs in JSON format
{
  "timestamp": "2025-10-04T12:00:00Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "uuid",
  "userId": "user123",
  "tenantId": "t_abc",
  "method": "GET",
  "url": "/api/documents",
  "statusCode": 200,
  "duration": 45
}
```

**Ship logs to:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- CloudWatch
- Application Insights

### Metrics to Track

**From Logs:**
- Request duration percentiles (p50, p95, p99)
- Error rates by endpoint
- Slow queries (>1s)
- Failed auth attempts
- Permission denied events

**From Audit Trail:**
- Changes per user
- Changes per tenant
- Most modified resources
- Failed operations

### Alerting

**Set alerts for:**
- High error rate (>1% requests)
- Slow requests (>5% over 1s)
- Failed authentication spikes
- Database errors
- Unauthorized access attempts

---

## 🧪 Testing

### Unit Tests

```javascript
const { RequestContext } = require('./core/RequestContext');
const TenantContext = require('./core/TenantContext');

describe('RequestContext', () => {
  it('provides audit metadata', () => {
    const mockRequest = {
      id: 'req-123',
      method: 'GET',
      url: '/api/test',
      headers: { 'user-agent': 'test' }
    };
    
    const context = new RequestContext(mockRequest);
    const metadata = context.getAuditMetadata();
    
    expect(metadata).toMatchObject({
      requestId: 'req-123',
      method: 'GET',
      url: '/api/test'
    });
  });
});
```

### Integration Tests

```javascript
describe('Error Handling', () => {
  it('handles NotFoundError correctly', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/documents/invalid-id?type=wizard'
    });
    
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: 'Document not found',
      code: 'NOT_FOUND'
    });
  });
});
```

---

## 📚 Summary

### Framework Components

1. **Logger** - Structured, contextual logging
2. **AuditTrail** - Compliance-ready change tracking
3. **RequestContext** - Request-scoped state
4. **ErrorHandler** - Standardized errors
5. **BaseRepository** - Integrates all components

### Automatic Features

- ✅ Request/response logging
- ✅ Performance tracking
- ✅ Audit trail for all CRUD operations
- ✅ Error formatting and logging
- ✅ Context propagation via AsyncLocalStorage

### Zero Boilerplate

Developers only write business logic:
```javascript
// This simple code gets:
// - Logging
// - Audit trail
// - Tenant filtering
// - Error handling
// - Performance tracking
// All automatically!

const repository = new InspectionRepository(tenantContext);
await repository.create(data);
```

---

*Framework documentation last updated: October 4, 2025*
