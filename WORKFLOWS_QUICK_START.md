# 🚀 Workflows Quick Start Guide

**Production-Ready Workflow System - Quick Reference**

---

## 📦 **Installation**

All dependencies already installed. No additional setup required.

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐
│  Workflow       │
│  Metadata       │ ← JSON configuration
│  (JSON)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ WorkflowFactory │ ← Creates StateGraph from metadata
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ExecutionEngine │ ← Manages workflow lifecycle
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   LangGraph     │ ← Executes agents
│   (Agents)      │
└─────────────────┘
```

---

## 🎯 **Core Components**

### **1. BaseAgent** (`api/workflows/agents/BaseAgent.js`)
Abstract base class for all agents.

**Key Methods:**
- `invoke(inputs, config)` - LangGraph Runnable interface
- `process(inputs)` - Main processing logic
- `execute(inputs)` - Override this in subclasses

### **2. AgentRegistry** (`api/workflows/agents/AgentRegistry.js`)
Factory for creating agents from metadata.

**Key Feature:** **DynamicAgent** - metadata-driven AI processing via `AIService`

### **3. DataAggregatorAgent** (`api/workflows/agents/DataAggregatorAgent.js`)
Aggregates data from multiple sources with safe formula evaluation.

### **4. WorkflowRouter** (`api/workflows/factory/WorkflowRouter.js`)
Handles conditional routing between agents.

### **5. WorkflowFactory** (`api/workflows/factory/WorkflowFactory.js`)
Creates LangGraph workflows from metadata.

### **6. ExecutionEngine** (`api/workflows/execution/ExecutionEngine.js`)
**Production-ready workflow execution manager.**

---

## 💻 **Usage Examples**

### **Example 1: Execute a Workflow**

```javascript
const ExecutionEngine = require('./api/workflows/execution/ExecutionEngine');
const WorkflowFactory = require('./api/workflows/factory/WorkflowFactory');
const AgentRegistry = require('./api/workflows/agents/AgentRegistry');
const WorkflowRouter = require('./api/workflows/factory/WorkflowRouter');

// Load workflow metadata from JSON or database
const workflowMetadata = require('./api/workflows/metadata/sample-piping-inspection.json');

// Initialize components
const workflowRouter = new WorkflowRouter();
const workflowFactory = new WorkflowFactory(AgentRegistry, workflowRouter);
const executionEngine = new ExecutionEngine(workflowFactory);

// Execute workflow
const result = await executionEngine.executeWorkflow(
  workflowMetadata,
  {
    // Inputs
    voiceTranscript: "This is a piping inspection for line P-101...",
    images: ["https://example.com/image1.jpg"],
    context: { inspectorName: "John Doe" }
  },
  {
    // Execution context
    userId: "user_123",
    tenantId: "tenant_456",
    isPlatformAdmin: false,
    request: fastifyRequest // Fastify request object
  }
);

console.log('Execution Result:', result);
// Output:
// {
//   executionId: "exec_abc123",
//   status: "completed",
//   result: { ... agent outputs ... },
//   duration: 3456,
//   metadata: { agentCount: 7, ... }
// }
```

---

### **Example 2: Monitor Execution**

```javascript
// Get real-time status
const status = await executionEngine.getExecutionStatus(
  "exec_abc123",
  { userId: "user_123", tenantId: "tenant_456", request }
);

console.log('Status:', status);
// Output:
// {
//   id: "exec_abc123",
//   status: "running",
//   isActive: true,
//   runningTime: 1234,
//   workflowId: "piping-inspection",
//   startedAt: "2025-10-04T10:00:00Z",
//   ...
// }
```

---

### **Example 3: Cancel Execution**

```javascript
const result = await executionEngine.cancelExecution(
  "exec_abc123",
  { userId: "user_123", tenantId: "tenant_456", request }
);

console.log('Cancelled:', result);
// Output:
// {
//   executionId: "exec_abc123",
//   status: "cancelled",
//   message: "Execution cancelled successfully"
// }
```

---

### **Example 4: Get Execution Statistics**

```javascript
const stats = await executionEngine.getExecutionStats(
  {
    workflowId: "piping-inspection",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  },
  { userId: "user_123", tenantId: "tenant_456", request }
);

console.log('Statistics:', stats);
// Output:
// {
//   total: 150,
//   completed: 135,
//   failed: 10,
//   cancelled: 5,
//   avgDuration: 2345,
//   successRate: 0.90
// }
```

---

### **Example 5: List Recent Executions**

```javascript
const executions = await executionEngine.listExecutions(
  {
    workflowId: "piping-inspection",
    status: "completed",
    page: 1,
    limit: 10
  },
  { userId: "user_123", tenantId: "tenant_456", request }
);

console.log('Executions:', executions);
// Output:
// {
//   data: [ {...}, {...}, ... ],
//   total: 150,
//   page: 1,
//   limit: 10,
//   pages: 15
// }
```

---

## 📝 **Workflow Metadata Format**

```json
{
  "id": "my-workflow",
  "name": "My Workflow",
  "description": "Description of workflow",
  "agents": [
    {
      "id": "agent1",
      "type": "DynamicAgent",
      "agentType": "EquipmentIdentificationAgent",
      "prompt": "Identify equipment from voice and images...",
      "model": "gpt-4o",
      "reasoning": {
        "reasoningEffort": "high"
      }
    },
    {
      "id": "agent2",
      "type": "DataAggregatorAgent",
      "sources": ["agent1"]
    }
  ],
  "connections": [
    { "from": "START", "to": "agent1" },
    { "from": "agent1", "to": "agent2", "condition": "confidence > 0.7" },
    { "from": "agent2", "to": "END" }
  ],
  "entryPoint": "START"
}
```

---

## 🔐 **Security Features**

1. ✅ **Safe Formula Evaluation** - No eval, no Function constructor
2. ✅ **Input Validation** - All inputs validated before processing
3. ✅ **Tenant Isolation** - All executions are tenant-scoped
4. ✅ **Audit Trail** - All operations logged for compliance
5. ✅ **Error Recovery** - Graceful error handling and cleanup

---

## 📊 **Observability**

Every workflow execution automatically:
- ✅ Logs to structured logs (Winston)
- ✅ Creates audit trail entries
- ✅ Tracks performance metrics
- ✅ Records execution history

**Log Example:**
```javascript
{
  "level": "info",
  "message": "Workflow execution completed successfully",
  "executionId": "exec_abc123",
  "workflowId": "piping-inspection",
  "duration": 3456,
  "tenantId": "tenant_456",
  "timestamp": "2025-10-04T10:05:23.456Z"
}
```

---

## 🎯 **Best Practices**

### **1. Always Validate Metadata**

```javascript
const validation = workflowFactory.validateMetadata(metadata);
if (!validation.isValid) {
  throw new Error(`Invalid metadata: ${validation.errors.join(', ')}`);
}
```

### **2. Use Tenant Context**

```javascript
// Always pass tenant context for data isolation
const context = {
  userId: request.user.id,
  tenantId: request.user.tenantId,
  isPlatformAdmin: request.user.isPlatformAdmin,
  request
};
```

### **3. Handle Errors Gracefully**

```javascript
try {
  const result = await executionEngine.executeWorkflow(...);
} catch (error) {
  // Errors are already logged and audited
  // Just handle the user-facing response
  reply.status(500).send({ error: error.message });
}
```

### **4. Monitor Active Executions**

```javascript
// Check active executions before shutdown
const activeCount = executionEngine.getActiveExecutionsCount();
if (activeCount > 0) {
  logger.warn(`${activeCount} executions still running`);
  // Wait or cancel them
}
```

---

## 🚀 **API Routes (Example)**

```javascript
// Execute workflow
fastify.post('/api/workflows/:workflowId/execute', async (request, reply) => {
  const { workflowId } = request.params;
  const inputs = request.body;

  // Load metadata from database
  const metadata = await loadWorkflowMetadata(workflowId);

  // Execute
  const result = await executionEngine.executeWorkflow(metadata, inputs, {
    userId: request.user.id,
    tenantId: request.user.tenantId,
    request
  });

  reply.send(result);
});

// Get execution status
fastify.get('/api/executions/:executionId', async (request, reply) => {
  const { executionId } = request.params;

  const status = await executionEngine.getExecutionStatus(executionId, {
    userId: request.user.id,
    tenantId: request.user.tenantId,
    request
  });

  reply.send(status);
});

// Cancel execution
fastify.post('/api/executions/:executionId/cancel', async (request, reply) => {
  const { executionId } = request.params;

  const result = await executionEngine.cancelExecution(executionId, {
    userId: request.user.id,
    tenantId: request.user.tenantId,
    request
  });

  reply.send(result);
});

// List executions
fastify.get('/api/executions', async (request, reply) => {
  const filters = request.query;

  const executions = await executionEngine.listExecutions(filters, {
    userId: request.user.id,
    tenantId: request.user.tenantId,
    request
  });

  reply.send(executions);
});
```

---

## 📚 **Additional Resources**

- **Workflow Metadata Examples:** `api/workflows/metadata/`
- **Core Documentation:** `api/core/README.md`
- **Architecture Guide:** `WORKFLOWS_REFACTORING_COMPLETE.md`

---

## ❓ **FAQ**

**Q: Can I use custom agents?**  
A: Yes! Extend `BaseAgent` and register in `AgentRegistry`.

**Q: How do I debug workflow execution?**  
A: Check logs at `logs/combined.log` with structured JSON entries.

**Q: Can workflows access external APIs?**  
A: Yes, via `AIService` or custom logic in agents.

**Q: Are executions persisted?**  
A: Yes, all executions are stored in MongoDB via `ExecutionRepository`.

**Q: Can I retry failed workflows?**  
A: Yes, retrieve the execution and re-run with same inputs.

---

**🎉 Ready to build powerful, metadata-driven workflows!**

